"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Mail, Edit, DollarSign, Calendar, Users, Shield, Wine, Activity, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import React from "react";
import { toast } from "@/hooks/use-toast";

function flattenPolicy(policy) {
    return {
        id: policy.id,
        quoteNumber: policy.quoteNumber,
        // Step 1
        eventType: policy.event?.eventType || '',
        eventDate: policy.event?.eventDate || '',
        maxGuests: policy.event?.maxGuests || '',
        coverageLevel: policy.coverageLevel || null,
        liabilityCoverage: policy.liabilityCoverage || '',
        liquorLiability: policy.liquorLiability || false,
        covidDisclosure: policy.covidDisclosure || false,
        specialActivities: policy.specialActivities || false,
        totalPremium: policy.totalPremium,
        basePremium: policy.basePremium,
        liabilityPremium: policy.liabilityPremium,
        liquorLiabilityPremium: policy.liquorLiabilityPremium,
        createdAt: policy.createdAt,
        status: policy.status,
        // Step 2
        honoree1FirstName: policy.event?.honoree1FirstName || '',
        honoree1LastName: policy.event?.honoree1LastName || '',
        honoree2FirstName: policy.event?.honoree2FirstName || '',
        honoree2LastName: policy.event?.honoree2LastName || '',
        ceremonyLocationType: policy.event?.ceremonyLocationType || '',
        indoorOutdoor: policy.event?.indoorOutdoor || '',
        venueName: policy.event?.venue?.name || '',
        venueAddress1: policy.event?.venue?.address1 || '',
        venueAddress2: policy.event?.venue?.address2 || '',
        venueCountry: policy.event?.venue?.country || '',
        venueCity: policy.event?.venue?.city || '',
        venueState: policy.event?.venue?.state || '',
        venueZip: policy.event?.venue?.zip || '',
        venueAsInsured: policy.event?.venue?.venueAsInsured || false,
        // Step 3
        firstName: policy.policyHolder?.firstName || '',
        lastName: policy.policyHolder?.lastName || '',
        email: policy.policyHolder?.email || '',
        confirmEmail: policy.policyHolder?.confirmEmail || '',
        additionalEmail: policy.policyHolder?.additionalEmail || '',
        phone: policy.policyHolder?.phone || '',
        relationship: policy.policyHolder?.relationship || '',
        hearAboutUs: policy.policyHolder?.hearAboutUs || '',
        address: policy.policyHolder?.address || '',
        country: policy.policyHolder?.country || '',
        city: policy.policyHolder?.city || '',
        state: policy.policyHolder?.state || '',
        zip: policy.policyHolder?.zip || '',
        legalNotices: policy.policyHolder?.legalNotices || false,
        completingFormName: policy.policyHolder?.completingFormName || '',
    };
}

