"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileCog, CheckCircle, Download, DollarSign, Shield, Calendar, User, AlertTriangle } from "lucide-react";
import { useQuote } from "@/context/QuoteContext";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EVENT_TYPES, GUEST_RANGES, COVERAGE_LEVELS, LIABILITY_OPTIONS, VENUE_TYPES, INDOOR_OUTDOOR_OPTIONS, RELATIONSHIP_OPTIONS } from "@/utils/constants";
import { formatCurrency } from "@/utils/validators";
import dynamic from 'next/dynamic';

const QuotePreview = dynamic(() => import('@/components/ui/QuotePreview'), { ssr: false });

function ReviewSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex items-center border-b border-gray-200">
                <div className="mr-2 text-blue-600">{icon}</div>
                <h3 className="font-medium text-gray-800">{title}</h3>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

function ReviewItem({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="py-2 flex justify-between border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-500">{label}:</span>
            <span className="text-sm font-medium text-gray-800">{value || 'Not provided'}</span>
        </div>
    );
}

// Add validation for all required fields
function validateAllFields(state: Record<string, unknown>) {
    const requiredFields = [
        "eventType", "eventDate", "maxGuests", "coverageLevel", "liabilityCoverage",
        "venueName", "venueAddress1", "venueCountry", "venueCity", "venueState", "venueZip",
        "firstName", "lastName", "email"
        // Add all other required fields as per backend validation
    ];
    for (const field of requiredFields) {
        if (!state[field]) return false;
    }
    return true;
}

