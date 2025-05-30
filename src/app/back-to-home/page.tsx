'use client';

import React from "react";

export default function BackToHome() {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            window.close();
            // Fallback if window.close() is blocked by browser
            if (!window.closed) {
                window.location.href = 'about:blank';
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#e0eafc] to-[#cfdef3] p-4">
            <div className="text-center max-w-lg w-full p-10 bg-white rounded-2xl shadow-lg transition-all transform hover:scale-105">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 tracking-wide">
                    Your Quote is Created
                </h1>
                <p className="text-xl text-gray-600">
                    This tab will be closed in 5 seconds.
                </p>
            </div>
        </div>
    )
}
