"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "@/hooks/use-toast";
import dynamic from 'next/dynamic';

// Loading component for dynamically imported forms
const StepFormLoading = () => (
    <div className="p-8 text-center text-gray-500">Loading form...</div>
);

const Step1Form = dynamic(() => import('@/components/quote/Step1Form'), { 
    ssr: false, loading: StepFormLoading 
});
const Step2Form = dynamic(() => import('@/components/quote/Step2Form'), { 
    ssr: false, loading: StepFormLoading 
});
const Step3Form = dynamic(() => import('@/components/quote/Step3Form'), { 
    ssr: false, loading: StepFormLoading 
});
const Step4Form = dynamic(() => import('@/components/quote/Step4Form'), { 
    ssr: false, loading: StepFormLoading 
});

function flattenPolicy(policy: any) {
    return {
        // Step 1
        residentState: policy.residentState || policy.policyHolder?.state || '',
        eventType: policy.event?.eventType || '',
        eventDate: policy.event?.eventDate || '',
        maxGuests: policy.event?.maxGuests || '',
        email: policy?.email || '',
        coverageLevel: policy.coverageLevel ?? null,
        liabilityCoverage: policy.liabilityCoverage ?? '',
        liquorLiability: policy.liquorLiability ?? false,
        covidDisclosure: policy.covidDisclosure ?? false,
        specialActivities: policy.specialActivities ?? false,
        // Step 2
        honoree1FirstName: policy.event?.honoree1FirstName || '',
        honoree1LastName: policy.event?.honoree1LastName || '',
        honoree2FirstName: policy.event?.honoree2FirstName || '',
        honoree2LastName: policy.event?.honoree2LastName || '',
        ceremonyLocationType: policy.event?.venue?.ceremonyLocationType || '',
        indoorOutdoor: policy.event?.venue?.indoorOutdoor || '',
        venueName: policy.event?.venue?.name || '',
        venueAddress1: policy.event?.venue?.address1 || '',
        venueAddress2: policy.event?.venue?.address2 || '',
        venueCountry: policy.event?.venue?.country || '',
        venueCity: policy.event?.venue?.city || '',
        venueState: policy.event?.venue?.state || '',
        venueZip: policy.event?.venue?.zip || '',
        venueAsInsured: policy.event?.venue?.venueAsInsured || false,
        // Step 3
        firstName: policy.policyHolder?.firstName || '',
        lastName: policy.policyHolder?.lastName || '',
        phone: policy.policyHolder?.phone || '',
        relationship: policy.policyHolder?.relationship || '',
        hearAboutUs: policy.policyHolder?.hearAboutUs || '',
        address: policy.policyHolder?.address || '',
        country: policy.policyHolder?.country || '',
        city: policy.policyHolder?.city || '',
        state: policy.policyHolder?.state || '',
        zip: policy.policyHolder?.zip || '',
        legalNotices: policy.policyHolder?.legalNotices || false,
        completingFormName: policy.policyHolder?.completingFormName || '',
        // Other fields
        quoteNumber: policy.quoteNumber,
        totalPremium: policy.totalPremium,
        basePremium: policy.basePremium,
        liabilityPremium: policy.liabilityPremium,
        liquorLiabilityPremium: policy.liquorLiabilityPremium,
        status: policy.status,
        policyId: policy.policy?.id || policy.id,
        policyNumber: policy.policyNumber,
        pdfUrl: policy.pdfUrl,
    };
}

