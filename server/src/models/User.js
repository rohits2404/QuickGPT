import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name Is Required"],
            trim: true,
            minlength: [2, "Name Must Be At Least 2 Characters"],
            maxlength: [50, "Name Cannot Exceed 50 Characters"],
        },
        email: {
            type: String,
            required: [true, "Email Is Required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please Provide A Valid Email Address"],
        },
        password: {
            type: String,
            required: [true, "Password Is Required"],
            minlength: [6, "Password Must Be At Least 6 Characters"],
        },
        credits: {
            type: Number,
            default: 20,
            min: [0, "Credits Cannot Be Negative"],
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;
