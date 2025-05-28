import React from "react";
import { AlertCircle, DollarSign, Shield } from "lucide-react";
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

export default function Step1Form({ state, errors, onChange, onValidate, onContinue, showQuoteResults, handleCalculateQuote, onSave }) {
    const selectedDate = state.eventDate ? new Date(state.eventDate) : null;
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + 48);
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);
    const isLiquorLiabilityDisabled = state.liabilityCoverage === 'none';

    return (
        <Card
            title="Get Your Wedding Insurance Quote"
            subtitle="Tell us about your event to receive an instant quote"
            icon={<Shield size={28} className="text-indigo-600" />}
            className="mb-10 shadow-2xl border-0 bg-white/90"
        >
            <div className="space-y-10 px-2 sm:px-4 md:px-8">
                <FormField
                    label={<span className="font-semibold text-gray-800 text-sm sm:text-base">Policy Holder's Resident State</span>}
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
                        onChange={value => onChange('residentState', value)}
                        placeholder="Select your state"
                        error={!!errors.residentState}
                        className="w-full"
                    />
                </FormField>

                <FormField
                    label={<span className="font-semibold text-gray-800 text-sm sm:text-base">Event Type</span>}
                    htmlFor="eventType"
                    required
                    error={errors.eventType}
                    tooltip="The type of private event you're planning. This helps determine appropriate coverage."
                    className="mb-6"
                >
                    <Select
                        id="eventType"
                        options={EVENT_TYPES}
                        value={state.eventType}
                        onChange={value => onChange('eventType', value)}
                        placeholder="Select event type"
                        error={!!errors.eventType}
                        className="w-full"
                    />
                </FormField>

                <FormField
                    label={<span className="font-semibold text-gray-800 text-sm sm:text-base">Maximum Number of Guests</span>}
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
                        onChange={value => onChange('maxGuests', value)}
                        placeholder="Select guest count range"
                        error={!!errors.maxGuests}
                        className="w-full"
                    />
                </FormField>

                <FormField
                    label={<span className="font-semibold text-gray-800 text-sm sm:text-base">Event Date</span>}
                    htmlFor="eventDate"
                    required
                    error={errors.eventDate}
                    tooltip="The primary date of your event. Must be at least 48 hours in the future."
                    className="mb-6"
                >
                    <DatePicker
                        selected={selectedDate}
                        onChange={date => onChange('eventDate', date ? date.toISOString().split('T')[0] : '')}
                        minDate={minDate}
                        maxDate={maxDate}
                        placeholderText="Select event date"
                        error={!!errors.eventDate}
                        className="w-full"
                    />
                </FormField>

                <FormField
                    label={<span className="font-semibold text-gray-800 text-sm sm:text-base">Email Address</span>}
                    htmlFor="email"
                    required
                    error={errors.email}
                    tooltip="We'll send your quote and policy documents to this email."
                    className="mb-6"
                >
                    <input
                        id="email"
                        type="email"
                        value={state.email || ''}
                        onChange={e => onChange('email', e.target.value)}
                        placeholder="you@email.com"
                        className="w-full p-2 border rounded"
                        required
                    />
                </FormField>

                <FormField
                    label={<span className="font-semibold text-gray-800 text-sm sm:text-base">Core Coverage Level</span>}
                    htmlFor="coverageLevel"
                    required
                    error={errors.coverageLevel}
                    tooltip="Select the amount of cancellation/postponement coverage needed. Higher levels provide more protection for deposits, attire, gifts, etc."
                    className="mb-6"
                >
                    <Select
                        id="coverageLevel"
                        options={COVERAGE_LEVELS.map(level => ({ value: level.value, label: level.label }))}
                        value={state.coverageLevel?.toString() || ''}
                        onChange={value => onChange('coverageLevel', parseInt(value))}
                        placeholder="Select coverage level"
                        error={!!errors.coverageLevel}
                        className="w-full"
                    />
                </FormField>

                <FormField
                    label={<span className="font-semibold text-gray-800 text-sm sm:text-base">Liability Coverage</span>}
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
                        onChange={value => onChange('liabilityCoverage', value)}
                        placeholder="Select liability coverage"
                        error={!!errors.liabilityCoverage}
                        renderOption={(option) => (
                            <span className={option.isNew ? "text-red-400" : undefined}>{option.label}</span>
                        )}
                        className="w-full"
                    />
                </FormField>

                <FormField
                    label={<span className="font-semibold text-gray-800 text-sm sm:text-base">Host Liquor Liability</span>}
                    htmlFor="liquorLiability"
                    tooltip="Additional coverage for alcohol-related incidents. Only available if you select Liability Coverage."
                    className="mb-6"
                >
                    <Checkbox
                        id="liquorLiability"
                        label={
                            <span className="font-medium text-sm sm:text-base">
                                Yes, add Host Liquor Liability coverage {(!isLiquorLiabilityDisabled && state.maxGuests) ? `(+$${LIABILITY_OPTIONS.find(o => o.value === state.liabilityCoverage && o.isNew) ? LIQUOR_LIABILITY_PREMIUMS_NEW[state.maxGuests] : LIQUOR_LIABILITY_PREMIUMS[state.maxGuests]})` : ''}
                            </span>
                        }
                        checked={state.liquorLiability}
                        onChange={checked => onChange('liquorLiability', checked)}
                        disabled={isLiquorLiabilityDisabled}
                        description={isLiquorLiabilityDisabled ? "You must select Liability Coverage to add Host Liquor Liability" : "Provides coverage for alcohol-related incidents if alcohol is served at your event"}
                        className="w-full"
                    />
                </FormField>

                <FormField
                    label={<span className="font-semibold text-gray-800 text-sm sm:text-base">Special Activities</span>}
                    htmlFor="specialActivities"
                    tooltip="Some high-risk activities are excluded from coverage. Check this box if your event will include any special activities."
                    className="mb-6"
                >
                    <Checkbox
                        id="specialActivities"
                        label={<span className="font-medium text-sm sm:text-base">My event will include special activities or features</span>}
                        checked={state.specialActivities}
                        onChange={checked => onChange('specialActivities', checked)}
                        description="Examples: fireworks, bounce houses, live animals, etc."
                        className="w-full"
                    />
                </FormField>

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
                    {onSave && (
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={onSave}
                            fullWidth
                            className="transition-transform duration-150 hover:scale-105"
                        >
                            Save
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}