export default function EditPolicy() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [step, setStep] = useState(1);
    const [formState, setFormState] = useState<any>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [emailSent, setEmailSent] = useState(false);
    const [showQuoteResults, setShowQuoteResults] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // For initial data load

    useEffect(() => {
        async function fetchPolicy() {
            setIsLoading(true);
            // Try to fetch by quoteNumber first
            let res = await fetch(`/api/quote/step?quoteNumber=${id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.quote) {
                    console.log('Found policy by quote number: ',data.quote)
                    setFormState(flattenPolicy(data.quote));
                    setIsLoading(false);
                    return;
                }
            }
            // If not found, try to fetch by policy id (for direct policies)
            res = await fetch(`/api/policy?policyId=${id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.policy) {
                    setFormState(flattenPolicy(data.policy));
                    setIsLoading(false);
                    return;
                }
            }
            // If neither found, stop loading
            setIsLoading(false);
        }
        fetchPolicy();
    }, [id]);

    useEffect(() => {
        // REMOVE admin auth check, allow access to all
    }, []);

    // Skeleton Loader Component
    const EditPolicySkeleton = () => (
        <div className="p-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-6 gap-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div> {/* Title */}
                <div className="h-10 bg-gray-200 rounded-md w-full sm:w-36"></div> {/* Back Button */}
            </div>
            {/* Stepper Skeleton */}
            <div className="mb-8 flex flex-row justify-center max-w-4xl mx-auto items-center gap-2 sm:gap-3 md:gap-10">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded-full flex-1 min-w-0 md:flex-initial md:w-48"></div>
                ))}
            </div>
            {/* Form Area Skeleton */}
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div> {/* Form Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div> {/* Label */}
                            <div className="h-10 bg-gray-200 rounded-md"></div> {/* Input */}
                        </div>
                    ))}
                </div>
                <div className="mt-8 h-12 bg-gray-200 rounded-md w-1/3 ml-auto"></div> {/* Save/Continue Button */}
            </div>
        </div>
    );
    if (isLoading || !formState) return <EditPolicySkeleton />;

    const handleInputChange = (field: string, value: any) => {
        setFormState((prev: any) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };
    // Validation functions for each step (implement as needed)
    console.log(formState)
    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};
        if (!formState.residentState) newErrors.residentState = 'Required';
        if (!formState.eventType) newErrors.eventType = 'Required';
        if (!formState.maxGuests) newErrors.maxGuests = 'Required';
        if (!formState.eventDate) newErrors.eventDate = 'Required';
        if (!formState.coverageLevel) newErrors.coverageLevel = 'Required';
        if (!formState.covidDisclosure) newErrors.covidDisclosure = 'Required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const validateStep2 = () => {
        const newErrors: Record<string, string> = {};
        if (!formState.honoree1FirstName) newErrors.honoree1FirstName = 'Required';
        if (!formState.honoree1LastName) newErrors.honoree1LastName = 'Required';
        if (!formState.ceremonyLocationType) newErrors.ceremonyLocationType = 'Required';
        if (!formState.indoorOutdoor) newErrors.indoorOutdoor = 'Required';
        if (!formState.venueName) newErrors.venueName = 'Required';
        if (!formState.venueAddress1) newErrors.venueAddress1 = 'Required';
        if (!formState.venueCountry) newErrors.venueCountry = 'Required';
        if (!formState.venueCity) newErrors.venueCity = 'Required';
        if (!formState.venueState) newErrors.venueState = 'Required';
        if (!formState.venueZip) newErrors.venueZip = 'Required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const validateStep3 = () => {
        const newErrors: Record<string, string> = {};
        if (!formState.firstName) newErrors.firstName = 'Required';
        if (!formState.lastName) newErrors.lastName = 'Required';
        if (!formState.email) newErrors.email = 'Required';
        if (!formState.confirmEmail) newErrors.confirmEmail = 'Required';
        if (formState.email !== formState.confirmEmail) newErrors.confirmEmail = 'Emails do not match';
        if (!formState.phone) newErrors.phone = 'Required';
        if (!formState.relationship) newErrors.relationship = 'Required';
        if (!formState.address) newErrors.address = 'Required';
        if (!formState.city) newErrors.city = 'Required';
        if (!formState.state) newErrors.state = 'Required';
        if (!formState.zip) newErrors.zip = 'Required';
        if (!formState.legalNotices) newErrors.legalNotices = 'Required';
        if (!formState.completingFormName) newErrors.completingFormName = 'Required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    // Save handler for all steps
    const handleSave = async () => {
        try {
            const payload = {
                ...formState,
                quoteNumber: formState.quoteNumber,
                policyId: formState.policyId,
            };
            const response = await fetch("/api/policy", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error('Failed to update policy');
            }
            // Re-fetch updated policy and update UI
            let updated;
            if (formState.quoteNumber) {
                updated = await fetch(`/api/quote/step?quoteNumber=${formState.quoteNumber}`);
                if (updated.ok) {
                    const data = await updated.json();
                    setFormState(flattenPolicy(data.quote));
                }
            } else {
                updated = await fetch(`/api/policy?id=${formState.policyId || id}`);
                if (updated.ok) {
                    const data = await updated.json();
                    setFormState(flattenPolicy(data.policy));
                }
            }
            toast({ title: "Policy updated successfully!", description: "", variant: "default" });
        } catch (error) {
            toast({ title: "Failed to update policy: " + (error instanceof Error ? error.message : 'Unknown error'), description: "", variant: "destructive" });
        }
    };
    // Stepper UI
    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-6 gap-4"> {/* Ensure this matches skeleton */}
                <h1 className="text-2xl text-center sm:text-left font-bold text-gray-900 order-1 sm:order-none">Edit Quote</h1>
                <Button className="w-full sm:w-auto order-2 sm:order-none" variant="outline" size="sm" onClick={() => router.push('/admin/policies')}>Back to Policies</Button>
            </div>
            <div className="mb-8 flex flex-row max-w-4xl justify-center mx-auto items-center gap-2 sm:gap-3 md:gap-10">
                {[1, 2, 3, 4].map(s => (
                    <Button key={s} className="flex-1 min-w-0 text-center rounded-full md:flex-initial md:w-48" variant={step === s ? 'primary' : 'outline'} onClick={() => setStep(s)}>{`Step ${s}`}</Button>
                ))}
            </div>
            {step === 1 && (
                <Step1Form
                    state={formState}
                    errors={errors}
                    onChange={handleInputChange}
                    onValidate={validateStep1}
                    onContinue={() => setStep(2)}
                    showQuoteResults={showQuoteResults}
                    handleCalculateQuote={() => setShowQuoteResults(true)}
                    onSave={handleSave}
                />
            )}
            {step === 2 && (
                <Step2Form
                    state={formState}
                    errors={errors}
                    onChange={handleInputChange}
                    onValidate={validateStep2}
                    onContinue={() => setStep(3)}
                    onSave={handleSave}
                />
            )}
            {step === 3 && (
                <Step3Form
                    state={formState}
                    errors={errors}
                    onChange={handleInputChange}
                    onValidate={validateStep3}
                    onContinue={() => setStep(4)}
                    onSave={handleSave}
                />
            )}
            {step === 4 && (
                <Step4Form
                    state={formState}
                    onSave={handleSave}
                    onBack={() => setStep(3)}
                    emailSent={emailSent}
                    onEmail={() => setEmailSent(true)}
                />
            )}
        </div>
    );
} 