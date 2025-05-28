"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, DollarSign, Shield } from "lucide-react";
import { useQuote } from "@/context/QuoteContext";
import type { QuoteState } from "@/context/QuoteContext";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Select from "@/components/ui/Select";
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

export default function QuoteGenerator() {
    const router = useRouter();
    const { state, dispatch } = useQuote();

    // Form state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showQuoteResults, setShowQuoteResults] = useState(false);
    const [showSpecialActivitiesModal, setShowSpecialActivitiesModal] = useState(false);

    // Clear quoteNumber on mount to always start a new quote
    useEffect(() => {
        localStorage.removeItem('quoteNumber');
    }, []);

    // Handle form field changes
    const handleInputChange = useCallback((field: keyof QuoteState, value: QuoteState[keyof QuoteState]) => {
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
    }, [dispatch, errors]);

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
        const handleCalculateQuote = async () => {
            if (validateForm()) {
                dispatch({ type: 'CALCULATE_QUOTE' });
                setShowQuoteResults(true);
                // Send email with quote
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
                        toast.success('Quotation email sent!');
                    } else {
                        const data = await res.json();
                        toast.error('Failed to send email: ' + (data.error || 'Unknown error'));
                    }
                } catch (err) {
                    toast.error('Failed to send email.');
                }
            } else {
                Object.entries(errors).forEach(([, msg]) => toast.error(msg, { variant: 'custom', className: 'bg-white text-red-600' }));
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
            router.push('/customer/event-information');
        } else {
            Object.entries(errors).forEach(([, msg]) => toast.error(msg, { variant: 'custom', className: 'bg-white text-red-600' }));
            const firstErrorField = Object.keys(errors)[0];
            if (firstErrorField) {
                const element = document.getElementById(firstErrorField);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    };

    // Disable liquor liability if no liability coverage selected
    const isLiquorLiabilityDisabled = state.liabilityCoverage === 'none';

    // If liability is none, ensure liquor liability is false
    useEffect(() => {
        if (isLiquorLiabilityDisabled && state.liquorLiability) {
            handleInputChange('liquorLiability', false);
        }
    }, [isLiquorLiabilityDisabled, state.liquorLiability, state.liabilityCoverage, handleInputChange]);

    // Handle special activities checkbox
    const handleSpecialActivitiesChange = (checked: boolean) => {
        if (checked) {
            setShowSpecialActivitiesModal(true);
        } else {
            handleInputChange('specialActivities', false);
        }
    };

    return (
        <>
            <Toaster position="top-right" />
            <div className="max-w-3xl mx-auto px-2 sm:px-4 md:px-6 pb-12 w-full">
                <Card
                    title={<span className="text-3xl md:text-4xl font-extrabold text-blue-900 drop-shadow">Get Your Wedding Insurance Quote</span>}
                    subtitle={<span className="text-lg md:text-xl text-blue-700 font-medium">Tell us about your event to receive an instant quote</span>}
                    icon={<Shield size={36} className="text-indigo-600" />}
                    className="mb-10 shadow-2xl border-0 bg-white/90"
                >
                    <div className="space-y-10">
                        {/* Resident State */}
                        <FormField
                            label={<span className="font-semibold text-gray-800">Policy Holder&apos;s Resident State</span>}
                            htmlFor="residentState"
                            required
                            error={errors.residentState}
                            tooltip="This is the state where the policy holder (person purchasing the insurance) legally resides."
                            className="mb-6"
                        >
                            <Select
                                id="residentState"
                                options={US_STATES}
                                value={state.residentState}
                                onChange={(value) => handleInputChange('residentState', value)}
                                placeholder="Select your state"
                                error={!!errors.residentState}
                            />
                        </FormField>
                        {/* Event Type */}
                        <FormField
                            label={<span className="font-semibold text-gray-800">Event Type</span>}
                            htmlFor="eventType"
                            required
                            error={errors.eventType}
                            tooltip="The type of private event you&apos;re planning. This helps determine appropriate coverage."
                            className="mb-6"
                        >
                            <Select
                                id="eventType"
                                options={EVENT_TYPES}
                                value={state.eventType}
                                onChange={(value) => handleInputChange('eventType', value)}
                                placeholder="Select event type"
                                error={!!errors.eventType}
                            />
                        </FormField>
                        {/* Maximum Guests */}
                        <FormField
                            label={<span className="font-semibold text-gray-800">Maximum Number of Guests</span>}
                            htmlFor="maxGuests"
                            required
                            error={errors.maxGuests}
                            tooltip="The maximum number of guests expected to attend. This affects liability premiums."
                            className="mb-6"
                        >
                            <Select
                                id="maxGuests"
                                options={GUEST_RANGES}
                                value={state.maxGuests}
                                onChange={(value) => handleInputChange('maxGuests', value)}
                                placeholder="Select guest count range"
                                error={!!errors.maxGuests}
                            />
                        </FormField>
                        {/* Event Date */}
                        <FormField
                            label={<span className="font-semibold text-gray-800">Event Date</span>}
                            htmlFor="eventDate"
                            required
                            error={errors.eventDate}
                            tooltip="The primary date of your event. Must be at least 48 hours in the future."
                            className="mb-6"
                        >
                            <DatePicker
                                selected={selectedDate}
                                onChange={handleDateChange}
                                minDate={minDate}
                                maxDate={maxDate}
                                placeholderText="Select event date"
                                error={!!errors.eventDate}
                            />
                        </FormField>
                        {/* Email Input */}
                        <FormField
                            label={<span className="font-semibold text-gray-800">Email Address</span>}
                            htmlFor="email"
                            required
                            error={errors.email}
                            tooltip="Enter your email address to receive the quote."
                            className="mb-6"
                        >
                            <input
                                id="email"
                                type="email"
                                value={state.email || ''}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="Enter your email"
                                className="w-full p-2 border rounded"
                                required
                            />
                        </FormField>
                        {/* Coverage Level */}
                        <FormField
                            label={<span className="font-semibold text-gray-800">Core Coverage Level</span>}
                            htmlFor="coverageLevel"
                            required
                            error={errors.coverageLevel}
                            tooltip="Select the amount of cancellation/postponement coverage needed. Higher levels provide more protection for deposits, attire, gifts, etc."
                            className="mb-6"
                        >
                            <Select
                                id="coverageLevel"
                                options={COVERAGE_LEVELS.map(level => ({
                                    value: level.value,
                                    label: level.label
                                }))}
                                value={state.coverageLevel?.toString() || ''}
                                onChange={(value) => handleInputChange('coverageLevel', parseInt(value))}
                                placeholder="Select coverage level"
                                error={!!errors.coverageLevel}
                            />
                        </FormField>
                        {/* Liability Coverage */}
                        <FormField
                            label={<span className="font-semibold text-gray-800">Liability Coverage</span>}
                            htmlFor="liabilityCoverage"
                            tooltip="Protects against third-party bodily injury and property damage claims. This is often required by venues."
                            className="mb-6"
                        >
                            <Select
                                id="liabilityCoverage"
                                options={LIABILITY_OPTIONS.map(option => ({
                                    ...option,
                                    className: option.isNew ? "text-red-400" : undefined
                                }))}
                                value={state.liabilityCoverage}
                                onChange={(value) => handleInputChange('liabilityCoverage', value)}
                                placeholder="Select liability coverage"
                                error={!!errors.liabilityCoverage}
                            />
                        </FormField>
                        {/* Liquor Liability */}
                        <FormField
                            label={<span className="font-semibold text-gray-800">Host Liquor Liability</span>}
                            htmlFor="liquorLiability"
                            tooltip="Additional coverage for alcohol-related incidents. Only available if you select Liability Coverage."
                            className="mb-6"
                        >
                            <Checkbox
                                id="liquorLiability"
                                label={<span className="font-medium">Yes, add Host Liquor Liability coverage {(!isLiquorLiabilityDisabled && state.maxGuests) ? `(+$${LIABILITY_OPTIONS.find(o => o.value === state.liabilityCoverage && o.isNew) ? LIQUOR_LIABILITY_PREMIUMS_NEW[state.maxGuests] : LIQUOR_LIABILITY_PREMIUMS[state.maxGuests]})` : ''}</span>}
                                checked={state.liquorLiability}
                                onChange={(checked) => handleInputChange('liquorLiability', checked)}
                                disabled={isLiquorLiabilityDisabled}
                                description={isLiquorLiabilityDisabled ? "You must select Liability Coverage to add Host Liquor Liability" : "Provides coverage for alcohol-related incidents if alcohol is served at your event"}
                            />
                        </FormField>
                        {/* Special Activities */}
                        <FormField
                            label={<span className="font-semibold text-gray-800">Special Activities</span>}
                            htmlFor="specialActivities"
                            tooltip="Some high-risk activities are excluded from coverage. Check this box if your event will include any special activities."
                            className="mb-6"
                        >
                            <Checkbox
                                id="specialActivities"
                                label={<span className="font-medium">My event will include special activities or features</span>}
                                checked={state.specialActivities}
                                onChange={handleSpecialActivitiesChange}
                                description="Examples: fireworks, bounce houses, live animals, etc."
                            />
                        </FormField>
                        {/* COVID-19 Disclosure */}
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mt-8 flex items-start gap-3">
                            <AlertCircle size={20} className="text-yellow-500 mt-1" />
                            <div>
                                <h3 className="font-semibold text-yellow-800 mb-1">Important Disclosures</h3>
                                <FormField
                                    label={<span className="font-medium text-gray-800">COVID-19 Exclusion Acknowledgment</span>}
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
                                    />
                                </FormField>
                            </div>
                        </div>
                        <div className="flex justify-center mt-10">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleCalculateQuote}
                                icon={<DollarSign size={18} />}
                                fullwidth="true"
                                className="transition-transform duration-150 hover:scale-105"
                            >
                                Calculate Quote
                            </Button>
                        </div>
                    </div>
                </Card>
                {/* Quote Results */}
                {showQuoteResults && (
                    <Card
                        title={<span className="text-xl font-bold text-blue-800">Your Insurance Quote</span>}
                        subtitle={<span className="text-base text-gray-600">Quote #{state.quoteNumber || 'PENDING'}</span>}
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
                                    <h3 className="text-xl font-semibold text-gray-800 mb-1">Total Premium</h3>
                                    <p className="text-3xl font-bold text-blue-700">{formatCurrency(state.totalPremium)}</p>
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
                                <div className="flex items-center mt-6 space-x-4">
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
            </div>
        </>
    );
}