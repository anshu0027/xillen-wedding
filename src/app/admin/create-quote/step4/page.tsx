"use client";
import React, { useEffect } from "react";
import { useQuote } from "@/context/QuoteContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { formatCurrency } from "@/utils/validators";
import { Mail } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";

export default function Step4() {
    const { state } = useQuote();
    const router = useRouter();
    const [emailSent, setEmailSent] = React.useState(false);
    const [pageReady, setPageReady] = React.useState(false);

    useEffect(() => {
        // Replace with real admin auth check
        const isAdminAuthenticated = () => {
            // Use the same key as AdminLayout
            return typeof window !== 'undefined' && localStorage.getItem('admin_logged_in') === 'true';
        };

        const timer = setTimeout(() => {
            if (!isAdminAuthenticated()) {
                router.replace('/admin/login');
                return; // Stop further execution if not authenticated
            }
            // Example: Ensure step 3 is complete before showing step 4
            if (!state.step3Complete) {
                toast.error("Please complete Step 3: Policyholder Information first.");
                router.replace('/admin/create-quote/step3');
                return; // Stop further execution
            }
            setPageReady(true);
        }, 200); // Short delay for skeleton visibility and to allow context to settle
        return () => clearTimeout(timer);
    }, [router, state.step3Complete]); // Dependencies: router for navigation, state.step3Complete to ensure prerequisite

    const handleBack = () => {
        router.push('/admin/create-quote/step3');
    };

    // Add validation for all required fields
    function validateAllFields(state) {
        const requiredFields = [
            "eventType", "eventDate", "maxGuests", "coverageLevel", "liabilityCoverage",
            "venueName", "venueAddress1", "venueCountry", "venueCity", "venueState", "venueZip",
            "firstName", "lastName", "email"
            // Add all other required fields as per backend validation
        ];
        let allPresent = true;
        for (const field of requiredFields) {
            if (!state[field]) {
                toast.error(`${field} is missing`, { variant: 'custom', className: 'bg-white text-red-600' });
                allPresent = false;
            }
        }
        return allPresent;
    }

    const handleSave = async () => {
        if (!validateAllFields(state)) {
            return;
        }
        try {
            const payload = {
                step: "COMPLETE",
                ...state,  // Include all state data
                policyHolderName: `${state.firstName} ${state.lastName}`,
                status: "COMPLETE",
                source: "ADMIN"
            };
            const storedQuoteNumber = localStorage.getItem("quoteNumber");
            if (storedQuoteNumber) {
                payload.quoteNumber = storedQuoteNumber;
            }

            const response = await fetch("/api/quote/step", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to save quote');
            }

            const data = await response.json();
            if (data.quoteNumber) {
                localStorage.setItem("quoteNumber", data.quoteNumber);
            }

            const policyHolderName = `${state.firstName} ${state.lastName}`;
            alert(`Quote ${data.quoteNumber} created successfully for ${policyHolderName}!`);
            router.push("/admin/quotes");
        } catch (error) {
            console.error('Error saving quote:', error);
            toast.error('Failed to save quote. Please try again.', { variant: 'custom', className: 'bg-white text-red-600' });
        }
    };

    const handleEmail = async () => {
        if (!validateAllFields(state)) {
            return;
        }
        try {
            const res = await fetch('/api/quote/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: state.email,
                    type: 'quote',
                    data: {
                        quoteNumber: state.quoteNumber,
                        firstName: state.firstName || 'Customer',
                        totalPremium: state.totalPremium
                    }
                })
            });
            if (res.ok) {
                setEmailSent(true);
                toast.success('Quote emailed successfully!');
                setTimeout(() => setEmailSent(false), 3000);
            } else {
                const data = await res.json();
                toast.error('Failed to send email: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            toast.error('Failed to send email.');
        }
    };

    const Step4Skeleton = () => (
        <div className="space-y-8 animate-pulse">
            <div className="bg-gray-100 rounded-lg shadow-md p-6">
                {/* Card Header Skeleton */}
                <div className="mb-4">
                    <div className="h-7 bg-gray-300 rounded w-3/5 mb-2"></div> {/* Title "Quote Summary" */}
                    <div className="h-5 bg-gray-300 rounded w-2/5"></div>      {/* Subtitle "Quote #..." */}
                </div>

                {/* Card Body Skeleton */}
                <div className="space-y-4">
                    <div className="bg-gray-200 rounded-lg p-4">
                        <div className="text-center">
                            <div className="h-6 bg-gray-300 rounded w-1/3 mx-auto mb-2"></div> {/* Total Premium Label */}
                            <div className="h-10 bg-gray-300 rounded w-1/2 mx-auto"></div>    {/* Total Premium Value */}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-300">
                            <div className="h-5 bg-gray-300 rounded w-1/4 mb-3"></div> {/* Breakdown Title */}
                            <div className="space-y-2">
                                {[...Array(2)].map((_, i) => ( // Assuming 2-3 breakdown items usually
                                    <div key={i} className="flex justify-between">
                                        <div className="h-4 bg-gray-300 rounded w-2/5"></div>
                                        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card Footer Skeleton */}
                <div className="mt-6 flex justify-end gap-4">
                    <div className="h-12 bg-gray-300 rounded-md w-36"></div> {/* Email Button */}
                    <div className="h-12 bg-gray-300 rounded-md w-32"></div> {/* Save Button */}
                </div>
            </div>
            <div className="flex justify-between">
                <div className="h-10 bg-gray-200 rounded-md w-24"></div> {/* Back Button */}
            </div>
        </div>
    );

    if (!pageReady) {
        return <Step4Skeleton />;
    }

    return (
        <>
            <Toaster position="top-right" />
            <div className="space-y-8">
                <Card
                    title="Quote Summary"
                    subtitle={`Quote #${state.quoteNumber}`}
                    className="mb-6 border-blue-100 bg-blue-50"
                    footer={
                        <div className="flex justify-end gap-4">
                            <Button
                                variant="outline"
                                size="lg"
                                icon={<Mail size={18} />}
                                onClick={handleEmail}
                            >
                                {emailSent ? 'Email Sent!' : 'Email Quote'}
                            </Button>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleSave}
                            >
                                Save Quote
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-gray-800 mb-1">Total Premium</h3>
                                <p className="text-3xl font-bold text-blue-600">{formatCurrency(state.totalPremium)}</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Premium Breakdown:</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Core Coverage:</span>
                                        <span className="font-medium">{formatCurrency(state.basePremium)}</span>
                                    </div>
                                    {state.liabilityCoverage !== 'none' && (
                                        <div className="flex justify-between text-sm">
                                            <span>Liability Coverage:</span>
                                            <span className="font-medium">{formatCurrency(state.liabilityPremium)}</span>
                                        </div>
                                    )}
                                    {state.liquorLiability && (
                                        <div className="flex justify-between text-sm">
                                            <span>Host Liquor Liability:</span>
                                            <span className="font-medium">{formatCurrency(state.liquorLiabilityPremium)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
                <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
                </div>
            </div>
        </>
    );
}