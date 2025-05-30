"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronDown, DollarSign, Shield } from "lucide-react";
import { useQuote } from "@/context/QuoteContext";
import type { QuoteState } from "@/context/QuoteContext";
import { Button } from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import DatePicker from "@/components/ui/DatePicker";
import {
    US_STATES,
    EVENT_TYPES,
    GUEST_RANGES,
    COVERAGE_LEVELS,
    LIABILITY_OPTIONS,
    PROHIBITED_ACTIVITIES,
    LIQUOR_LIABILITY_PREMIUMS,
    LIQUOR_LIABILITY_PREMIUMS_NEW
} from "@/utils/constants";
import {
    isDateInFuture,
    isDateAtLeast48HoursAhead,
    isDateWithinTwoYears,
    formatCurrency
} from "@/utils/validators";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";
import Card from "@/components/ui/Card";

export default function QuoteGenerator() {
    const router = useRouter();
    const { state, dispatch } = useQuote();

    // Form state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showQuoteResults, setShowQuoteResults] = useState(false);
    const [showSpecialActivitiesModal, setShowSpecialActivitiesModal] = useState(false);

    // Handle form field changes
    const handleInputChange = (field: keyof QuoteState, value: QuoteState[keyof QuoteState]) => {
        dispatch({ type: 'UPDATE_FIELD', field, value });

        // Clear error for this field when it's updated
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }

        // Reset quote results when key fields change
        if ([
            'coverageLevel',
            'liabilityCoverage',
            'liquorLiability',
            'maxGuests'
        ].includes(field)) {
            setShowQuoteResults(false);
        }
    };

    // Format date for the date picker
    const selectedDate = state.eventDate ? new Date(state.eventDate) : null;

    // Handle date change
    const handleDateChange = (date: Date | null) => {
        if (date) {
            handleInputChange('eventDate', date.toISOString().split('T')[0]);
        } else {
            handleInputChange('eventDate', '');
        }
    };

    // Calculate minimum date (48 hours from now)
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + 48);

    // Calculate maximum date (2 years from now)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);

    // Validate form
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!state.residentState) {
            newErrors.residentState = 'Please select your state of residence';
        }

        if (!state.eventType) {
            newErrors.eventType = 'Please select an event type';
        }

        if (!state.maxGuests) {
            newErrors.maxGuests = 'Please select the maximum number of guests';
        }

        if (!state.eventDate) {
            newErrors.eventDate = 'Please select the event date';
        } else {
            const eventDate = new Date(state.eventDate);
            if (!isDateInFuture(eventDate)) {
                newErrors.eventDate = 'Event date must be in the future';
            } else if (!isDateAtLeast48HoursAhead(eventDate)) {
                newErrors.eventDate = 'Event date must be at least 48 hours in the future';
            } else if (!isDateWithinTwoYears(eventDate)) {
                newErrors.eventDate = 'Event date must be within the next 2 years';
            }
        }

        if (!state.email) {
            newErrors.email = 'Please enter your email address';
        } else if (!/^\S+@\S+\.\S+$/.test(state.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (state.coverageLevel === null) {
            newErrors.coverageLevel = 'Please select a coverage level';
        }

        if (!state.covidDisclosure) {
            newErrors.covidDisclosure = 'You must acknowledge the COVID-19 exclusion';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle calculate quote
    const handleCalculateQuote = () => {
        if (validateForm()) {
            dispatch({ type: 'CALCULATE_QUOTE' });
            setShowQuoteResults(true);
        } else {
            // Show toast for each missing field
            Object.entries(errors).forEach(([field, message]) => toast.error(message));
            // Scroll to first error
            const firstErrorField = Object.keys(errors)[0];
            if (firstErrorField) {
                const element = document.getElementById(firstErrorField);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    };

    // Handle continue to next step
    const handleContinue = async () => {
        if (validateForm()) {
            if (!showQuoteResults) {
                handleCalculateQuote();
                return;
            }
            dispatch({ type: 'COMPLETE_STEP', step: 1 });
            // Save to DB
            const storedQuoteNumber = localStorage.getItem('quoteNumber');
            const payload = {
                step: 'COMPLETE',
                ...state,
                quoteNumber: storedQuoteNumber,
                source: 'ADMIN'
            };
            await fetch('/api/quote/step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            router.push('/admin/create-quote/step2');
        }
    };

    // Disable liquor liability if no liability coverage selected
    const isLiquorLiabilityDisabled = state.liabilityCoverage === 'none';

    // If liability is none, ensure liquor liability is false
    useEffect(() => {
        if (isLiquorLiabilityDisabled && state.liquorLiability) {
            handleInputChange('liquorLiability', false);
        }
    }, [state.liabilityCoverage]);

    // Handle special activities checkbox
    const handleSpecialActivitiesChange = (checked: boolean) => {
        if (checked) {
            setShowSpecialActivitiesModal(true);
        } else {
            handleInputChange('specialActivities', false);
        }
    };

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

    return (
        <>
            {/* Replaced Card with div structure from Step1Form.tsx */}
            {/* Outermost div simplified. Layout handles max-width and centering. This div now focuses on card-like styling. */}
            <div className="w-full mb-10 text-center shadow-2xl border-0 bg-white/90 rounded-2xl p-8 sm:p-10 md:p-12">
                <div className="mb-8">
                    <p className="text-3xl md:text-4xl font-extrabold text-blue-900 drop-shadow text-center">Get Your Wedding Insurance Quote</p>
                    <p className="text-lg md:text-xl text-blue-700 font-medium text-center">Tell us about your event to receive an instant quote</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 px-2 sm:px-4 md:px-8">
                    {/* Resident State */}
                    <FormField
                        label="Policy Holder's Resident State"
                        htmlFor="residentState"
                        required
                        error={errors.residentState}
                        tooltip="This is the state where the policy holder (person purchasing the insurance) legally resides."
                    >
                        <div className="relative w-72">
                            <select
                                id="residentState"
                                value={state.residentState}
                                onChange={(e) => handleInputChange('residentState', e.target.value)}
                                className={`block w-full rounded-md shadow-sm pl-3 pr-10 py-2 text-base border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.residentState ? 'border-red-500 text-red-900' : 'border-gray-300 text-gray-900'} text-center`}
                            >
                                <option value="">Select your state</option>
                                {US_STATES.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                                size={16}
                            />
                        </div>
                    </FormField>

                    {/* Event Type */}
                    <FormField
                        label="Event Type"
                        htmlFor="eventType"
                        required
                        error={errors.eventType}
                        tooltip="The type of private event you're planning. This helps determine appropriate coverage."
                    >
                        <div className="relative w-72">
                            <select
                                id="eventType"
                                value={state.eventType}
                                onChange={(e) => handleInputChange('eventType', e.target.value)}
                                className={`block w-full rounded-md shadow-sm pl-3 pr-10 py-2 text-base border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.eventType ? 'border-red-500 text-red-900' : 'border-gray-300 text-gray-900'} text-center`}
                            >
                                <option value="">Select event type</option>
                                {EVENT_TYPES.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                                size={16}
                            />
                        </div>
                    </FormField>

                    {/* Maximum Guests */}
                    <FormField
                        label="Maximum Number of Guests"
                        htmlFor="maxGuests"
                        required
                        error={errors.maxGuests}
                        tooltip="The maximum number of guests expected to attend. This affects liability premiums."
                    >
                        <div className="relative w-72">
                            <select
                                id="maxGuests"
                                value={state.maxGuests}
                                onChange={(e) => handleInputChange('maxGuests', e.target.value)}
                                className={`block w-full rounded-md shadow-sm pl-3 pr-10 py-2 text-base border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.maxGuests ? 'border-red-500 text-red-900' : 'border-gray-300 text-gray-900'} text-center`}
                            >
                                <option value="">Select guest count range</option>
                                {GUEST_RANGES.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                                size={16}
                            />
                        </div>
                    </FormField>

                    {/* Event Date */}
                    <FormField
                        label="Event Date"
                        htmlFor="eventDate"
                        required
                        error={errors.eventDate}
                        tooltip="The primary date of your event. Must be at least 48 hours in the future."
                    >
                        <div className="w-72">
                            <DatePicker
                                selected={selectedDate}
                                onChange={handleDateChange}
                                minDate={minDate}
                                maxDate={maxDate}
                                placeholderText="Select event date"
                                error={!!errors.eventDate}
                            />
                        </div>
                    </FormField>

                    {/* Email Address */}
                    <FormField
                        label="Email Address"
                        htmlFor="email"
                        required
                        error={errors.email}
                        tooltip="We'll send your quote and policy documents to this email."
                    >
                        <div className="w-72">
                            <Input
                                id="email"
                                type="email"
                                value={state.email || ''}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="you@email.com"
                                error={!!errors.email}
                                required
                                className="text-center"
                            />
                        </div>
                    </FormField>

                    {/* Coverage Level */}
                    <FormField
                        label="Core Coverage Level"
                        htmlFor="coverageLevel"
                        required
                        error={errors.coverageLevel}
                        tooltip="Select the amount of cancellation/postponement coverage needed. Higher levels provide more protection for deposits, attire, gifts, etc."
                    >
                        <div className="relative w-72">
                            <select
                                id="coverageLevel"
                                value={state.coverageLevel?.toString() || ''}
                                onChange={(e) => handleInputChange('coverageLevel', parseInt(e.target.value))}
                                className={`block w-full rounded-md shadow-sm pl-3 pr-10 py-2 text-base border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.coverageLevel ? 'border-red-500 text-red-900' : 'border-gray-300 text-gray-900'} text-center`}
                            >
                                <option value="">Select coverage level</option>
                                {COVERAGE_LEVELS.map(level => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                                size={16}
                            />
                        </div>
                    </FormField>

                    {/* Liability Coverage */}
                    <FormField
                        label="Liability Coverage"
                        htmlFor="liabilityCoverage"
                        tooltip="Protects against third-party bodily injury and property damage claims. This is often required by venues."
                    >
                        <div className="relative w-72">
                            <select
                                id="liabilityCoverage"
                                value={state.liabilityCoverage}
                                onChange={(e) => handleInputChange('liabilityCoverage', e.target.value)}
                                className={`block w-full rounded-md shadow-sm pl-3 pr-10 py-2 text-base border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.liabilityCoverage ? 'border-red-500 text-red-900' : 'border-gray-300 text-gray-900'} text-center`}
                            >
                                <option value="">Select liability coverage</option>
                                {LIABILITY_OPTIONS.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                        className={option.isNew ? "text-red-400" : ""}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                                size={16}
                            />
                        </div>
                    </FormField>

                    {/* Liquor Liability */}
                    <FormField
                        label="Host Liquor Liability"
                        htmlFor="liquorLiability"
                        tooltip="Additional coverage for alcohol-related incidents. Only available if you select Liability Coverage."
                        error={errors.liquorLiability}
                    >
                        <Checkbox
                            id="liquorLiability"
                            label={
                                <span className="font-medium">
                                    Yes, add Host Liquor Liability coverage {(!isLiquorLiabilityDisabled && state.maxGuests) ? `(+$${LIABILITY_OPTIONS.find(o => o.value === state.liabilityCoverage && o.isNew) ? LIQUOR_LIABILITY_PREMIUMS_NEW[state.maxGuests] : LIQUOR_LIABILITY_PREMIUMS[state.maxGuests]})` : ''}
                                </span>
                            }
                            checked={state.liquorLiability}
                            onChange={(checked) => handleInputChange('liquorLiability', checked)}
                            disabled={isLiquorLiabilityDisabled}
                            description={
                                isLiquorLiabilityDisabled
                                    ? "You must select Liability Coverage to add Host Liquor Liability"
                                    : "Provides coverage for alcohol-related incidents if alcohol is served at your event"
                            }
                            error={!!errors.liquorLiability}
                        />
                    </FormField>

                    {/* Special Activities */}
                    <FormField
                        label="Special Activities"
                        htmlFor="specialActivities"
                        tooltip="Some high-risk activities are excluded from coverage. Check this box if your event will include any special activities."
                        error={errors.specialActivities}
                    >
                        <Checkbox
                            id="specialActivities"
                            label={<span className="font-medium">My event will include special activities or features</span>}
                            checked={state.specialActivities}
                            onChange={handleSpecialActivitiesChange}
                            description="Examples: fireworks, bounce houses, live animals, etc."
                            error={!!errors.specialActivities}
                        />
                    </FormField>
                </div>

                {/* COVID-19 Disclosure */}
                <div className="px-2 sm:px-4 md:px-8 mt-8">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mt-8 flex flex-col sm:flex-row items-start gap-3">
                        <AlertCircle size={20} className="text-yellow-500 mt-1" />
                        <div>
                            <h3 className="font-semibold text-yellow-800 mb-1 text-sm sm:text-base">Important Disclosures</h3>
                            <FormField
                                label={<span className="font-medium text-gray-800 text-sm sm:text-base">COVID-19 Exclusion Acknowledgment</span>}
                                htmlFor="covidDisclosure"
                                error={errors.covidDisclosure}
                                className="mt-3"
                            >
                                <Checkbox
                                    id="covidDisclosure"
                                    label={<span className="font-medium">I understand that cancellations or impacts due to COVID-19, pandemics, or communicable diseases are not covered by this policy</span>}
                                    checked={state.covidDisclosure}
                                    onChange={(checked) => handleInputChange('covidDisclosure', checked)}
                                    error={!!errors.covidDisclosure}
                                    className="w-full"
                                />
                            </FormField>
                        </div>
                    </div>
                </div>
                <div className="px-2 sm:px-4 md:px-8">
                    <div className="flex flex-col md:flex-row justify-center mt-10 gap-4 w-full">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleCalculateQuote}
                            icon={<DollarSign size={18} />}
                            fullWidth
                            className="transition-transform duration-150"
                        >
                            Calculate Quote
                        </Button>
                        {/* onSave button is not part of this page's logic, so it's omitted */}
                    </div>
                </div>
            </div>

            {/* Quote Results */}
            {showQuoteResults && (
                <Card
                    title={<span className="text-xl font-bold text-blue-800">Your Insurance Quote</span>}
                    subtitle={<span className="text-base text-gray-600">Quote #{state.quoteNumber}</span>}
                    icon={<DollarSign size={24} className="text-blue-600" />}
                    className="mb-8 border-0 bg-white shadow-lg"
                    footer={
                        <div className="flex justify-end">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleContinue}
                                className="transition-transform duration-150 hover:scale-105"
                            >
                                Continue to Event Details
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-6">
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <div className="text-center">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">Total Premium</h3>
                                <p className="text-2xl sm:text-3xl font-bold text-blue-700">{formatCurrency(state.totalPremium)}</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
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

                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-800 mb-2">Coverage Summary</h3>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex justify-between">
                                    <span>Event Type:</span>
                                    <span className="font-medium">{EVENT_TYPES.find(t => t.value === state.eventType)?.label}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Event Date:</span>
                                    <span className="font-medium">{state.eventDate ? new Date(state.eventDate).toLocaleDateString() : 'N/A'}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Core Coverage:</span>
                                    <span className="font-medium">{COVERAGE_LEVELS.find(l => l.value === state.coverageLevel?.toString())?.label}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Liability Coverage:</span>
                                    <span className="font-medium">{LIABILITY_OPTIONS.find(o => o.value === state.liabilityCoverage)?.label}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Host Liquor Liability:</span>
                                    <span className="font-medium">{state.liquorLiability ? 'Included' : 'Not Included'}</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex items-center text-sm bg-gray-100 text-gray-700 p-4 rounded-lg">
                            <AlertCircle size={16} className="flex-shrink-0 mr-2" />
                            <p>This quote is valid for 30 days. Continue to provide event details and complete your purchase.</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Special Activities Modal */}
            {showSpecialActivitiesModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-lg transition-all duration-200">
                        <div className="p-5">
                            <h3 className="text-lg font-semibold text-red-600 mb-3">Special Activities Warning</h3>
                            <p className="text-gray-700 mb-4">
                                The following activities are typically excluded from coverage. If your event includes any of these, please contact our support team for special underwriting.
                            </p>
                            <ul className="list-disc pl-5 mb-4 space-y-1 text-sm text-gray-700">
                                {PROHIBITED_ACTIVITIES.map((activity, index) => (
                                    <li key={index}>{activity}</li>
                                ))}
                            </ul>
                            <div className="flex flex-col sm:flex-row items-center justify-end mt-6 space-y-2 sm:space-y-0 sm:space-x-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        handleInputChange('specialActivities', false);
                                        setShowSpecialActivitiesModal(false);
                                    }}
                                >
                                    My event doesn&apos;t include these
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        handleInputChange('specialActivities', true);
                                        setShowSpecialActivitiesModal(false);
                                    }}
                                >
                                    Contact me for special coverage
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}