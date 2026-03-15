import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ["user", "assistant"],
            required: [true, "Message Role Is Required"],
        },
        content: {
            type: String,
            required: [true, "Message Content Is Required"],
            trim: true,
        },
        isImage: {
            type: Boolean,
            default: false,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const chatSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID Is Required"],
            index: true,
        },
        name: {
            type: String,
            required: [true, "Chat Name Is Required"],
            trim: true,
            maxlength: [100, "Chat Name Cannot Exceed 100 Characters"],
        },
        messages: {
            type: [messageSchema],
            default: [],
        },
    },
    { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
