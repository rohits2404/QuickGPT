import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID Is Required"],
            index: true,
        },
        planId: {
            type: String,
            required: [true, "Plan ID Is Required"],
            enum: {
                values: ["basic", "pro", "premium"],
                message: "Plan ID Must Be One Of: basic, pro, premium",
            },
            trim: true,
        },
        amount: {
            type: Number,
            required: [true, "Amount Is Required"],
            min: [0, "Amount Cannot Be Negative"],
        },
        credits: {
            type: Number,
            required: [true, "Credits Is Required"],
            min: [1, "Credits Must Be At Least 1"],
        },
        isPaid: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
