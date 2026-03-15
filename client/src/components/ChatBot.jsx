import React, { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets';
import { Message } from './Message';
import toast from 'react-hot-toast';

export const ChatBox = () => {

    const containerRef = useRef(null);

    const { selectedChat, theme, user, axios, token, setUser } = useAppContext();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [prompt, setPropmt] = useState('');
    const [mode, setMode] = useState('text');
    const [isPublished, setIsPublished] = useState(false);

    const onSubmit = async (e) => {
        try {
            e.preventDefault();

            if (!user) return toast.error("Login To Send a Message");
            if (!selectedChat) return toast.error("No chat selected");

            setLoading(true);

            const promptCopy = prompt;
            setPropmt('');

            setMessages(prev => [
                ...(prev || []),
                { role: "user", content: prompt, timestamp: Date.now(), isImage: false }
            ]);

            const { data } = await axios.post(
                `/api/message/${mode}`,
                { chatId: selectedChat._id, prompt, isPublished },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                setMessages(prev => [...(prev || []), data.reply]);

                setUser(prev => ({
                    ...prev,
                    credits: prev.credits - (mode === "image" ? 2 : 1)
                }));
            } else {
                toast.error(data.message);
                setPropmt(promptCopy);
            }

        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(selectedChat) {
            setMessages(selectedChat.messages)
        }
    },[selectedChat])

    useEffect(() => {
        if(containerRef.current) {
            containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: "smooth"
            })
        }
    })

    return (
        <div className='flex-1 flex flex-col justify-between m-5 md:m-10 xl:mx-30 max-md:mt-14 2xl:pr-40'>

            {/* Chat Messages */}
            <div ref={containerRef} className='flex-1 mb-5 overflow-y-scroll'>
                {messages?.length === 0 && (
                    <div className='h-full flex flex-col items-center justify-center gap-2 text-primary'>
                        <img src={theme === "dark" ? assets.logo_full : assets.logo_full_dark} alt='Logo' className='w-full max-w-56 sm:max-w-68'/>
                        <p className='mt-5 text-4xl sm:text-6xl text-center text-gray-400 dark:text-white'>
                            Ask Me Anything
                        </p>
                    </div>
                )}
                {messages?.map((message, index) => (
                    <Message
                    key={index}
                    message={message}
                    />
                ))}

                {loading && (
                    <div className='loader flex items-center gap-1.5'>
                        <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce'/>
                        <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce'/>
                        <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce'/>
                    </div>
                )}
            </div>
            {mode === "image" && (
                <label className='inline-flex items-center gap-2 mb-3 text-sm mx-auto'>
                    <p className='text-xs'>Publish Generated Image to Community</p>
                    <input 
                    type='checkbox' 
                    className='cursor-pointer' 
                    checked={isPublished} 
                    onChange={(e) => setIsPublished(e.target.checked)}
                    />
                </label>
            )}
            {/* Prompt Input Box */}
            <form
            onSubmit={onSubmit}
            className='bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark:border-[#80609F]/30 rounded-full w-full max-w-2xl p-3 pl-4 mx-auto flex gap-4 items-center'
            >
                <select onChange={(e) => setMode(e.target.value)} value={mode} className='text-sm pl-3 pr-2 outline-none'>
                    <option className='dark:bg-purple-900' value={"text"}>Text</option>
                    <option className='dark:bg-purple-900' value={"image"}>Image</option>
                </select>
                <input
                onChange={(e) => setPropmt(e.target.value)}
                value={prompt}
                type='text'
                placeholder='Type Your Prompt Here...'
                className='flex-1 w-full text-sm outline-none'
                required
                />
                <button disabled={loading}>
                    <img src={loading ? assets.stop_icon : assets.send_icon} alt='' className='w-8 cursor-pointer' />
                </button>
            </form>
        </div>
    )
}
