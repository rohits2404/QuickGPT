import axios from "axios";
import mongoose from "mongoose";
import { AI } from "../config/openai.js";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import { client } from "../config/imageKit.js";

/**
 * Validate common chat request fields
 */
const validateChatRequest = (chatId, prompt) => {
    if (!prompt || !prompt.trim()) return "Prompt Is Required";
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) return "Valid Chat ID Is Required";
    return null;
};

/**
 * Text Based AI Chat Message
 * POST /api/ai/text
 */
export const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id;

        if (req.user.credits < 1) {
            return res.status(403).json({ success: false, message: "Insufficient Credits" });
        }

        const { chatId, prompt } = req.body;
        const validationError = validateChatRequest(chatId, prompt);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const chat = await Chat.findOne({ _id: chatId, userId });
        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat Not Found" });
        }

        // Push user message
        chat.messages.push({
            role: "user",
            content: prompt.trim(),
            timestamp: new Date(),
            isImage: false,
        });

        // Call AI
        const { choices } = await AI.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: prompt.trim() }],
        });

        const reply = {
            role: "assistant",
            content: choices[0].message.content,
            timestamp: new Date(),
            isImage: false,
        };

        // Push AI reply, save chat, deduct credits
        chat.messages.push(reply);
        await chat.save();
        await User.updateOne({ _id: userId }, { $inc: { credits: -1 } });

        return res.status(200).json({ success: true, reply });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Image Generation Message Controller
 * POST /api/ai/image
 */
export const imageMessageController = async (req, res) => {
    try {
        const userId = req.user._id;

        if (req.user.credits < 2) {
            return res.status(403).json({ success: false, message: "Insufficient Credits" });
        }

        const { chatId, prompt, isPublished = false } = req.body;
        const validationError = validateChatRequest(chatId, prompt);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const chat = await Chat.findOne({ _id: chatId, userId });
        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat Not Found" });
        }

        // Push user message
        chat.messages.push({
            role: "user",
            content: prompt.trim(),
            timestamp: new Date(),
            isImage: false,
        });

        // Generate and upload image
        const encodedPrompt = encodeURIComponent(prompt.trim());
        const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/quickgpt/${Date.now()}.png?tr=w-800,h-800`;

        const aiImageResponse = await axios.get(generatedImageUrl, { responseType: "arraybuffer" });
        const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data, "binary").toString("base64")}`;

        const uploadResponse = await client.files.upload({
            file: base64Image,
            fileName: `${Date.now()}.png`,
            folder: "quickgpt",
        });

        const reply = {
            role: "assistant",
            content: uploadResponse.url,
            timestamp: new Date(),
            isImage: true,
            isPublished,
        };

        // Push AI reply, save chat, deduct credits
        chat.messages.push(reply);
        await chat.save();
        await User.updateOne({ _id: userId }, { $inc: { credits: -2 } });

        return res.status(200).json({ success: true, reply });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
