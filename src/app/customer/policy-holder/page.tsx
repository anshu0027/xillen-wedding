"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, MapPin } from "lucide-react";
import { useQuote } from "@/context/QuoteContext";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import { US_STATES, RELATIONSHIP_OPTIONS, REFERRAL_OPTIONS } from "@/utils/constants";
import { isEmpty, isValidPhone, isValidZip, formatPhoneNumber } from "@/utils/validators";
import dynamic from 'next/dynamic';
import { toast } from "@/hooks/use-toast";
import type { QuoteState } from "@/context/QuoteContext";

const QuotePreview = dynamic(() => import('@/components/ui/QuotePreview'), { ssr: false });

export default function PolicyHolder() {
    const router = useRouter();
    const { state, dispatch } = useQuote();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formattedPhone, setFormattedPhone] = useState(state.phone);

    useEffect(() => {
        if (!state.step2Complete) {
            router.replace("/customer/event-information");
        }
    }, [state.step2Complete, router]);

    useEffect(() => {
        if (state.phone) {
            setFormattedPhone(formatPhoneNumber(state.phone));
        }
    }, [state.phone]);

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

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value.replace(/\D/g, '');
        handleInputChange('phone', input);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (isEmpty(state.firstName)) newErrors.firstName = 'Please enter your first name';
        if (isEmpty(state.lastName)) newErrors.lastName = 'Please enter your last name';
        if (isEmpty(state.phone)) newErrors.phone = 'Please enter your phone number';
        else if (!isValidPhone(state.phone)) newErrors.phone = 'Please enter a valid phone number';
        if (isEmpty(state.relationship)) newErrors.relationship = 'Please select your relationship to the couple';
        if (isEmpty(state.address)) newErrors.address = 'Please enter your address';
        if (isEmpty(state.city)) newErrors.city = 'Please enter your city';
        if (isEmpty(state.state)) newErrors.state = 'Please select your state';
        if (isEmpty(state.zip)) newErrors.zip = 'Please enter your ZIP code';
        else if (!isValidZip(state.zip)) newErrors.zip = 'Please enter a valid ZIP code';
        if (!state.legalNotices) newErrors.legalNotices = 'You must accept the legal notices to proceed';
        if (isEmpty(state.completingFormName)) newErrors.completingFormName = 'Please enter your name';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleBack = () => {
        router.push('/customer/event-information');
    };

    const handleContinue = async () => {
        if (validateForm()) {
            dispatch({ type: 'COMPLETE_STEP', step: 3 });
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
            router.push('/customer/review');
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

    return (
        <>
            <div className="max-w-3xl mx-auto w-full px-2 sm:px-4 md:px-8 py-6 md:py-10">
                <Card
                    title="Policyholder Information"
                    subtitle="Enter the policyholder's details"
                    icon={<User size={36} className="text-indigo-600" />}
                    className="mb-10 shadow-2xl border-0 bg-white/90"
                >
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                            <FormField
                                label="First Name"
                                htmlFor="firstName"
                                required
                                error={errors.firstName}
                                className="mb-4"
                            >
                                <Input
                                    id="firstName"
                                    value={state.firstName}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    error={!!errors.firstName}
                                />
                            </FormField>
                            <FormField
                                label="Last Name"
                                htmlFor="lastName"
                                required
                                error={errors.lastName}
                                className="mb-4"
                            >
                                <Input
                                    id="lastName"
                                    value={state.lastName}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    error={!!errors.lastName}
                                />
                            </FormField>
                        </div>
                    </div>
                </Card>
                {/* Contact Information */}
                <Card
                    title="Contact Information"
                    subtitle="How we can reach you regarding your policy"
                    icon={<Phone size={28} className="text-blue-600" />}
                    className="mb-8 shadow-lg border-0 bg-white"
                >
                    <div className="space-y-8 w-full">
                        <FormField
                            label="Phone Number"
                            htmlFor="phone"
                            required
                            error={errors.phone}
                            className="mb-4"
                        >
                            <Input
                                id="phone"
                                type="tel"
                                value={formattedPhone}
                                onChange={handlePhoneChange}
                                error={!!errors.phone}
                                icon={<Phone size={16} />}
                                placeholder="(123) 456-7890"
                            />
                        </FormField>
                        <FormField
                            label="Relationship to Honorees"
                            htmlFor="relationship"
                            required
                            error={errors.relationship}
                            tooltip="Your relationship to the people being celebrated"
                            className="mb-4"
                        >
                            <Select
                                id="relationship"
                                options={RELATIONSHIP_OPTIONS}
                                value={state.relationship}
                                onChange={(value) => handleInputChange('relationship', value)}
                                placeholder="Select relationship"
                                error={!!errors.relationship}
                            />
                        </FormField>
                        <FormField
                            label="How Did You Hear About Us?"
                            htmlFor="hearAboutUs"
                            className="mb-4"
                        >
                            <Select
                                id="hearAboutUs"
                                options={REFERRAL_OPTIONS}
                                value={state.hearAboutUs}
                                onChange={(value) => handleInputChange('hearAboutUs', value)}
                                placeholder="Select option (optional)"
                            />
                        </FormField>
                    </div>
                </Card>
                {/* Address */}
                <Card
                    title="Mailing Address"
                    subtitle="Where should we send physical policy documents?"
                    icon={<MapPin size={28} className="text-blue-600" />}
                    className="mb-8 shadow-lg border-0 bg-white"
                >
                    <div className="space-y-8 w-full">
                        <FormField
                            label="Address"
                            htmlFor="address"
                            required
                            error={errors.address}
                            className="mb-4"
                        >
                            <Input
                                id="address"
                                value={state.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                error={!!errors.address}
                                placeholder="Street Address"
                            />
                        </FormField>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                            <FormField
                                label="Country"
                                htmlFor="country"
                                required
                                className="mb-4"
                            >
                                <Input
                                    id="country"
                                    value={state.country}
                                    disabled
                                />
                            </FormField>
                            <FormField
                                label="City"
                                htmlFor="city"
                                required
                                error={errors.city}
                                className="mb-4"
                            >
                                <Input
                                    id="city"
                                    value={state.city}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    error={!!errors.city}
                                />
                            </FormField>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                            <FormField
                                label="State"
                                htmlFor="state"
                                required
                                error={errors.state}
                                className="mb-4"
                            >
                                <Select
                                    id="state"
                                    options={US_STATES}
                                    value={state.state}
                                    onChange={(value) => handleInputChange('state', value)}
                                    placeholder="Select state"
                                    error={!!errors.state}
                                />
                            </FormField>
                            <FormField
                                label="ZIP Code"
                                htmlFor="zip"
                                required
                                error={errors.zip}
                                className="mb-4"
                            >
                                <Input
                                    id="zip"
                                    value={state.zip}
                                    onChange={(e) => handleInputChange('zip', e.target.value)}
                                    error={!!errors.zip}
                                    placeholder="12345"
                                />
                            </FormField>
                        </div>
                    </div>
                </Card>
                {/* Legal Notices */}
                <Card className="mb-8 shadow-lg border-0 bg-white">
                    <div className="space-y-8 w-full">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-4">
                            <h3 className="font-semibold text-yellow-800 mb-2">Legal Notices</h3>
                            <p className="text-sm text-gray-700 mb-4">
                                By proceeding with this insurance application, I understand and agree to the following:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                                <li>All information I have provided is accurate and complete to the best of my knowledge.</li>
                                <li>Coverage is subject to the terms, conditions, and exclusions of the policy.</li>
                                <li>This insurance does not cover cancellations or impacts due to COVID-19, pandemics, or communicable diseases.</li>
                                <li>The company reserves the right to verify any information provided and may adjust or deny claims based on investigation findings.</li>
                                <li>If payment is authorized, I understand the coverage begins on the specified date and ends after the event date according to policy terms.</li>
                            </ul>
                        </div>
                        <FormField
                            label="Legal Acceptance"
                            htmlFor="legalNotices"
                            required
                            error={errors.legalNotices}
                            className="mb-4"
                        >
                            <Checkbox
                                id="legalNotices"
                                label="I have read, understand, and agree to the terms and conditions above"
                                checked={state.legalNotices}
                                onChange={(checked) => handleInputChange('legalNotices', checked)}
                                error={!!errors.legalNotices}
                            />
                        </FormField>
                        <FormField
                            label="Name of person completing this form"
                            htmlFor="completingFormName"
                            required
                            error={errors.completingFormName}
                            tooltip="Please enter your full name to verify your acceptance"
                            className="mb-4"
                        >
                            <Input
                                id="completingFormName"
                                value={state.completingFormName}
                                onChange={(e) => handleInputChange('completingFormName', e.target.value)}
                                error={!!errors.completingFormName}
                                placeholder="Full Name"
                            />
                        </FormField>
                    </div>
                </Card>
                {/* Navigation Buttons */}
                <div className="flex justify-between mt-10 gap-4">
                    <Button
                        variant="secondary"
                        onClick={handleBack}
                        className="transition-transform duration-150 hover:scale-105"
                    >
                        Back to Event Details
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleContinue}
                        className="transition-transform duration-150 hover:scale-105"
                    >
                        Continue to Review
                    </Button>
                </div>
            </div>
            <div className="hidden lg:block fixed right-11 mr-2 top-[260px] z-10">
                <QuotePreview />
            </div>
        </>
    );
}