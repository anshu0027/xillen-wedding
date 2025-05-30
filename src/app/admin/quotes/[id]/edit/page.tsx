"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "@/hooks/use-toast";

import Step1Form from '@/components/quote/Step1Form';
import Step2Form from '@/components/quote/Step2Form';
import Step3Form from '@/components/quote/Step3Form';
import Step4Form from '@/components/quote/Step4Form';

// Define the FormState interface
interface FormState {
    residentState: string;
    eventType: string;
    eventDate: string;
    maxGuests: string;
    coverageLevel: number | null;
    liabilityCoverage: string;
    liquorLiability: boolean;
    covidDisclosure: boolean;
    specialActivities: boolean;
    honoree1FirstName: string;
    honoree1LastName: string;
    honoree2FirstName: string;
    honoree2LastName: string;
    ceremonyLocationType: string;
    indoorOutdoor: string;
    venueName: string;
    venueAddress1: string;
    venueAddress2: string;
    venueCountry: string;
    venueCity: string;
    venueState: string;
    venueZip: string;
    venueAsInsured: boolean;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    relationship: string;
    hearAboutUs: string;
    address: string;
    country: string;
    city: string;
    state: string;
    zip: string;
    legalNotices: boolean;
    completingFormName: string;
    quoteNumber: string;
    totalPremium: number | null;
    basePremium: number | null;
    liabilityPremium: number | null;
    liquorLiabilityPremium: number | null;
    status: string;
}

function flattenQuote(quote: any): FormState {
    return {
        // Step 1
        residentState: quote.residentState || quote.policyHolder?.state || '',
        eventType: quote.event?.eventType || '',
        eventDate: quote.event?.eventDate || '',
        maxGuests: quote.event?.maxGuests || '',
        coverageLevel: quote.coverageLevel ?? null,
        email: quote?.email || '',
        liabilityCoverage: quote.liabilityCoverage ?? '',
        liquorLiability: quote.liquorLiability ?? false,
        covidDisclosure: quote.covidDisclosure ?? false,
        specialActivities: quote.specialActivities ?? false,
        // Step 2
        honoree1FirstName: quote.event?.honoree1FirstName || '',
        honoree1LastName: quote.event?.honoree1LastName || '',
        honoree2FirstName: quote.event?.honoree2FirstName || '',
        honoree2LastName: quote.event?.honoree2LastName || '',
        ceremonyLocationType: quote.event.venue?.ceremonyLocationType || '',
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

export default function EditQuote() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [step, setStep] = useState(1);
    const [formState, setFormState] = useState<FormState | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [emailSent, setEmailSent] = useState(false);
    const [showQuoteResults, setShowQuoteResults] = useState(false);
    useEffect(() => {
        async function fetchQuote() {
            const res = await fetch(`/api/quote/step?quoteNumber=${id}`);
            // console.log(res);
            if (res.ok) {
                const data = await res.json();
                setFormState(flattenQuote(data.quote));
            }
        }
        fetchQuote();
    }, [id]);
    useEffect(() => {
        // REMOVE admin auth check, allow access to all
    }, []);
    if (!formState) return <div>Loading...</div>;
    const handleInputChange = (field: string, value: string | number | boolean) => {
        setFormState((prev: FormState | null) => ({ ...prev!, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };
    console.log(formState)
    // Validation functions for each step (implement as needed)
    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};
        if (!formState.residentState) newErrors.residentState = 'Required';
        if (!formState.eventType) newErrors.eventType = 'Required';
        if (!formState.maxGuests) newErrors.maxGuests = 'Required';
        if (!formState.eventDate) newErrors.eventDate = 'Required';
        if (!formState.email) newErrors.email = 'Required';
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
    const handleSave = async () => {
        try {
            const payload = {
                ...formState,
                quoteNumber: formState.quoteNumber,
                source: "ADMIN",
                step: formState.status || "COMPLETE", // Send current status or mark as COMPLETE
                // status field from formState will be part of ...formState
            };
            const response = await fetch("/api/quote/step", {
                method: "PUT", // Use PUT for updating an existing quote
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error('Failed to update quote');
            }
            toast({ title: "Quote updated successfully!", description: "", variant: "default" });
        } catch (error) {
            toast({ title: "Failed to update quote: " + (error instanceof Error ? error.message : 'Unknown error'), description: "", variant: "destructive" });
        }
    };
    // Stepper UI
    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-6 gap-4">
                <h1 className="text-2xl text-center sm:text-left font-bold text-gray-900 order-1 sm:order-none">Edit Quote</h1>
                <Button className="w-full sm:w-auto order-2 sm:order-none" variant="outline" size="sm" onClick={() => router.push('/admin/quotes')}>Back to Quotes</Button>
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
                    onSave={handleSave}
                    isCustomerEdit={false} // Explicitly false for admin
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
                    // isCustomerEdit={false} // if needed for Step2Form
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
                    // isCustomerEdit={false} // if needed for Step3Form
                />
            )}
            {step === 4 && (
                <Step4Form
                    state={formState}
                    onSave={handleSave}
                    onBack={() => setStep(3)}
                    emailSent={emailSent}
                    onEmail={() => setEmailSent(true)}
                    // isCustomerEdit={false} // if needed for Step4Form
                />
            )}
        </div>
    );
} 