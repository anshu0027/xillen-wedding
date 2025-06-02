"use client";
import { QuoteProvider } from "@/context/QuoteContext";
import ProgressTracker from "@/components/ProgressTracker";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useState, useEffect } from "react";

export default function CreateQuoteLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Default style for step 1, step 4, and any other potential sub-pages (centered with max-width)
    let pageContainerSpecificClasses = "max-w-5xl mx-auto";

    // Steps 2 and 3 accommodate the QuotePreview and use a different layout
    if (pathname === "/admin/create-quote/step2" || pathname === "/admin/create-quote/step3") {
        // Adjusted max-width to 60rem and corrected right margin for w-96 (24rem) QuotePreview
        pageContainerSpecificClasses = "max-w-[60rem] w-full ml-auto mr-auto lg:ml-4 lg:mr-[calc(24rem+3.25rem+1rem)]"; // equates to lg:mr-[28.25rem]
    }
    const [layoutReady, setLayoutReady] = useState(false);

    useEffect(() => {
        // Simulate layout readiness or wait for any async setup if needed
        const timer = setTimeout(() => {
            setLayoutReady(true);
        }, 150); // Short delay to ensure skeleton is visible briefly
        return () => clearTimeout(timer);
    }, []);

    const LayoutSkeleton = () => (
        <div className="flex flex-col min-h-screen bg-white animate-pulse">
            <main className="flex-grow">
                <div className={clsx(
                    "px-2 sm:px-6 md:px-12",
                    "pt-6",
                    pageContainerSpecificClasses 
                )}>
                    {/* ProgressTracker Skeleton */}
                    <div className="mb-6 md:mb-8">
                        <div className="flex justify-around items-center p-4 bg-gray-100 rounded-lg">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <div className="h-8 w-8 bg-gray-300 rounded-full mb-2"></div>
                                    <div className="h-4 bg-gray-300 rounded w-16"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Children Content Skeleton */}
                    <div className="py-6 md:py-6 bg-gray-100 rounded-lg p-6">
                        <div className="h-10 bg-gray-300 rounded w-3/4 mb-4"></div>
                        <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-5/6"></div>
                    </div>
                </div>
            </main>
        </div>
    );

    if (!layoutReady) {
        return <LayoutSkeleton />;
    }

    return (
        <QuoteProvider>
            <div className="flex flex-col min-h-screen bg-white">
                <main className="flex-grow">
                    <div className={clsx(
                        "px-2 sm:px-6 md:px-12", // Common horizontal paddings
                        "pt-6",                  // Reduced top offset
                        pageContainerSpecificClasses // Page-specific width and margins
                    )}>
                        {/* ProgressTracker now a direct child (wrapped for margin) of the width-constrained div */}
                        <div className="mb-6 md:mb-8"> {/* Spacing below ProgressTracker */}
                            <ProgressTracker admin />
                        </div>
                        {/* Children also a direct child (wrapped for padding) of the width-constrained div */}
                        <div className="py-6 md:py-6"> {/* Vertical padding for the page's own content */}
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </QuoteProvider>
    );
} 