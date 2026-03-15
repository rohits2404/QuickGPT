import Stripe from "stripe";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must be defined in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe Webhook Handler
 * POST /api/payment/webhook
 */
export const stripeWebhooks = async (request, response) => {
    const sig = request.headers["stripe-signature"];

    // Verify webhook signature
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        return response.status(400).json({ success: false, message: `Webhook Error: ${error.message}` });
    }

    // Handle event types
    try {
        switch (event.type) {
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;

                // Fetch associated checkout session
                const sessionList = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntent.id,
                });

                const session = sessionList.data[0];
                if (!session || !session.metadata) {
                    console.warn("Webhook: No session or metadata found for payment intent", paymentIntent.id);
                    break;
                }

                const { transactionId, appId } = session.metadata;

                // Ignore events not belonging to this app
                if (appId !== "quickgpt") {
                    console.log("Webhook: Ignored event from unknown appId:", appId);
                    break;
                }

                if (!transactionId) {
                    console.warn("Webhook: Missing transactionId in session metadata");
                    break;
                }

                // Find unpaid transaction
                const transaction = await Transaction.findOne({ _id: transactionId, isPaid: false });
                if (!transaction) {
                    console.warn("Webhook: Transaction not found or already paid:", transactionId);
                    break;
                }

                // Mark as paid first, then grant credits — prevents double credit on retry
                transaction.isPaid = true;
                await transaction.save();

                await User.updateOne(
                    { _id: transaction.userId },
                    { $inc: { credits: transaction.credits } }
                );

                console.log(`Webhook: Credits granted — userId: ${transaction.userId}, credits: ${transaction.credits}`);
                break;
            }

            default:
                console.log("Webhook: Unhandled event type:", event.type);
                break;
        }

        return response.status(200).json({ received: true });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return response.status(500).json({ success: false, message: "Internal server error" });
    }
};
