"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "@/hooks/use-toast";

import Step1Form from '@/components/quote/Step1Form';
import Step2Form from '@/components/quote/Step2Form';
import Step3Form from '@/components/quote/Step3Form';
import Step4Form from '@/components/quote/Step4Form';

function flattenQuote(quote: any) {
    return {
        // Step 1
        residentState: quote.residentState || quote.policyHolder?.state || '',
        eventType: quote.event?.eventType || '',
        eventDate: quote.event?.eventDate || '',
        maxGuests: quote.event?.maxGuests || '',
        email: quote.policyHolder?.email || '',
        coverageLevel: quote.coverageLevel ?? null,
        liabilityCoverage: quote.liabilityCoverage ?? '',
        liquorLiability: quote.liquorLiability ?? false,
        covidDisclosure: quote.covidDisclosure ?? false,
        specialActivities: quote.specialActivities ?? false,
        // Step 2
        honoree1FirstName: quote.event?.honoree1FirstName || '',
        honoree1LastName: quote.event?.honoree1LastName || '',
        honoree2FirstName: quote.event?.honoree2FirstName || '',
        honoree2LastName: quote.event?.honoree2LastName || '',
        ceremonyLocationType: quote.event?.ceremonyLocationType || '',
        indoorOutdoor: quote.event?.indoorOutdoor || '',
        venueName: quote.event?.venue?.name || '',
        venueAddress1: quote.event?.venue?.address1 || '',
        venueAddress2: quote.event?.venue?.address2 || '',
        venueCountry: quote.event?.venue?.country || '',
        venueCity: quote.event?.venue?.city || '',
        venueState: quote.event?.venue?.state || '',
        venueZip: quote.event?.venue?.zip || '',
        venueAsInsured: quote.event?.venue?.venueAsInsured || false,
        // Step 3
        firstName: quote.policyHolder?.firstName || '',
        lastName: quote.policyHolder?.lastName || '',
        phone: quote.policyHolder?.phone || '',
        relationship: quote.policyHolder?.relationship || '',
        hearAboutUs: quote.policyHolder?.hearAboutUs || '',
        address: quote.policyHolder?.address || '',
        country: quote.policyHolder?.country || '',
        city: quote.policyHolder?.city || '',
        state: quote.policyHolder?.state || '',
        zip: quote.policyHolder?.zip || '',
        legalNotices: quote.policyHolder?.legalNotices || false,
        completingFormName: quote.policyHolder?.completingFormName || '',
        // Other fields
        quoteNumber: quote.quoteNumber,
        totalPremium: quote.totalPremium,
        basePremium: quote.basePremium,
        liabilityPremium: quote.liabilityPremium,
        liquorLiabilityPremium: quote.liquorLiabilityPremium,
        status: quote.status,
    };
}

export default function EditUserQuote() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [step, setStep] = useState(1);
    const [formState, setFormState] = useState<any>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [emailSent, setEmailSent] = useState(false);
    const [showQuoteResults, setShowQuoteResults] = useState(false);
    useEffect(() => {
        async function fetchQuote() {
            const res = await fetch(`/api/quote/step?quoteNumber=${id}`);
            if (res.ok) {
                const data = await res.json();
                setFormState(flattenQuote(data.quote));
            }
        }
        fetchQuote();
    }, [id]);
    if (!formState) return <div>Loading...</div>;
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
    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};
        if (!formState.residentState) newErrors.residentState = 'Required';
        if (!formState.eventType) newErrors.eventType = 'Required';
        if (!formState.maxGuests) newErrors.maxGuests = 'Required';
        if (!formState.email) newErrors.email = 'Required';
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
    const saveStep = async (stepNum: number) => {
        let valid = false;
        if (stepNum === 1) valid = validateStep1();
        else if (stepNum === 2) valid = validateStep2();
        else if (stepNum === 3) valid = validateStep3();
        if (!valid) {
            toast({ title: "Please fix errors before saving.", description: "", variant: "destructive" });
            return;
        }
        const res = await fetch('/api/quote/step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formState, quoteNumber: id, step: 'COMPLETE' }),
        });
        if (res.ok) {
            toast({ title: "Quote updated successfully!", description: "", variant: "default" });
        } else {
            const data = await res.json();
            toast({ title: "Failed to update quote: " + (data.error || 'Unknown error'), description: "", variant: "destructive" });
        }
    };
    // Stepper UI
    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-6 gap-4">
                <h1 className="text-2xl text-center sm:text-left font-bold text-gray-900 order-1 sm:order-none">Edit Your Quote</h1>
                <Button className="w-full sm:w-auto order-2 sm:order-none" variant="outline" size="sm" onClick={() => router.push('/')}>Back to Home</Button>
            </div>
            <div className="mb-8 flex flex-row justify-center max-w-4xl mx-auto items-center gap-2 sm:gap-3 md:gap-10">
                {[1, 2, 3, 4].map(s => (
                    <Button key={s} className="flex-1 min-w-0 text-center rounded-full md:flex-initial md:w-48" variant={step === s ? 'default' : 'outline'} onClick={() => setStep(s)}>{`Step ${s}`}</Button>
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
                        onSave={() => saveStep(1)}
                        isCustomerEdit={true}
                    />
                )}
                {step === 2 && (
                    <Step2Form
                        state={formState}
                        errors={errors}
                        onChange={handleInputChange}
                        onValidate={validateStep2}
                        onContinue={() => setStep(3)}
                        onSave={() => saveStep(2)}
                        // isCustomerEdit might be relevant for other steps too if needed
                    />
                )}
                {step === 3 && (
                    <Step3Form
                        state={formState}
                        errors={errors}
                        onChange={handleInputChange}
                        onValidate={validateStep3}
                        onContinue={() => setStep(4)}
                        onSave={() => saveStep(3)}
                        // isCustomerEdit might be relevant for other steps too if needed
                    />
                )}
                {step === 4 && (
                    <Step4Form
                        state={formState}
                        onSave={saveStep}
                        onBack={() => setStep(3)}
                        emailSent={emailSent}
                        onEmail={() => setEmailSent(true)}
                        // isCustomerEdit might be relevant for other steps too if needed
                    />
                )}
        </div>
    );
} 