export default function Review() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentSuccessParam = searchParams.get("payment") === "success";
    const { state } = useQuote();
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(paymentSuccessParam);
    const [showPolicyNumber, setShowPolicyNumber] = useState(paymentSuccessParam);
    const [savingPolicy, setSavingPolicy] = useState(false);
    const [policySaved, setPolicySaved] = useState(false);
    const policyNumberRef = useRef(`WI-POL-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`);

    // Find option labels from their values
    const eventTypeLabel = EVENT_TYPES.find(t => t.value === state.eventType)?.label || '';
    const guestRangeLabel = GUEST_RANGES.find(g => g.value === state.maxGuests)?.label || '';
    const coverageLevelLabel = COVERAGE_LEVELS.find(l => l.value === state.coverageLevel?.toString())?.label || '';
    const liabilityOptionLabel = LIABILITY_OPTIONS.find(o => o.value === state.liabilityCoverage)?.label || '';
    const venueTypeLabel = VENUE_TYPES.find(v => v.value === state.ceremonyLocationType)?.label || '';
    const indoorOutdoorLabel = INDOOR_OUTDOOR_OPTIONS.find(o => o.value === state.indoorOutdoor)?.label || '';
    const relationshipLabel = RELATIONSHIP_OPTIONS.find(r => r.value === state.relationship)?.label || '';

    // Format event date
    const formattedEventDate = state.eventDate
        ? new Date(state.eventDate).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        })
        : '';

    // Handle back button
    const handleBack = () => {
        router.push('/customer/policy-holder');
    };

    // Generate PDF quote
    const generatePdf = async () => {
        setIsGeneratingPdf(true);
        const jsPDF = (await import('jspdf')).default;
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            // Header
            doc.setFillColor(35, 63, 150);
            doc.rect(0, 0, pageWidth, 30, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text('WeddingGuard Insurance Quote', pageWidth / 2, 15, { align: 'center' });
            // Quote info
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.text(`Quote #: ${state.quoteNumber}`, 15, 40);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 48);
            // Separator line
            doc.setDrawColor(200, 200, 200);
            doc.line(15, 55, pageWidth - 15, 55);
            // Premium summary
            doc.setFontSize(16);
            doc.text('Premium Summary', 15, 65);
            doc.setFontSize(12);
            doc.text(`Total Premium: ${formatCurrency(state.totalPremium)}`, pageWidth - 15, 65, { align: 'right' });
            doc.text(`Core Coverage: ${formatCurrency(state.basePremium)}`, 20, 75);
            if (state.liabilityCoverage !== 'none') {
                doc.text(`Liability Coverage: ${formatCurrency(state.liabilityPremium)}`, 20, 83);
            }
            if (state.liquorLiability) {
                doc.text(`Host Liquor Liability: ${formatCurrency(state.liquorLiabilityPremium)}`, 20, 91);
            }
            // Separator line
            doc.line(15, 100, pageWidth - 15, 100);
            // Coverage details
            doc.setFontSize(16);
            doc.text('Coverage Details', 15, 110);
            doc.setFontSize(12);
            doc.text(`Event Type: ${eventTypeLabel}`, 20, 120);
            doc.text(`Event Date: ${formattedEventDate}`, 20, 128);
            doc.text(`Guest Count: ${guestRangeLabel}`, 20, 136);
            doc.text(`Core Coverage: ${coverageLevelLabel}`, 20, 144);
            doc.text(`Liability Coverage: ${liabilityOptionLabel}`, 20, 152);
            doc.text(`Host Liquor Liability: ${state.liquorLiability ? 'Included' : 'Not Included'}`, 20, 160);
            // Separator line
            doc.line(15, 170, pageWidth - 15, 170);
            // Event details
            doc.setFontSize(16);
            doc.text('Event Details', 15, 180);
            doc.setFontSize(12);
            doc.text(`Honorees: ${state.honoree1FirstName} ${state.honoree1LastName}${state.honoree2FirstName ? ` & ${state.honoree2FirstName} ${state.honoree2LastName}` : ''}`, 20, 190);
            doc.text(`Venue: ${state.venueName}`, 20, 198);
            doc.text(`Location: ${state.venueAddress1}, ${state.venueCity}, ${state.venueState} ${state.venueZip}`, 20, 206);
            // Footer
            doc.setFillColor(240, 240, 240);
            doc.rect(0, 270, pageWidth, 25, 'F');
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text('This quote is valid for 30 days from the date of issue. Terms and conditions apply.', pageWidth / 2, 280, { align: 'center' });
            doc.text('WeddingGuard Insurance - 1-800-555-0123 - support@weddingguard.com', pageWidth / 2, 285, { align: 'center' });
            // Save the PDF
            doc.save(`WeddingGuard_Quote_${state.quoteNumber}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // Define savePolicyAndPayment function at component level
    const savePolicyAndPayment = useCallback(async () => {
        console.log('Attempting to save policy and payment');
        console.log('Payment success:', paymentSuccess);
        console.log('Show policy number:', showPolicyNumber);
        console.log('Policy saved:', policySaved);

        const storedQuoteNumber = localStorage.getItem("quoteNumber");

        if (paymentSuccess && !policySaved) {
            setSavingPolicy(true);
            console.log('Starting policy save process');

            // Validate all required fields before saving
            if (!validateAllFields(state)) {
                alert("Please complete all required fields before submitting.");
                setSavingPolicy(false);
                return;
            }

            try {
                console.log('Sending quote data to API:', { ...state, step: "COMPLETE" });

                // 1. Create quote and policy
                const quoteRes = await fetch("/api/quote/step", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        step: "COMPLETE",
                        quoteNumber: storedQuoteNumber,
                        ...state,
                        source: "CUSTOMER",
                        paymentStatus: "SUCCESS"
                    }),
                });

                const quoteData = await quoteRes.json();
                console.log('Quote API response:', quoteData);

                if (!quoteRes.ok) {
                    console.error('Failed to save quote:', quoteData.error);
                    alert("Failed to save quote: " + (quoteData.error || "Unknown error"));
                    setSavingPolicy(false);
                    return;
                }

                // 1.5 Convert quote to policy (for customer-generated quotes, this will happen automatically)
                if (quoteData.quote && quoteData.quote.quoteNumber) {
                    try {
                        const convertRes = await fetch('/api/quote/convert-to-policy', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ quoteNumber: quoteData.quote.quoteNumber })
                        });

                        const convertData = await convertRes.json();
                        console.log('Convert to policy response:', convertData);

                        if (convertRes.ok) {
                            console.log('Quote converted to policy successfully with policy number:', convertData.policyNumber);
                            // Update the policy number reference to use the one returned from the API
                            if (convertData.policyNumber) {
                                policyNumberRef.current = convertData.policyNumber;
                            }
                        } else if (convertData.requiresManualConversion) {
                            console.log('This quote requires manual conversion by an admin');
                        } else {
                            console.warn('Failed to convert quote to policy:', convertData.error);
                        }
                    } catch (convertError) {
                        console.error('Error converting quote to policy:', convertError);
                    }
                }

                // 2. Create payment if policy created
                if (quoteData.quote && quoteData.quote.id) {
                    // Find policyId (should be created by backend)
                    const policyId = quoteData.quote.policy?.id;
                    console.log('Policy ID from quote:', policyId);

                    if (policyId) {
                        const paymentRes = await fetch("/api/payment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                amount: state.totalPremium,
                                policyId,
                                method: "Dummy",
                                status: "SUCCESS" // Use the enum value
                            })
                        });

                        const paymentData = await paymentRes.json();
                        console.log('Payment API response:', paymentData);

                        if (!paymentRes.ok) {
                            console.error('Failed to save payment:', paymentData.error);
                            alert("Failed to save payment: " + (paymentData.error || "Unknown error"));
                            setSavingPolicy(false);
                            return;
                        }
                    }
                }

                console.log('Policy and payment saved successfully');
                setPolicySaved(true);
            } catch (error) {
                console.error('Error saving policy and payment:', error);
                alert("An error occurred while saving your policy: " + (error.message || "Unknown error"));
            } finally {
                setSavingPolicy(false);
            }
        } // Only include dependencies that are stable or state values read inside
    }, [state, paymentSuccess, policySaved, showPolicyNumber, policyNumberRef]); // Added dependencies for useCallback

    // Effect to save policy after payment success
    useEffect(() => {
        if (paymentSuccess && showPolicyNumber && !policySaved && !savingPolicy) {
            console.log('Payment success detected, saving policy');
            savePolicyAndPayment();
        }
    }, [paymentSuccess, showPolicyNumber, policySaved, savingPolicy, savePolicyAndPayment]);

    return (
        <>
            <div className="relative flex justify-center min-h-screen bg-white z-0">
                <div className="w-full max-w-3xl z-0">
                    <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto px-2 sm:px-4 md:px-6 pb-12 w-full mt-8">
                        <div className="flex-1 min-w-0">
                            {paymentSuccess ? (
                                <Card
                                    title={<span className="text-2xl font-bold text-green-700">{showPolicyNumber ? "Payment Successful" : "Processing Payment"}</span>}
                                    subtitle={<span className="text-base text-gray-600">{showPolicyNumber ? "Your insurance policy has been issued" : "Please wait while we process your payment"}</span>}
                                    icon={showPolicyNumber ? <CheckCircle size={28} className="text-green-600" /> : <DollarSign size={28} className="text-blue-600" />}
                                    className={`mb-8 shadow-lg border-0 bg-white ${showPolicyNumber ? "border-green-100" : "border-blue-100"}`}
                                >
                                    <div className="text-center py-10">
                                        {showPolicyNumber ? (
                                            <div className="space-y-8">
                                                <div className="bg-green-50 border border-green-100 rounded-xl p-8">
                                                    <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                                                    <h3 className="text-2xl font-semibold text-gray-800 mb-2">Your Policy is Active</h3>
                                                    <p className="text-gray-700 mb-4">Thank you for purchasing WeddingGuard insurance!</p>
                                                    <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-md mx-auto">
                                                        <h4 className="text-sm font-medium text-gray-500 mb-1">Policy Number</h4>
                                                        <p className="text-lg font-bold text-blue-600">{policyNumberRef.current}</p>
                                                        <h4 className="text-sm font-medium text-gray-500 mt-4 mb-1">Coverage Period</h4>
                                                        <p className="font-medium text-gray-700">
                                                            {new Date().toLocaleDateString()} to {formattedEventDate}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row justify-center gap-4">
                                                    <Button
                                                        variant="outline"
                                                        icon={<Download size={18} />}
                                                        onClick={generatePdf}
                                                        className="transition-transform duration-150 hover:scale-105"
                                                    >
                                                        Download Policy Documents
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        onClick={() => router.push("/")}
                                                        className="transition-transform duration-150 hover:scale-105"
                                                    >
                                                        Return to Home
                                                    </Button>
                                                </div>
                                                <div className="text-sm text-gray-500 mt-6">
                                                    <p>
                                                        You will receive a confirmation email with your policy documents at {state.email}.
                                                        If you have any questions, please contact our customer service at 1-800-555-0123.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                                <p className="text-gray-600">Please wait while we process your payment...</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ) : (
                                <>
                                    <Card
                                        title={<span className="text-2xl font-bold text-blue-800">Review Your Quote</span>}
                                        subtitle={<span className="text-base text-gray-600">Quote #{state.quoteNumber}</span>}
                                        icon={<FileCog size={28} className="text-blue-600" />}
                                        className="mb-8 shadow-lg border-0 bg-white"
                                    >
                                        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-8 flex items-start gap-3">
                                            <AlertTriangle size={20} className="text-yellow-500 mt-1" />
                                            <div>
                                                <p className="text-sm text-yellow-800 font-semibold">
                                                    Please review all information carefully before proceeding to payment. You can go back to make changes if needed.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mb-8">
                                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
                                                <div className="text-center mb-4">
                                                    <h3 className="text-xl font-semibold text-gray-800 mb-1">Total Premium</h3>
                                                    <p className="text-3xl font-bold text-blue-700">{formatCurrency(state.totalPremium)}</p>
                                                </div>
                                                <div className="pt-4 border-t border-gray-100">
                                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Premium Breakdown:</h4>
                                                    <div className="space-y-2 text-gray-700">
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
                                            <div className="flex justify-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={generatePdf}
                                                    icon={<Download size={16} />}
                                                    disabled={isGeneratingPdf}
                                                    className="transition-transform duration-150 hover:scale-105"
                                                >
                                                    {isGeneratingPdf ? 'Generating...' : 'Download Quote PDF'}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                    <ReviewSection title={<span className="text-lg font-bold text-blue-800">Quote Information</span>} icon={<Shield size={20} className="text-blue-600" />}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 w-full">
                                            <div>
                                                <ReviewItem label="Event Type" value={eventTypeLabel} />
                                                <ReviewItem label="Guest Count" value={guestRangeLabel} />
                                                <ReviewItem label="Event Date" value={formattedEventDate} />
                                            </div>
                                            <div>
                                                <ReviewItem label="Core Coverage" value={coverageLevelLabel} />
                                                <ReviewItem label="Liability Coverage" value={liabilityOptionLabel} />
                                                <ReviewItem label="Host Liquor Liability" value={state.liquorLiability ? 'Included' : 'Not Included'} />
                                            </div>
                                        </div>
                                    </ReviewSection>
                                    <ReviewSection title={<span className="text-lg font-bold text-blue-800">Event Information</span>} icon={<Calendar size={20} className="text-blue-600" />}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 w-full">
                                            <div>
                                                <ReviewItem
                                                    label="Honorees"
                                                    value={`${state.honoree1FirstName} ${state.honoree1LastName}${state.honoree2FirstName ? ` & ${state.honoree2FirstName} ${state.honoree2LastName}` : ''}`}
                                                />
                                                <ReviewItem label="Venue Type" value={venueTypeLabel} />
                                                <ReviewItem label="Indoor/Outdoor" value={indoorOutdoorLabel} />
                                            </div>
                                            <div>
                                                <ReviewItem label="Venue Name" value={state.venueName} />
                                                <ReviewItem
                                                    label="Venue Address"
                                                    value={`${state.venueAddress1}${state.venueAddress2 ? `, ${state.venueAddress2}` : ''}`}
                                                />
                                                <ReviewItem
                                                    label="Venue Location"
                                                    value={`${state.venueCity}, ${state.venueState} ${state.venueZip}`}
                                                />
                                            </div>
                                        </div>
                                    </ReviewSection>
                                    <ReviewSection title={<span className="text-lg font-bold text-blue-800">Policyholder Information</span>} icon={<User size={20} className="text-blue-600" />}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 w-full">
                                            <div>
                                                <ReviewItem
                                                    label="Policyholder"
                                                    value={`${state.firstName} ${state.lastName}`}
                                                />
                                                <ReviewItem label="Relationship" value={relationshipLabel} />
                                                <ReviewItem label="Email" value={state.email} />
                                                <ReviewItem label="Phone" value={state.phone} />
                                            </div>
                                            <div>
                                                <ReviewItem label="Address" value={state.address} />
                                                <ReviewItem
                                                    label="Location"
                                                    value={`${state.city}, ${state.state} ${state.zip}`}
                                                />
                                            </div>
                                        </div>
                                    </ReviewSection>
                                    <Card
                                        title={<span className="text-lg font-bold text-blue-800">Payment Information</span>}
                                        subtitle={<span className="text-base text-gray-600">Complete your purchase securely</span>}
                                        icon={<DollarSign size={24} className="text-blue-600" />}
                                        className="mb-8 shadow-lg border-0 bg-white"
                                    >
                                        <div className="py-10 text-center">
                                            <p className="text-gray-700 mb-4">
                                                For this demonstration, we&apos;ve simplified the payment process.
                                                Click the button below to simulate payment and complete your policy purchase.
                                            </p>
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                onClick={() => router.push("/customer/payment")}
                                                icon={<DollarSign size={18} />}
                                                className="min-w-44 transition-transform duration-150 hover:scale-105"
                                            >
                                                Complete Purchase
                                            </Button>
                                            <p className="text-xs text-gray-500 mt-4">
                                                Your total charge will be {formatCurrency(state.totalPremium)}.
                                                In a real application, this would include a secure payment form.
                                            </p>
                                        </div>
                                    </Card>
                                    <div className="flex justify-between mt-10 gap-4">
                                        <Button
                                            variant="secondary"
                                            onClick={handleBack}
                                            className="transition-transform duration-150 hover:scale-105">
                                            Back to Policyholder
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="hidden lg:block fixed right-11 mr-2 top-[260px] z-10">
                <QuotePreview />
            </div>
        </>
    );
}