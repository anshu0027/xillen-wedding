"use client";
import { QuoteProvider } from "@/context/QuoteContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProgressTracker from "@/components/ProgressTracker";

export default function CreateQuoteLayout({ children }: { children: React.ReactNode }) {
    return (
        <QuoteProvider>
            <div className="flex flex-col min-h-screen bg-white">
                <Header />
                <main className="flex-grow">
                    <ProgressTracker admin />
                    <div className="max-w-6xl mx-auto px-2 sm:px-6 md:px-12 py-6 md:py-10 pt-[90px]">
                        <div className="bg-white/90 rounded-2xl shadow-2xl border border-blue-100 p-4 sm:p-8 md:p-12 mt-6 mb-12">
                            {children}
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </QuoteProvider>
    );
} 