import React from "react";
import { AlertCircle, DollarSign, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input"; // Added Input
import Checkbox from "@/components/ui/Checkbox";
import DatePicker from "@/components/ui/DatePicker";
import {
    US_STATES,
    EVENT_TYPES,
    GUEST_RANGES,
    COVERAGE_LEVELS,
    LIABILITY_OPTIONS,
    // PROHIBITED_ACTIVITIES,
    LIQUOR_LIABILITY_PREMIUMS,
    LIQUOR_LIABILITY_PREMIUMS_NEW
} from "@/utils/constants";

export default function Step1Form({ state, errors, onChange, onValidate, onContinue, showQuoteResults, handleCalculateQuote, onSave, isCustomerEdit = false }) {
    const selectedDate = state.eventDate ? new Date(state.eventDate) : null;
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + 48);
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);
    const isLiquorLiabilityDisabled = state.liabilityCoverage === 'none';

    return (
        // Replaced Card with div and merged styles
        <div className="w-full max-w-4xl mx-auto mb-10 text-center shadow-2xl border-0 bg-white/90 rounded-2xl p-8 sm:p-10 md:p-12">
            <div className="mb-8">
                <p className="text-3xl md:text-4xl font-extrabold text-blue-900 drop-shadow text-center">Get Your Wedding Insurance Quote</p>
                <p className="text-lg md:text-xl text-blue-700 font-medium text-center">Tell us about your event to receive an instant quote</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 px-2 sm:px-4 md:px-8">
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
                            onChange={e => onChange('residentState', e.target.value)}
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
                            onChange={e => onChange('eventType', e.target.value)}
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
                            onChange={e => onChange('maxGuests', e.target.value)}
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

                <FormField
                    label="Event Date"
                    htmlFor="eventDate"
                    required
                    error={errors.eventDate}
                    tooltip="The primary date of your event. Must be at least 48 hours in the future."
                >
                    <DatePicker
                        selected={selectedDate}
                        onChange={date => onChange('eventDate', date ? date.toISOString().split('T')[0] : '')}
                        minDate={minDate}
                        maxDate={maxDate}
                        placeholderText="Select event date"
                        error={!!errors.eventDate}
                        
                    />
                </FormField>

                <FormField
                    label="Email Address"
                    htmlFor="email"
                    required
                    error={errors.email}
                    tooltip="We'll send your quote and policy documents to this email."
                >
                    <div className="w-72"> {/* This div will be centered by FormField */}
                        <Input
                            id="email"
                            type="email"
                            value={state.email || ''}
                            onChange={e => onChange('email', e.target.value)}
                            placeholder="you@email.com"
                            error={!!errors.email}
                            required
                            className="text-center" /* This styles the actual input text; wrapper handles width/centering */
                        />
                    </div>
                </FormField>

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
                            onChange={e => onChange('coverageLevel', parseInt(e.target.value))}
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

                <FormField
                    label="Liability Coverage"
                    htmlFor="liabilityCoverage"
                    tooltip="Protects against third-party bodily injury and property damage claims. This is often required by venues."
                >
                    <div className="relative w-72">
                        <select
                            id="liabilityCoverage"
                            value={state.liabilityCoverage}
                            onChange={e => onChange('liabilityCoverage', e.target.value)}
                            className={`block w-full rounded-md shadow-sm pl-3 pr-10 py-2 text-base border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.liabilityCoverage ? 'border-red-500 text-red-900' : 'border-gray-300 text-gray-900'} text-center`}
                        >
                            <option value="">Select liability coverage</option>
                            {LIABILITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value} className={option.isNew ? "text-red-400" : ""}>
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

                <FormField
                    label="Host Liquor Liability"
                    htmlFor="liquorLiability"
                    tooltip="Additional coverage for alcohol-related incidents. Only available if you select Liability Coverage."
                    error={errors.liquorLiability}
                >
                    <Checkbox
                        id="liquorLiability"
                        label={
                            <span className={`font-medium text-sm sm:text-base ${isLiquorLiabilityDisabled ? 'text-gray-400' : ''}`}>
                                Yes, add Host Liquor Liability coverage{' '}
                                {!isLiquorLiabilityDisabled && state.maxGuests
                                    ? `(+$${LIABILITY_OPTIONS.find(o => o.value === state.liabilityCoverage && o.isNew)
                                        ? LIQUOR_LIABILITY_PREMIUMS_NEW[state.maxGuests]
                                        : LIQUOR_LIABILITY_PREMIUMS[state.maxGuests]})`
                                    : ''}
                            </span>
                        }
                        checked={state.liquorLiability}
                        onChange={checked => onChange('liquorLiability', checked)}
                        disabled={isLiquorLiabilityDisabled}
                        description={isLiquorLiabilityDisabled
                                ? 'You must select Liability Coverage to add Host Liquor Liability'
                                : 'Provides coverage for alcohol-related incidents if alcohol is served at your event'}
                        /* className="mx-auto" removed as FormField will center the Checkbox component */
                        error={!!errors.liquorLiability}
                    />
                </FormField>

                <FormField
                    label="Special Activities"
                    htmlFor="specialActivities"
                    tooltip={isCustomerEdit 
                        ? "Contact admin to edit this" 
                        : "Some high-risk activities are excluded from coverage. Check this box if your event will include any special activities."}
                    error={errors.specialActivities}
                >
                    <Checkbox
                        id="specialActivities"
                        label={<span className="font-medium text-sm sm:text-base">My event will include special activities or features</span>}
                        checked={state.specialActivities}
                        onChange={checked => onChange('specialActivities', checked)}
                        description="Examples: fireworks, bounce houses, live animals, etc."
                        disabled={isCustomerEdit}
                        /* className="mx-auto" removed as FormField will center the Checkbox component */
                        error={!!errors.specialActivities}
                    />
                </FormField>
            </div>

            {/* COVID Disclosure - Full Width Block */}
            <div className="px-2 sm:px-4 md:px-8 mt-8"> {/* Added mt-8 for spacing from grid */}
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
                                label={<span className="font-medium text-sm sm:text-base">I understand that cancellations or impacts due to COVID-19, pandemics, or communicable diseases are not covered by this policy</span>}
                                checked={state.covidDisclosure}
                                onChange={checked => onChange('covidDisclosure', checked)}
                                error={!!errors.covidDisclosure}
                                className="w-full"
                            />
                        </FormField>
                    </div>
                </div>
            </div>
            <div className="px-2 sm:px-4 md:px-8"> {/* Wrapper for buttons to align with padding */}
                <div className="flex flex-col md:flex-row justify-center mt-10 gap-4 w-full">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleCalculateQuote}
                        // 
                        className="transition-transform duration-150"
                    >
                        <DollarSign size={18} />
                        Calculate Quote
                    </Button>
                    {onSave && (
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={onSave}
                            className="transition-transform duration-150 hover:scale-105"
                        >
                            Save
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
