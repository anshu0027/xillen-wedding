'use client';

import React from "react";
import SpecialEventInsurancePDF from "@/components/SpecialEventInsurancePDF"; // Adjust path if needed


export default function BackToHome() {
    return (
        <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#e0eafc] to-[#cfdef3] p-4">
            <div className="text-center max-w-lg w-full p-10 bg-white rounded-2xl shadow-lg transition-all transform hover:scale-105">
                                <SpecialEventInsurancePDF />

            </div>
        </div>
    )
}
