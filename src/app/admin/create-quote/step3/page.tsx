"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, MapPin, ChevronDown } from "lucide-react"; // Added ChevronDown
import { useQuote } from "@/context/QuoteContext";
import { Button } from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import { US_STATES, RELATIONSHIP_OPTIONS, REFERRAL_OPTIONS } from "@/utils/constants";
import { isEmpty, isValidPhone, isValidZip, formatPhoneNumber } from "@/utils/validators";
import dynamic from 'next/dynamic';
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";

const QuotePreview = dynamic(() => import('@/components/ui/QuotePreview'), { ssr: false });

export default function PolicyHolder() {
    const router = useRouter();
    const { state, dispatch } = useQuote();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formattedPhone, setFormattedPhone] = useState(state.phone);

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
        if (!state.step2Complete) {
            router.replace("/admin/create-quote/step-2");
        }
    }, [state.step2Complete, router]);

    useEffect(() => {
        if (state.phone) {
            setFormattedPhone(formatPhoneNumber(state.phone));
        }
    }, [state.phone]);

    const handleInputChange = (field: string, value: any) => {
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
        router.push('/admin/create-quote/step2');
    };

    const handleContinue = () => {
        if (validateForm()) {
            dispatch({ type: 'COMPLETE_STEP', step: 3 });
            // Save to DB
            const storedQuoteNumber = localStorage.getItem('quoteNumber');
            const payload = {
                step: 'COMPLETE',
                ...state,
                email: state.email, // Ensure email is always included
                quoteNumber: storedQuoteNumber,
                source: 'ADMIN'
            };
            fetch('/api/quote/step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            router.push('/admin/create-quote/step4');
        } else {
            Object.values(errors).forEach((msg) => {
                toast.error(msg);
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

    return (
        <>
            <div className="w-full mx-auto pb-12 lg:mr-[28.25rem]"> {/* Retain bottom padding, or manage spacing within sections */}
                {/* Policyholder Information Section */}
                <div className="mb-10 shadow-2xl border-0 bg-white/90 p-6 sm:p-8 md:p-10 rounded-2xl w-full">
                    <div className="flex items-center justify-center text-center mb-4 gap-4">
                        <div className="flex-shrink-0">
                            <User size={36} className="text-indigo-600" />
                        </div>
                        <div>
                            <div className="text-xl md:text-2xl font-extrabold leading-tight mb-1">Policyholder Information</div>
                            <div className="text-base text-gray-500 font-medium leading-tight">
                                Enter the policyholder&apos;s details
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10"> {/* Retained space-y-10 from original admin for consistency within this card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full"> {/* Matched gap from Step3Form */}
                            {/* First Name */}
                            <div className="mb-4">
                                <label htmlFor="firstName" className="block font-medium text-gray-800 mb-1 text-center">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="firstName"
                                    value={state.firstName}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    className={`w-full border rounded-md py-2 px-4 mx-auto ${errors.firstName ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center`}
                                />
                                {errors.firstName && <p className="text-sm text-red-500 mt-1 text-center">{errors.firstName}</p>}
                            </div>

                            {/* Last Name */}
                            <div className="mb-4">
                                <label htmlFor="lastName" className="block font-medium text-gray-800 mb-1 text-center">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="lastName"
                                    value={state.lastName}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    className={`w-full border rounded-md py-2 px-4 mx-auto ${errors.lastName ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center`}
                                />
                                {errors.lastName && <p className="text-sm text-red-500 mt-1 text-center">{errors.lastName}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Information Section */}
                <div className="mb-8 shadow-lg border-0 bg-white p-6 sm:p-8 md:p-10 rounded-2xl w-full">
                    <div className="flex items-center justify-center text-center mb-4 gap-4">
                        <div className="flex-shrink-0">
                            <Phone size={28} className="text-blue-600" />
                        </div>
                        <div>
                            <div className="text-xl md:text-2xl font-extrabold leading-tight mb-1">Contact Information</div>
                            <div className="text-base text-gray-500 font-medium leading-tight">How we can reach you regarding your policy</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full px-2 sm:px-4 md:px-8">
                        {/* Phone Number */}
                        <div className="mb-4">
                            <label htmlFor="phone" className="block font-medium text-gray-800 mb-1 text-center">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative"> {/* Added relative for potential icon if needed, though Step3Form doesn't show one here */}
                                <input
                                    id="phone"
                                    type="tel"
                                    value={formattedPhone}
                                    onChange={handlePhoneChange}
                                    placeholder="(123) 456-7890"
                                    className={`text-center w-full border rounded-md py-2 pr-2 ${errors.phone ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                            </div>
                            {errors.phone && <p className="text-sm text-red-500 mt-1 text-center">{errors.phone}</p>}
                        </div>

                        {/* Relationship to Honorees */}
                        <div className="mb-4">
                            <label htmlFor="relationship" className="block font-medium text-gray-800 mb-1 text-center">
                                Relationship to Honorees <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    id="relationship"
                                    value={state.relationship}
                                    onChange={(e) => handleInputChange('relationship', e.target.value)}
                                    className={`appearance-none w-full text-center border rounded-md py-2 pl-3 pr-10 ${errors.relationship ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                >
                                    <option value="" disabled>Select relationship</option>
                                    {RELATIONSHIP_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                            {errors.relationship && <p className="text-sm text-red-500 mt-1 text-center">{errors.relationship}</p>}
                        </div>

                        {/* How Did You Hear About Us */}
                        <div className="mb-4">
                            <label htmlFor="hearAboutUs" className="block font-medium text-gray-800 mb-1 text-center">
                                How Did You Hear About Us?
                            </label>
                            <div className="relative">
                                <select
                                    id="hearAboutUs"
                                    value={state.hearAboutUs}
                                    onChange={(e) => handleInputChange('hearAboutUs', e.target.value)}
                                    className="appearance-none w-full text-center border border-gray-300 rounded-md py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select option (optional)</option>
                                    {REFERRAL_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mailing Address Section */}
                <div className="mb-8 shadow-lg border-0 bg-white p-6 sm:p-8 md:p-10 rounded-2xl w-full">
                    <div className="flex items-center justify-center text-center mb-4 gap-4">
                        <div className="flex-shrink-0">
                            <MapPin size={28} className="text-blue-600" />
                        </div>
                        <div>
                            <div className="text-xl md:text-2xl font-extrabold leading-tight mb-1">Mailing Address</div>
                            <div className="text-base text-gray-500 font-medium leading-tight">
                                Where should we send physical policy documents?
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8 w-full px-2 sm:px-4 md:px-8">
                        {/* Address */}
                        <div className="mb-4">
                            <label htmlFor="address" className="block font-medium text-gray-800 mb-1 text-center">
                                Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="address"
                                value={state.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                placeholder="Street Address"
                                className={`w-full border rounded-md py-2 px-3 ${errors.address ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 text-center`}
                            />
                            {errors.address && <p className="text-sm text-red-500 mt-1 text-center">{errors.address}</p>}
                        </div>

                        {/* Country + City */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                            <div className="mb-4">
                                <label htmlFor="country" className="block font-medium text-gray-800 mb-1 text-center">
                                    Country <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="country"
                                    value={state.country} // Assuming state.country is pre-filled
                                    disabled
                                    className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-100 cursor-not-allowed text-center"
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="city" className="block font-medium text-gray-800 mb-1 text-center">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="city"
                                    value={state.city}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    className={`w-full border rounded-md py-2 px-3 ${errors.city ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 text-center`}
                                />
                                {errors.city && <p className="text-sm text-red-500 mt-1 text-center">{errors.city}</p>}
                            </div>
                        </div>

                        {/* State + Zip */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                            <div className="mb-4">
                                <label htmlFor="state" className="block font-medium text-gray-800 mb-1 text-center">
                                    State <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="state"
                                        value={state.state}
                                        onChange={(e) => handleInputChange('state', e.target.value)}
                                        className={`appearance-none w-full text-center border rounded-md py-2 pl-3 pr-10 ${errors.state ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    >
                                        <option value="" disabled>Select state</option>
                                        {US_STATES.map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                                {errors.state && <p className="text-sm text-red-500 mt-1 text-center">{errors.state}</p>}
                            </div>
                            <div className="mb-4">
                                <label htmlFor="zip" className="block font-medium text-gray-800 mb-1 text-center">
                                    ZIP Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="zip"
                                    value={state.zip}
                                    onChange={(e) => handleInputChange('zip', e.target.value)}
                                    placeholder="12345"
                                    className={`w-full border rounded-md py-2 px-3 ${errors.zip ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 text-center`}
                                />
                                {errors.zip && <p className="text-sm text-red-500 mt-1 text-center">{errors.zip}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legal Notices Section */}
                <div className="mb-8 shadow-lg border-0 bg-white p-6 sm:p-8 md:p-10 rounded-2xl w-full">
                    <div className="space-y-8 w-full px-2 sm:px-4 md:px-8">
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
                        <div className="mb-4">
                            <label htmlFor="legalNotices" className="block font-medium text-gray-800 mb-1 text-center">
                                Legal Acceptance <span className="text-red-500">*</span>
                            </label>
                                        <Checkbox
                                            id="legalNotices"
                                            label={<span className="font-medium">I have read, understand, and agree to the terms and conditions above</span>}
                                            checked={state.legalNotices}
                                            onChange={(checked) => handleInputChange('legalNotices', checked)}
                                            error={!!errors.legalNotices}
                                            className="justify-center"
                                        />
                            {errors.legalNotices && <p className="text-sm text-red-500 mt-1 text-center">{errors.legalNotices}</p>}
                        </div>

                        <div className="mb-4">
                            <label htmlFor="completingFormName" className="block text-center font-medium text-gray-800 mb-1">
                                Name of person completing this form <span className="text-red-500">*</span>
                                <span className="ml-2 text-gray-400" title="Please enter your full name to verify your acceptance">
                                    ⓘ
                                </span>
                            </label>
                            <input
                                id="completingFormName"
                                type="text"
                                value={state.completingFormName}
                                onChange={(e) => handleInputChange('completingFormName', e.target.value)}
                                placeholder="Full Name"
                                className={`block w-[60%] text-center mx-auto rounded-md shadow-sm text-base font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border pl-4 pr-4 py-2 ${errors.completingFormName
                                        ? 'border-red-400 text-red-900 placeholder-red-300 bg-red-50'
                                        : 'border-gray-200 text-gray-900 placeholder-gray-400'
                                    }`}
                            />
                            {errors.completingFormName && (
                                <p className="text-sm text-red-500 mt-1 text-center">{errors.completingFormName}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-10 gap-4 w-full">
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
            <div className="hidden lg:block fixed w-96 right-11 mr-2 top-[260px] z-10"> {/* Preview width is w-96 (24rem), offset right-11 (2.75rem) + mr-2 (0.5rem) */}
                <QuotePreview />
            </div>
        </>
    );
}