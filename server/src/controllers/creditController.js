import Stripe from "stripe";
import Transaction from "../models/Transaction.js";

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY Is Not Defined In Environment Variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const plans = [
    {
        _id: "basic",
        name: "Basic",
        price: 10,
        credits: 100,
        features: [
            "100 Text Generations",
            "50 Image Generations",
            "Standard Support",
            "Access To Basic Models",
        ],
    },
    {
        _id: "pro",
        name: "Pro",
        price: 20,
        credits: 500,
        features: [
            "500 Text Generations",
            "200 Image Generations",
            "Priority Support",
            "Access To Pro Models",
            "Faster Response Time",
        ],
    },
    {
        _id: "premium",
        name: "Premium",
        price: 30,
        credits: 1000,
        features: [
            "1000 Text Generations",
            "500 Image Generations",
            "24/7 VIP Support",
            "Access To Premium Models",
            "Dedicated Account Manager",
        ],
    },
];

/**
 * Get All Plans
 * GET /api/payment/plans
 */
export const getPlans = (req, res) => {
    return res.status(200).json({ success: true, plans });
};

/**
 * Purchase a Plan — creates a Stripe checkout session
 * POST /api/payment/purchase
 */
export const purchasePlans = async (req, res) => {
    try {
        const { planId } = req.body;
        const userId = req.user._id;

        if (!planId) {
            return res.status(400).json({ success: false, message: "Plan ID Is Required" });
        }

        const plan = plans.find((p) => p._id === planId);
        if (!plan) {
            return res.status(404).json({ success: false, message: "Invalid Plan Selected" });
        }

        const origin = req.headers.origin || process.env.CLIENT_URL;
        if (!origin) {
            return res.status(400).json({ success: false, message: "Request Origin Could Not Be Determined" });
        }

        const transaction = await Transaction.create({
            userId,
            planId: plan._id,
            amount: plan.price,
            credits: plan.credits,
            isPaid: false,
        });

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        unit_amount: plan.price * 100,
                        product_data: {
                            name: plan.name,
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${origin}/loading`,
            cancel_url: `${origin}`,
            metadata: {
                transactionId: transaction._id.toString(),
                appId: "quickgpt",
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        });

        return res.status(200).json({ success: true, url: session.url });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
