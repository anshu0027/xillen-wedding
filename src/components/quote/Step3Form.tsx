import React from "react";
import { User, Phone, MapPin } from "lucide-react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import { US_STATES, RELATIONSHIP_OPTIONS, REFERRAL_OPTIONS } from "@/utils/constants";

export default function Step3Form({ state, errors, onChange, onSave }) {
    return (
        <>
            <Card
                title="Policyholder Information"
                subtitle="Enter the policyholder's details"
                icon={<User size={36} className="text-indigo-600" />}
                className="mb-10 shadow-2xl border-0 bg-white/90"
            >
                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <FormField
                            label={<span className="font-medium text-gray-800">First Name</span>}
                            htmlFor="firstName"
                            required
                            error={errors.firstName}
                            className="mb-4"
                        >
                            <Input
                                id="firstName"
                                value={state.firstName}
                                onChange={e => onChange('firstName', e.target.value)}
                                error={!!errors.firstName}
                            />
                        </FormField>
                        <FormField
                            label={<span className="font-medium text-gray-800">Last Name</span>}
                            htmlFor="lastName"
                            required
                            error={errors.lastName}
                            className="mb-4"
                        >
                            <Input
                                id="lastName"
                                value={state.lastName}
                                onChange={e => onChange('lastName', e.target.value)}
                                error={!!errors.lastName}
                            />
                        </FormField>
                    </div>
                </div>
            </Card>
            <Card
                title="Contact Information"
                subtitle="How we can reach you regarding your policy"
                icon={<Phone size={28} className="text-blue-600" />}
                className="mb-8 shadow-lg border-0 bg-white"
            >
                <div className="space-y-8 w-full px-2 sm:px-4 md:px-8">
                    <FormField
                        label={<span className="font-medium text-gray-800">Phone Number</span>}
                        htmlFor="phone"
                        required
                        error={errors.phone}
                        className="mb-4"
                    >
                        <Input
                            id="phone"
                            type="tel"
                            value={state.phone}
                            onChange={e => onChange('phone', e.target.value)}
                            error={!!errors.phone}
                            icon={<Phone size={16} />}
                            placeholder="(123) 456-7890"
                        />
                    </FormField>
                    <FormField
                        label={<span className="font-medium text-gray-800">Relationship to Honorees</span>}
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
                            onChange={value => onChange('relationship', value)}
                            placeholder="Select relationship"
                            error={!!errors.relationship}
                        />
                    </FormField>
                    <FormField
                        label={<span className="font-medium text-gray-800">How Did You Hear About Us?</span>}
                        htmlFor="hearAboutUs"
                        className="mb-4"
                    >
                        <Select
                            id="hearAboutUs"
                            options={REFERRAL_OPTIONS}
                            value={state.hearAboutUs}
                            onChange={value => onChange('hearAboutUs', value)}
                            placeholder="Select option (optional)"
                        />
                    </FormField>
                </div>
            </Card>
            <Card
                title="Mailing Address"
                subtitle="Where should we send physical policy documents?"
                icon={<MapPin size={28} className="text-blue-600" />}
                className="mb-8 shadow-lg border-0 bg-white"
            >
                <div className="space-y-8 w-full px-2 sm:px-4 md:px-8">
                    <FormField
                        label={<span className="font-medium text-gray-800">Address</span>}
                        htmlFor="address"
                        required
                        error={errors.address}
                        className="mb-4"
                    >
                        <Input
                            id="address"
                            value={state.address}
                            onChange={e => onChange('address', e.target.value)}
                            error={!!errors.address}
                            placeholder="Street Address"
                        />
                    </FormField>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                        <FormField
                            label={<span className="font-medium text-gray-800">Country</span>}
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
                            label={<span className="font-medium text-gray-800">City</span>}
                            htmlFor="city"
                            required
                            error={errors.city}
                            className="mb-4"
                        >
                            <Input
                                id="city"
                                value={state.city}
                                onChange={e => onChange('city', e.target.value)}
                                error={!!errors.city}
                            />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                        <FormField
                            label={<span className="font-medium text-gray-800">State</span>}
                            htmlFor="state"
                            required
                            error={errors.state}
                            className="mb-4"
                        >
                            <Select
                                id="state"
                                options={US_STATES}
                                value={state.state}
                                onChange={value => onChange('state', value)}
                                placeholder="Select state"
                                error={!!errors.state}
                            />
                        </FormField>
                        <FormField
                            label={<span className="font-medium text-gray-800">ZIP Code</span>}
                            htmlFor="zip"
                            required
                            error={errors.zip}
                            className="mb-4"
                        >
                            <Input
                                id="zip"
                                value={state.zip}
                                onChange={e => onChange('zip', e.target.value)}
                                error={!!errors.zip}
                                placeholder="12345"
                            />
                        </FormField>
                    </div>
                </div>
            </Card>
            <Card className="mb-8 shadow-lg border-0 bg-white">
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
                    <FormField
                        label={<span className="font-medium text-gray-800">Legal Acceptance</span>}
                        htmlFor="legalNotices"
                        required
                        error={errors.legalNotices}
                        className="mb-4"
                    >
                        <Checkbox
                            id="legalNotices"
                            label={<span className="font-medium">I have read, understand, and agree to the terms and conditions above</span>}
                            checked={state.legalNotices}
                            onChange={checked => onChange('legalNotices', checked)}
                            error={!!errors.legalNotices}
                        />
                    </FormField>
                    <FormField
                        label={<span className="font-medium text-gray-800">Name of person completing this form</span>}
                        htmlFor="completingFormName"
                        required
                        error={errors.completingFormName}
                        tooltip="Please enter your full name to verify your acceptance"
                        className="mb-4"
                    >
                        <Input
                            id="completingFormName"
                            value={state.completingFormName}
                            onChange={e => onChange('completingFormName', e.target.value)}
                            error={!!errors.completingFormName}
                            placeholder="Full Name"
                        />
                    </FormField>
                </div>
            </Card>
            <div className="flex flex-col md:flex-row justify-end mt-8 gap-4 w-full">
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
        </>
    );
} 