export default function PolicyDetail() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [isEmailSent, setIsEmailSent] = useState(false);

    const [policy, setPolicy] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchPolicy() {
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/quote/step?quoteNumber=${id}`);
                if (!res.ok) throw new Error("Failed to fetch policy");
                const data = await res.json();
                setPolicy(flattenPolicy(data.quote || {}));
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchPolicy();
    }, [id]);

    const handleBack = () => {
        router.push("/admin/policies");
    };

    const handleEdit = () => {
        router.push(`/admin/policies/${id}/edit`);
    };

    const handleEmailPolicy = async () => {
        const recipientEmail = policy?.email;
        if (!recipientEmail) {
            toast.error("No email found for this policy.");
            return;
        }
        setIsEmailSent(true);
        try {
            const res = await fetch("/api/quote/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: recipientEmail,
                    type: 'policy',
                    data: {
                        quoteNumber: policy.quoteNumber,
                        firstName: policy.firstName || 'Customer',
                        totalPremium: policy.totalPremium
                    }
                })
            });
            if (res.ok) {
                toast.success("Policy emailed successfully!");
            } else {
                const data = await res.json();
                toast.error("Failed to send email: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            toast.error("Failed to send email.");
        } finally {
            setIsEmailSent(false);
        }
    };

    if (loading) {
        return <div className="p-8 max-w-7xl mx-auto"><div className="animate-pulse h-8 bg-gray-200 rounded w-1/3 mb-6"></div></div>;
    }
    if (error) {
        return <div className="p-8 max-w-7xl mx-auto"><div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div></div>;
    }
    if (!policy) {
        return <div className="p-8 max-w-7xl mx-auto"><div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">No policy found with ID #{id}.</div></div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center">
                            <button
                                onClick={handleBack}
                                className="mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Policy #{policy.quoteNumber?.startsWith('POC-') ? policy.quoteNumber : `POC-${policy.quoteNumber}`}</h1>
                                <div className="flex items-center mt-1">
                                    <span className="text-sm text-gray-500">Issued {policy.createdAt ? new Date(policy.createdAt).toLocaleDateString() : "-"}</span>
                                    <span className="mx-2 text-gray-300">•</span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${policy.status === "Active" ? "bg-green-100 text-green-800" : policy.status === "Expired" ? "bg-gray-100 text-gray-800" : "bg-yellow-100 text-yellow-800"}`}>
                                        {policy.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                icon={<Mail size={18} />}
                                onClick={handleEmailPolicy}
                                disabled={isEmailSent}
                            >
                                {isEmailSent ? "Sending..." : "Email Policy"}
                            </Button>
                            <Button
                                variant="outline"
                                icon={<Edit size={18} />}
                                onClick={handleEdit}
                            >
                                Edit Policy
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Policy Summary */}
                <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Policy Summary</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center">
                                <Calendar className="text-blue-500 mr-3" size={20} />
                                <div>
                                    <p className="text-xs font-medium text-blue-500">Event Date</p>
                                    <p className="font-semibold">{policy.eventDate ? new Date(policy.eventDate).toLocaleDateString() : "-"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                            <div className="flex items-center">
                                <Users className="text-purple-500 mr-3" size={20} />
                                <div>
                                    <p className="text-xs font-medium text-purple-500">Guest Count</p>
                                    <p className="font-semibold">{policy.maxGuests || "-"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center">
                                <Shield className="text-green-500 mr-3" size={20} />
                                <div>
                                    <p className="text-xs font-medium text-green-500">Coverage Level</p>
                                    <p className="font-semibold">{policy.coverageLevel !== null && policy.coverageLevel !== undefined ? `Level ${policy.coverageLevel}` : "-"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-4">
                            <div className="flex items-center">
                                <DollarSign className="text-indigo-500 mr-3" size={20} />
                                <div>
                                    <p className="text-xs font-medium text-indigo-500">Total Premium</p>
                                    <p className="font-semibold">${policy.totalPremium !== null && policy.totalPremium !== undefined ? policy.totalPremium : "-"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Step 1: Policy Details */}
                    <div className="bg-white shadow-sm rounded-xl p-6 lg:col-span-2">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">1</span>
                            Policy Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Event Type</h3>
                                <p className="mt-1 font-medium">{policy.eventType || "-"}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Liability Coverage</h3>
                                <p className="mt-1 font-medium">{policy.liabilityCoverage || "-"}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Host Liquor Liability</h3>
                                <div className="mt-1 flex items-center">
                                    {policy.liquorLiability ?
                                        <><Wine size={16} className="text-green-500 mr-1" /> <span className="font-medium">Included</span></> :
                                        <span className="font-medium">Not Included</span>
                                    }
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Special Activities</h3>
                                <div className="mt-1 flex items-center">
                                    {policy.specialActivities ?
                                        <><Activity size={16} className="text-amber-500 mr-1" /> <span className="font-medium">Yes</span></> :
                                        <span className="font-medium">No</span>
                                    }
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Covid Disclosure</h3>
                                <div className="mt-1 flex items-center">
                                    {policy.covidDisclosure ?
                                        <><AlertTriangle size={16} className="text-amber-500 mr-1" /> <span className="font-medium">Yes</span></> :
                                        <span className="font-medium">No</span>
                                    }
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Base Premium</h3>
                                <p className="mt-1 font-medium">${policy.basePremium !== null && policy.basePremium !== undefined ? policy.basePremium : "-"}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Liability Premium</h3>
                                <p className="mt-1 font-medium">${policy.liabilityPremium !== null && policy.liabilityPremium !== undefined ? policy.liabilityPremium : "-"}</p>
                            </div>
                            {policy.liquorLiability && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Host Liquor Liability Premium</h3>
                                    <p className="mt-1 font-medium">${policy.liquorLiabilityPremium !== null && policy.liquorLiabilityPremium !== undefined ? policy.liquorLiabilityPremium : "-"}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white shadow-sm rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Contact Information</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Policy Holder</h3>
                                <p className="mt-1 font-medium">{policy.firstName || "-"} {policy.lastName || "-"}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                                <p className="mt-1 font-medium">{policy.email || "-"}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                                <p className="mt-1 font-medium">{policy.phone || "-"}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Relationship</h3>
                                <p className="mt-1 font-medium">{policy.relationship || "-"}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Address</h3>
                                <p className="mt-1 font-medium">{policy.address || "-"}</p>
                                <p className="font-medium">{policy.city || "-"}, {policy.state || "-"} {policy.zip || "-"}</p>
                                <p className="font-medium">{policy.country || "-"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 2: Event Information */}
                <div className="bg-white shadow-sm rounded-xl p-6 mt-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">2</span>
                        Event Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Honoree 1 Name</h3>
                            <p className="mt-1 font-medium">{policy.honoree1FirstName || "-"} {policy.honoree1LastName || "-"}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Honoree 2 Name</h3>
                            <p className="mt-1 font-medium">{policy.honoree2FirstName || "-"} {policy.honoree2LastName || "-"}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Ceremony Location Type</h3>
                            <p className="mt-1 font-medium">{policy.ceremonyLocationType || "-"}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Indoor/Outdoor</h3>
                            <p className="mt-1 font-medium">{policy.indoorOutdoor || "-"}</p>
                        </div>
                        <div className="md:col-span-2">
                            <h3 className="text-sm font-medium text-gray-500">Venue</h3>
                            <p className="mt-1 font-medium">{policy.venueName || "-"}</p>
                            <p className="font-medium">{policy.venueAddress1 || "-"} {policy.venueAddress2 ? `, ${policy.venueAddress2}` : ""}</p>
                            <p className="font-medium">{policy.venueCity || "-"}, {policy.venueState || "-"} {policy.venueZip || "-"}</p>
                            <p className="font-medium">{policy.venueCountry || "-"}</p>
                            <div className="mt-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${policy.venueAsInsured ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                    {policy.venueAsInsured ? "Venue As Additional Insured" : "Venue Not Additional Insured"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div className="bg-white shadow-sm rounded-xl p-6 mt-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Additional Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Additional Email</h3>
                            <p className="mt-1 font-medium">{policy.additionalEmail || "-"}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Hear About Us</h3>
                            <p className="mt-1 font-medium">{policy.hearAboutUs || "-"}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Legal Notices</h3>
                            <p className="mt-1 font-medium">{policy.legalNotices ? "Yes" : "No"}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Completing Form Name</h3>
                            <p className="mt-1 font-medium">{policy.completingFormName || "-"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}