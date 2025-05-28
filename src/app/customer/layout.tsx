"use client";
import { QuoteProvider } from "@/context/QuoteContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProgressTracker from "@/components/ProgressTracker";
import { usePathname } from "next/navigation";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const hideProgressTracker = pathname && pathname.startsWith("/customer/edit/");
    return (
        <QuoteProvider>
            <div className="flex flex-col min-h-screen bg-white">
                <Header />
                <main className="flex-grow">
                    {!hideProgressTracker && <ProgressTracker />}
                    <div className="max-w-6xl mx-auto px-2 sm:px-6 md:px-12 py-6 md:py-10 pt-[90px]">
                        <div className="bg-white/90 rounded-2xl shadow-2xl border border-blue-100 p-4 sm:p-8 md:p-12 mt-6">
                            {children}
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </QuoteProvider>
    );
}