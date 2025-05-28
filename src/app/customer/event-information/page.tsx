"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CalendarCheck } from "lucide-react";
import { useQuote } from "@/context/QuoteContext";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import { VENUE_TYPES, INDOOR_OUTDOOR_OPTIONS, COUNTRIES, US_STATES } from "@/utils/constants";
import { isEmpty, isValidZip } from "@/utils/validators";
import dynamic from 'next/dynamic';
import { toast } from "@/hooks/use-toast";
import type { QuoteState } from "@/context/QuoteContext";

const QuotePreview = dynamic(() => import('@/components/ui/QuotePreview'), { ssr: false });

export default function EventInformation() {
    const router = useRouter();
    const { state, dispatch } = useQuote();
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!state.step1Complete) {
            router.replace("/customer/quote-generator");
        }
    }, [state.step1Complete, router]);

    const handleInputChange = (field: keyof QuoteState, value: string | boolean) => {
        dispatch({ type: 'UPDATE_FIELD', field, value });
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        const nameRegex = /^[a-zA-Z\-' ]+$/;
        if (isEmpty(state.honoree1FirstName)) newErrors.honoree1FirstName = 'Please enter the first name';
        else if (!nameRegex.test(state.honoree1FirstName)) newErrors.honoree1FirstName = 'First name contains invalid characters';
        if (isEmpty(state.honoree1LastName)) newErrors.honoree1LastName = 'Please enter the last name';
        else if (!nameRegex.test(state.honoree1LastName)) newErrors.honoree1LastName = 'Last name contains invalid characters';
        if (isEmpty(state.ceremonyLocationType)) newErrors.ceremonyLocationType = 'Please select a venue type';
        if (isEmpty(state.indoorOutdoor)) newErrors.indoorOutdoor = 'Please select indoor/outdoor option';
        if (isEmpty(state.venueName)) newErrors.venueName = 'Please enter the venue name';
        if (isEmpty(state.venueAddress1)) newErrors.venueAddress1 = 'Please enter the venue address';
        if (isEmpty(state.venueCity)) newErrors.venueCity = 'Please enter the city';
        if (isEmpty(state.venueState)) newErrors.venueState = 'Please select a state';
        if (isEmpty(state.venueZip)) newErrors.venueZip = 'Please enter the ZIP code';
        else if (!isValidZip(state.venueZip)) newErrors.venueZip = 'Please enter a valid ZIP code';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleBack = () => {
        router.push('/customer/quote-generator');
    };

    const handleContinue = async () => {
        if (validateForm()) {
            dispatch({ type: 'COMPLETE_STEP', step: 2 });
            // Save to DB
            const storedQuoteNumber = localStorage.getItem('quoteNumber');
            const payload = {
                step: 'COMPLETE',
                ...state,
                quoteNumber: storedQuoteNumber,
                source: 'CUSTOMER'
            };
            await fetch('/api/quote/step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            router.push('/customer/policy-holder');
        } else {
            Object.values(errors).forEach((msg) => toast.error(msg));
            const firstErrorField = Object.keys(errors)[0];
            if (firstErrorField) {
                const element = document.getElementById(firstErrorField);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    };

    const isCruiseShip = state.ceremonyLocationType === 'cruise_ship';

    return (
        <>
            <div className="relative flex justify-center min-h-screen bg-white border-none z-0">
                <div className="max-w-3xl mx-auto w-full px-2 sm:px-4 md:px-8 py-6 md:py-10">
                    <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto px-2 sm:px-4 md:px-6 pb-12 w-full mt-8">
                        <div className="flex-1 min-w-0">
                            {/* Honoree Information */}
                            <Card
                                title="Honoree Information"
                                subtitle="Tell us who is being celebrated"
                                icon={<CalendarCheck size={36} className="text-indigo-600" />}
                                className="mb-10 shadow-2xl border-0 bg-white/90"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full">
                                    <div>
                                        <h3 className="font-semibold text-gray-700 mb-4 text-lg">Honoree #1</h3>
                                        <FormField
                                            label="First Name"
                                            htmlFor="honoree1FirstName"
                                            required
                                            error={errors.honoree1FirstName}
                                            className="mb-4"
                                        >
                                            <Input
                                                id="honoree1FirstName"
                                                value={state.honoree1FirstName}
                                                onChange={(e) => handleInputChange('honoree1FirstName', e.target.value)}
                                                error={!!errors.honoree1FirstName}
                                            />
                                        </FormField>
                                        <FormField
                                            label="Last Name"
                                            htmlFor="honoree1LastName"
                                            required
                                            error={errors.honoree1LastName}
                                            className="mb-4"
                                        >
                                            <Input
                                                id="honoree1LastName"
                                                value={state.honoree1LastName}
                                                onChange={(e) => handleInputChange('honoree1LastName', e.target.value)}
                                                error={!!errors.honoree1LastName}
                                            />
                                        </FormField>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-700 mb-4 text-lg">Honoree #2 <span className="text-xs text-gray-400">(if applicable)</span></h3>
                                        <FormField
                                            label="First Name"
                                            htmlFor="honoree2FirstName"
                                            className="mb-4"
                                        >
                                            <Input
                                                id="honoree2FirstName"
                                                value={state.honoree2FirstName}
                                                onChange={(e) => handleInputChange('honoree2FirstName', e.target.value)}
                                            />
                                        </FormField>
                                        <FormField
                                            label="Last Name"
                                            htmlFor="honoree2LastName"
                                            className="mb-4"
                                        >
                                            <Input
                                                id="honoree2LastName"
                                                value={state.honoree2LastName}
                                                onChange={(e) => handleInputChange('honoree2LastName', e.target.value)}
                                            />
                                        </FormField>
                                    </div>
                                </div>
                            </Card>
                            {/* Venue Information */}
                            <Card
                                title="Ceremony Venue Information"
                                subtitle="Details about where your event will be held"
                                icon={<MapPin size={28} className="text-blue-600" />}
                                className="mb-8 shadow-lg border-0 bg-white"
                            >
                                <div className="space-y-8 w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                                        <FormField
                                            label="Venue Type"
                                            htmlFor="ceremonyLocationType"
                                            required
                                            error={errors.ceremonyLocationType}
                                            tooltip="The type of location where your event will be held"
                                            className="mb-4"
                                        >
                                            <Select
                                                id="ceremonyLocationType"
                                                options={VENUE_TYPES}
                                                value={state.ceremonyLocationType}
                                                onChange={(value) => handleInputChange('ceremonyLocationType', value)}
                                                placeholder="Select venue type"
                                                error={!!errors.ceremonyLocationType}
                                            />
                                        </FormField>
                                        <FormField
                                            label="Indoor/Outdoor"
                                            htmlFor="indoorOutdoor"
                                            required
                                            error={errors.indoorOutdoor}
                                            className="mb-4"
                                        >
                                            <Select
                                                id="indoorOutdoor"
                                                options={INDOOR_OUTDOOR_OPTIONS}
                                                value={state.indoorOutdoor}
                                                onChange={(value) => handleInputChange('indoorOutdoor', value)}
                                                placeholder="Select option"
                                                error={!!errors.indoorOutdoor}
                                            />
                                        </FormField>
                                    </div>
                                    <FormField
                                        label="Venue Name"
                                        htmlFor="venueName"
                                        required
                                        error={errors.venueName}
                                        className="mb-4"
                                    >
                                        <Input
                                            id="venueName"
                                            value={state.venueName}
                                            onChange={(e) => handleInputChange('venueName', e.target.value)}
                                            error={!!errors.venueName}
                                            placeholder={isCruiseShip ? "Cruise Line Name" : "Venue Name"}
                                        />
                                    </FormField>
                                    {/* Different fields for cruise ship */}
                                    {isCruiseShip ? (
                                        <>
                                            <FormField
                                                label="Cruise Line"
                                                htmlFor="venueAddress1"
                                                required
                                                error={errors.venueAddress1}
                                                className="mb-4"
                                            >
                                                <Input
                                                    id="venueAddress1"
                                                    value={state.venueAddress1}
                                                    onChange={(e) => handleInputChange('venueAddress1', e.target.value)}
                                                    error={!!errors.venueAddress1}
                                                    placeholder="Cruise Line"
                                                />
                                            </FormField>
                                            <FormField
                                                label="Departure Port"
                                                htmlFor="venueAddress2"
                                                className="mb-4"
                                            >
                                                <Input
                                                    id="venueAddress2"
                                                    value={state.venueAddress2}
                                                    onChange={(e) => handleInputChange('venueAddress2', e.target.value)}
                                                    placeholder="Departure Port"
                                                />
                                            </FormField>
                                        </>
                                    ) : (
                                        <>
                                            <FormField
                                                label="Address Line 1"
                                                htmlFor="venueAddress1"
                                                required
                                                error={errors.venueAddress1}
                                                className="mb-4"
                                            >
                                                <Input
                                                    id="venueAddress1"
                                                    value={state.venueAddress1}
                                                    onChange={(e) => handleInputChange('venueAddress1', e.target.value)}
                                                    error={!!errors.venueAddress1}
                                                    placeholder="Street Address"
                                                />
                                            </FormField>
                                            <FormField
                                                label="Address Line 2"
                                                htmlFor="venueAddress2"
                                                className="mb-4"
                                            >
                                                <Input
                                                    id="venueAddress2"
                                                    value={state.venueAddress2}
                                                    onChange={(e) => handleInputChange('venueAddress2', e.target.value)}
                                                    placeholder="Apt, Suite, Building (optional)"
                                                />
                                            </FormField>
                                        </>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                                        <FormField
                                            label="Country"
                                            htmlFor="venueCountry"
                                            required
                                            className="mb-4"
                                        >
                                            <Select
                                                id="venueCountry"
                                                options={COUNTRIES}
                                                value={state.venueCountry}
                                                onChange={(value) => handleInputChange('venueCountry', value)}
                                                placeholder="Select country"
                                            />
                                        </FormField>
                                        <FormField
                                            label="City"
                                            htmlFor="venueCity"
                                            required
                                            error={errors.venueCity}
                                            className="mb-4"
                                        >
                                            <Input
                                                id="venueCity"
                                                value={state.venueCity}
                                                onChange={(e) => handleInputChange('venueCity', e.target.value)}
                                                error={!!errors.venueCity}
                                            />
                                        </FormField>
                                        <FormField
                                            label="State"
                                            htmlFor="venueState"
                                            required
                                            error={errors.venueState}
                                            className="mb-4"
                                        >
                                            <Select
                                                id="venueState"
                                                options={US_STATES}
                                                value={state.venueState}
                                                onChange={(value) => handleInputChange('venueState', value)}
                                                placeholder="Select state"
                                                error={!!errors.venueState}
                                            />
                                        </FormField>
                                    </div>
                                    <FormField
                                        label="ZIP Code"
                                        htmlFor="venueZip"
                                        required
                                        error={errors.venueZip}
                                        className="mb-4"
                                    >
                                        <Input
                                            id="venueZip"
                                            value={state.venueZip}
                                            onChange={(e) => handleInputChange('venueZip', e.target.value)}
                                            error={!!errors.venueZip}
                                        />
                                    </FormField>
                                    <Checkbox
                                        id="venueAsInsured"
                                        label="Add this venue as an Additional Insured on my policy"
                                        checked={state.venueAsInsured}
                                        onChange={(checked) => handleInputChange('venueAsInsured', checked)}
                                    />
                                </div>
                            </Card>
                            <div className="flex justify-between mt-10 gap-4">
                                <Button variant="outline" onClick={handleBack} className="transition-transform duration-150 hover:scale-105">
                                    Back to Quote
                                </Button>
                                <Button variant="primary" onClick={handleContinue} className="transition-transform duration-150 hover:scale-105">
                                    Continue to Policyholder
                                </Button>
                            </div>
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