import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Login = () => {

    const [state, setState] = useState("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { axios, setToken } = useAppContext();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = state === "login" ? "/api/user/login" : "/api/user/register";

        try {
            const { data } = await axios.post(url, { name, email, password });

            if (data.success) {
                setToken(data.token);
                localStorage.setItem("token", data.token);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-[#0f0f0f] dark:via-[#121212] dark:to-[#0a0a0a]">

        {/* Background Glow */}
            <div className="absolute w-125 h-125 bg-purple-500/20 blur-[120px] rounded-full"></div>

            <form
            onSubmit={handleSubmit}
            className="relative z-10 w-full max-w-md p-8 rounded-2xl
            bg-white/70 dark:bg-white/5
            backdrop-blur-xl
            border border-gray-200 dark:border-white/10
            shadow-2xl flex flex-col gap-5"
            >
                {/* Logo / Title */}
                <div className="text-center mb-2">
                    <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">
                        AI Assistant
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {state === "login"
                        ? "Welcome Back. Login To Continue."
                        : "Create Your Account to Start Chatting"}
                    </p>
                </div>

                {/* Name */}
                {state === "register" && (
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600 dark:text-gray-300">
                            Name
                        </label>
                        <input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="px-3 py-2 rounded-lg border
                        border-gray-200 dark:border-white/10
                        bg-white dark:bg-[#1a1a1a]
                        text-gray-800 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                    </div>
                )}

                {/* Email */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                        Email
                    </label>
                    <input
                    type="email"
                    placeholder="abc@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                        Password
                    </label>
                    <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                </div>

                {/* Switch Login/Register */}
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    {state === "login"
                    ? "Don't Have An Account?"
                    : "Already Have An Account?"}

                    <span
                    onClick={() =>
                    setState(state === "login" ? "register" : "login")
                    }
                    className="ml-1 text-purple-600 dark:text-purple-400 cursor-pointer hover:underline"
                    >
                        {state === "login" ? "Sign up" : "Login"}
                    </span>
                </p>

                {/* Button */}
                <button
                type="submit"
                className="mt-2 py-2.5 rounded-lg font-medium bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200 shadow-lg shadow-purple-600/20"
                >
                    {state === "login" ? "Login" : "Create Account"}
                </button>

                {/* Footer */}
                <p className="text-xs text-center text-gray-400 mt-2">
                    Secure AI Powered Platform
                </p>
            </form>
        </div>
    );
};

export default Login;
