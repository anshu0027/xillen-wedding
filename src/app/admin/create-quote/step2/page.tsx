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
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";

const QuotePreview = dynamic(() => import('@/components/ui/QuotePreview'), { ssr: false });

export default function EventInformation() {
    const router = useRouter();
    const { state, dispatch } = useQuote();
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        // Replace with real admin auth check
        const isAdminAuthenticated = () => {
            // Use the same key as AdminLayout
            return typeof window !== 'undefined' && localStorage.getItem('admin_logged_in') === 'true';
        };
        if (!isAdminAuthenticated()) {
            router.replace('/admin/login');
        }
    }, [router]);

    useEffect(() => {
        if (!state.step1Complete) {
            router.replace("/admin/create-quote/step1");
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
        if (isEmpty(state.honoree1FirstName)) newErrors.honoree1FirstName = 'Please enter the first name';
        if (isEmpty(state.honoree1LastName)) newErrors.honoree1LastName = 'Please enter the last name';
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
        router.push('/admin/create-quote/step1');
    };

    const handleContinue = async () => {
        if (validateForm()) {
            dispatch({ type: 'COMPLETE_STEP', step: 2 });
            // Save to DB
            const storedQuoteNumber = localStorage.getItem('quoteNumber');
            const payload = {
                step: 'COMPLETE',
                ...state,
                email: state.email,
                quoteNumber: storedQuoteNumber,
                source: 'ADMIN'
            };
            await fetch('/api/quote/step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            router.push('/admin/create-quote/step3');
        } else {
            // Show toast for each missing field
            Object.entries(errors).forEach(([field, message]) => {
                toast.error(message, { variant: 'custom', className: 'bg-white text-red-600' });
            });
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
            <Toaster position="top-right" />
            <div className="relative flex justify-center items-start min-h-screen bg-white border-none z-0 px-2 sm:px-4 md:px-6">
                <div className="w-full max-w-3xl z-0">
                    <div className="flex flex-col gap-8 w-full pb-12 mt-8">
                        <div className="flex-1 min-w-0 w-full">
                            {/* Honoree Information */}
                            <Card
                                title={<span className="text-3xl md:text-4xl font-extrabold text-blue-900 drop-shadow">Honoree Information</span>}
                                subtitle={<span className="text-lg md:text-xl text-blue-700 font-medium">Tell us who is being celebrated</span>}
                                icon={<CalendarCheck size={36} className="text-indigo-600" />}
                                className="mb-10 shadow-2xl border-0 bg-white/90"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 w-full">
                                    <div className="w-full">
                                        <h3 className="font-semibold text-gray-700 mb-4 text-lg">Honoree #1</h3>
                                        <FormField
                                            label={<span className="font-medium text-gray-800">First Name</span>}
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
                                            label={<span className="font-medium text-gray-800">Last Name</span>}
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
                                    <div className="w-full">
                                        <h3 className="font-semibold text-gray-700 mb-4 text-lg">
                                            Honoree #2 <span className="text-xs text-gray-400">(if applicable)</span>
                                        </h3>
                                        <FormField
                                            label={<span className="font-medium text-gray-800">First Name</span>}
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
                                            label={<span className="font-medium text-gray-800">Last Name</span>}
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
                                title={<span className="text-2xl font-bold text-blue-800">Ceremony Venue Information</span>}
                                subtitle={<span className="text-base text-gray-600">Details about where your event will be held</span>}
                                icon={<MapPin size={28} className="text-blue-600" />}
                                className="mb-8 shadow-lg border-0 bg-white"
                            >
                                <div className="space-y-8 w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
                                        <FormField
                                            label={<span className="font-medium text-gray-800">Venue Type</span>}
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
                                            label={<span className="font-medium text-gray-800">Indoor/Outdoor</span>}
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
                                        label={<span className="font-medium text-gray-800">Venue Name</span>}
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

                                    {/* Cruise ship conditionals */}
                                    {isCruiseShip ? (
                                        <>
                                            <FormField
                                                label={<span className="font-medium text-gray-800">Cruise Line</span>}
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
                                                label={<span className="font-medium text-gray-800">Departure Port</span>}
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
                                                label={<span className="font-medium text-gray-800">Address Line 1</span>}
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
                                                label={<span className="font-medium text-gray-800">Address Line 2</span>}
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

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full">
                                        <FormField
                                            label={<span className="font-medium text-gray-800">Country</span>}
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
                                            label={<span className="font-medium text-gray-800">City</span>}
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
                                            label={<span className="font-medium text-gray-800">State</span>}
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
                                        label={<span className="font-medium text-gray-800">ZIP Code</span>}
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
                                        label={<span className="font-medium">Add this venue as an Additional Insured on my policy</span>}
                                        checked={state.venueAsInsured}
                                        onChange={(checked) => handleInputChange('venueAsInsured', checked)}
                                    />
                                </div>
                            </Card>

                            <div className="flex flex-col sm:flex-row justify-between items-center mt-10 gap-4 w-full">
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    className="w-full sm:w-auto transition-transform duration-150 hover:scale-105"
                                >
                                    Back to Quote
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleContinue}
                                    className="w-full sm:w-auto transition-transform duration-150 hover:scale-105"
                                >
                                    Continue to Policyholder
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:block fixed right-11 mr-2 top-[260px] z-10">
                    <QuotePreview />
                </div>
            </div>

        </>
    );
}