"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation"; // Corrected import
import { Search, Filter, Download, Eye, PlusCircle, Edit, Mail } from "lucide-react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import jsPDF from 'jspdf'; // jsPDF is still used
import autoTable from 'jspdf-autotable';

interface PolicyList {
    email: string;
    policyId: number;
    policyNumber: number;
    id: number;
    quoteNumber: string;
    policyHolder?: {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
    };
    event?: {
        eventType?: string | null;
        eventDate?: string | null;
        maxGuests?: number | null;
        venue?: {
            name?: string | null;
            address1?: string | null;
            city?: string | null;
            state?: string | null;
            zip?: string | null;
        };
    };
    totalPremium?: number | null;
    status?: string | null;
    coverageLevel?: number | null;
    userId?: number | null;
    createdAt?: string | null;
    customer?: string;
    eventType?: string;
    eventDate?: string;
}

export default function Policies() {
    const [searchTerm, setSearchTerm] = useState("");
    const [policies, setPolicies] = useState<PolicyList[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();
    const [exportType, setExportType] = useState('all');
    const now = new Date();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    const [totalPolicies, setTotalPolicies] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const exportDropdownRef = useRef<HTMLDivElement>(null);
    const [emailSendingQuoteNumber, setEmailSendingQuoteNumber] = useState<string | null>(null);


    useEffect(() => {
        async function fetchPolicies() {
            setLoading(true);
            setError("");
            try {
                // Fetch all policies (no server-side pagination)
                const res = await fetch("/api/policy/list");
                if (!res.ok) throw new Error("Failed to fetch policies");
                const data = await res.json();
                console.log(data);
                // Map nested fields for table display
                const mapped = (data.policies || []).map((p: any) => ({
                    ...p,
                    customer: p.policyHolder ? `${p.policyHolder.firstName || ''} ${p.policyHolder.lastName || ''}`.trim() : '',
                    eventType: p.event?.eventType || '',
                    eventDate: p.event?.eventDate || '',
                    event: p.event?.eventType || '',
                }))
                    .filter((p: any) => p.policyId || p.convertedToPolicy)
                    .sort((a: PolicyList, b: PolicyList) =>
                        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                setPolicies(mapped);
                setTotalPolicies(mapped.length);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }
        fetchPolicies();
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
                setShowExportDropdown(false);
            }
        }
        if (showExportDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showExportDropdown]);

    const filteredForExport = useMemo(() => {
        if (exportType === 'all') return policies;
        if (exportType === 'monthly') {
            return policies.filter(q => {
                if (!q.event?.eventDate) return false;
                const d = new Date(q.event.eventDate);
                return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
            });
        }
        if (exportType === 'yearly') {
            return policies.filter(q => {
                if (!q.event?.eventDate) return false;
                const d = new Date(q.event.eventDate);
                return d.getFullYear() === now.getFullYear();
            });
        }
        if (exportType === 'weekly') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return policies.filter(q => {
                if (!q.event?.eventDate) return false;
                const d = new Date(q.event.eventDate);
                return d >= startOfWeek && d <= endOfWeek;
            });
        }
        return policies;
    }, [policies, exportType, now]);

    const filteredPolicies = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        let filtered = policies;
        if (statusFilter) {
            filtered = filtered.filter((policy) => policy.status === statusFilter);
        }
        if (!term) return filtered;
        return filtered.filter((policy) => {
            const fullName = policy.customer || `${policy.policyHolder?.firstName ?? ""} ${policy.policyHolder?.lastName ?? ""}`;
            const email = policy.policyHolder?.email?.toLowerCase() ?? "";
            const eventType = policy.eventType?.toLowerCase() ?? "";
            const quoteNumber = policy.quoteNumber.toLowerCase();
            return (
                (typeof fullName === 'string' && fullName.toLowerCase().includes(term)) ||
                (typeof email === 'string' && email.includes(term)) ||
                (typeof eventType === 'string' && eventType.includes(term)) ||
                (typeof quoteNumber === 'string' && quoteNumber.includes(term))
            );
        });
    }, [searchTerm, policies, statusFilter]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPolicies = filteredPolicies.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);


    const handleExportCSV = () => {
        const headers = ["Policy Number", "Event Type", "Policy Holder", "Event Date", "Premium", "Coverage", "Status"];
        const csvContent = [
            headers.join(","),
            ...filteredForExport.map(policy => [
                policy.policyNumber || policy.policyId || '',
                policy.eventType || '',
                policy.customer || (policy.policyHolder?.firstName && policy.policyHolder?.lastName ? `${policy.policyHolder.firstName} ${policy.policyHolder.lastName}` : "-"),
                policy.eventDate || '',
                policy.totalPremium,
                policy.coverageLevel,
                policy.status
            ].join(","))
        ].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `policies_export_${exportType}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportPDF = () => {
        if (filteredForExport.length === 0) {
            alert("No data available to export.");
            return;
        }

        const doc = new jsPDF();
        const tableHeaders = ["Policy #", "Event Type", "Customer", "Event Date", "Premium", "Coverage", "Status"];

        const allTableRows = filteredForExport.map(policy => [
            String(policy.policyNumber || policy.policyId || 'N/A'),
            String(policy.eventType || 'N/A'),
            String(policy.customer || (policy.policyHolder?.firstName && policy.policyHolder?.lastName ? `${policy.policyHolder.firstName} ${policy.policyHolder.lastName}` : "N/A")),
            String(policy.eventDate ? new Date(policy.eventDate).toLocaleDateString() : 'N/A'),
            String(policy.totalPremium !== null && policy.totalPremium !== undefined ? `$${policy.totalPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A"),
            String(policy.coverageLevel || 'N/A'),
            String(policy.status || 'N/A')
        ]);

        const rowsPerPage = 25;
        const numChunks = Math.ceil(allTableRows.length / rowsPerPage);
        let currentPageNumForFooter = 0;

        for (let i = 0; i < numChunks; i++) {
            currentPageNumForFooter++;
            const startRow = i * rowsPerPage;
            const endRow = startRow + rowsPerPage;
            const chunk = allTableRows.slice(startRow, endRow);

            if (i > 0) { // Add a new page for chunks after the first one
                doc.addPage();
            }

            autoTable(doc, {
                head: [tableHeaders], // Ensure headers are repeated on each page
                body: chunk,
                startY: 25, // Start table after the title
                didDrawPage: (data) => {
                    // Page Header
                    doc.setFontSize(18);
                    doc.setTextColor(40);
                    doc.text("Insurance Policies Report", doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

                    // Page Footer
                    doc.setFontSize(10);
                    doc.text(`Page ${currentPageNumForFooter} of ${numChunks}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
                },
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { top: 20 } // Margin for the table content itself
            });
        }

        doc.save(`policies_export_${exportType}.pdf`);
    };

    const handleDeletePolicy = async (policyId: number) => {
        if (!window.confirm('Are you sure you want to delete this policy?')) return;
        const res = await fetch(`/api/policy/list?policyId=${policyId}`, { method: 'DELETE' });
        if (res.ok) {
            // Refetch the full updated policy list from the backend
            const updated = await fetch("/api/quote/step");
            const data = await updated.json();
            const mapped = (data.policies || []).map((p: any) => ({
                ...p,
                customer: p.policyHolder ? `${p.policyHolder.firstName || ''} ${p.policyHolder.lastName || ''}`.trim() : '',
                eventType: p.event?.eventType || '',
                eventDate: p.event?.eventDate || '',
            })).filter((p: any) => p.policyId || p.convertedToPolicy);
            setPolicies(mapped);
            setTotalPolicies(mapped.length);
            alert('Policy deleted successfully!');
        } else {
            alert('Failed to delete policy.');
        }
    };

    const handleView = (quoteNumber: string) => {
        router.push(`/admin/policies/${quoteNumber}`);
    };
    const handleEdit = (quoteNumber: string) => {
        router.push(`/admin/policies/${quoteNumber}/edit`);
    };
    const handleEmail = async (quoteNumber: string) => {
        setEmailSendingQuoteNumber(quoteNumber); // Set loading state for this quote
        // Fetch the full policy data
        const res = await fetch(`/api/quote/step?quoteNumber=${quoteNumber}`);
        if (!res.ok) {
            alert('Failed to fetch policy for email.');
            return;
        }
        const data = await res.json();
        const policy = data.quote;
        const emailAddress = policy.email || '';
        if (!emailAddress) {
            alert('No email address found for this policy.');
            return;
        }
        try {
            const emailRes = await fetch("/api/quote/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: emailAddress,
                type: "policy",
                data: {
                  quoteNumber: policy.quoteNumber,
                  firstName: policy.firstName || "Customer",
                  totalPremium: policy.totalPremium,
                },
              }),
            });
            if (!emailRes.ok) {
                const errData = await emailRes.json();
                alert('Failed to send email: ' + (errData.error || 'Unknown error'));
                return;
            }
            // alert('Policy emailed successfully!');
        } catch (err) {
            alert('An error occurred while sending the email. Please try again.');
        }
        finally {
            setEmailSendingQuoteNumber(null); // Clear loading state
        }
    };

    // Skeleton Components
    const PolicyRowSkeleton = () => (
        <tr className="animate-pulse">
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-40"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex justify-end gap-2">
                    <div className="h-8 w-20 bg-gray-200 rounded-md"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded-md"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded-md"></div>
                </div>
            </td>
        </tr>
    );

    if (loading) {
        return (
            <div className="p-6 animate-pulse">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 px-2 sm:px-0">
                    <div>
                        <div className="h-7 bg-gray-200 rounded w-48 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-64"></div>
                    </div>
                    <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="h-10 bg-gray-200 rounded-md w-full sm:w-48"></div> {/* Generate New Policy */}
                        <div className="h-10 bg-gray-200 rounded-3xl w-full sm:w-36"></div> {/* Export Type Select */}
                        <div className="h-10 bg-gray-200 rounded-md w-full sm:w-32"></div> {/* Export CSV */}
                        <div className="h-10 bg-gray-200 rounded-md w-full sm:w-32"></div> {/* Export PDF */}
                    </div>
                </div>
                <Card>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div className="h-10 bg-gray-200 rounded-md flex-1 max-w-md"></div> {/* Search Input */}
                        <div className="h-10 bg-gray-200 rounded-md w-32"></div> {/* Filter Button */}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            {/* Skeleton Table Header can be omitted for simplicity or added if desired */}
                            <tbody>
                                {[...Array(5)].map((_, i) => <PolicyRowSkeleton key={i} />)}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        );
    }
    if (error) {
        return <div className="p-8 max-w-7xl mx-auto"><div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div></div>;
    }

    return (
        <div className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8 px-2 sm:px-0">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Insurance Policies</h1>
                    <p className="text-gray-600 text-sm sm:text-base">Manage and view all insurance policies</p>
                </div>
                <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button
                        variant="default"
                        onClick={() => router.push("/admin/create-quote/step1")}
                        className="w-full sm:w-auto"
                    >
                        <PlusCircle size={18} className="mr-2" />
                        Generate New Policy
                    </Button>
                    <select value={exportType} onChange={e => setExportType(e.target.value)} className="w-full sm:w-[150px] rounded-3xl border border-blue-500 py-1 px-4 text-center appearance-none focus:outline-none flex items-center justify-center [&>div]:rounded-2xl">
                        <option value="all">All</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="weekly">Weekly</option>
                    </select>
                    <div className="relative w-full sm:w-auto" ref={exportDropdownRef}>
                        <Button
                            variant="outline"
                            onClick={() => setShowExportDropdown(prev => !prev)}
                            className="w-full sm:w-auto"
                        >
                            <Download size={18} className="mr-2" />
                            Export
                        </Button>
                        {showExportDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                                <Button variant="ghost" onClick={() => { handleExportCSV(); setShowExportDropdown(false); }} className="w-full justify-start px-4 py-2 text-left text-gray-700 hover:bg-gray-100">
                                    <Download size={16} className="mr-2" />
                                    Export CSV
                                </Button>
                                <Button variant="ghost" onClick={() => { handleExportPDF(); setShowExportDropdown(false); }} className="w-full justify-start px-4 py-2 text-left text-gray-700 hover:bg-gray-100">
                                    <Download size={16} className="mr-2" />
                                    Export PDF
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Card>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex-1 max-w-md">
                        <Input
                            placeholder="Search policies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search size={18} />}
                        />
                    </div>
                    <Button variant="outline" onClick={() => setShowFilters(f => !f)}>
                        <Filter size={18} className="mr-2" />
                        {showFilters ? "Hide Filters" : "Show Filters"}
                    </Button>
                </div>
                {showFilters && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="w-full rounded border border-gray-300 py-2 px-3 text-sm"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="COMPLETE">Complete</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="EMAILED">Emailed</option>
                                    <option value="CONVERTED">Converted</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
                <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                    <table className="w-full">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentPolicies.map((policy) => (
                                <tr key={policy.quoteNumber} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-medium text-gray-900">{policy.policyNumber}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{policy.customer}</div>
                                        <div className="text-sm text-gray-500">{policy?.email || "-"}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{policy.eventType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{policy.createdAt ? new Date(policy.createdAt).toLocaleDateString() : "-"}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">${policy.totalPremium !== null && policy.totalPremium !== undefined ? policy.totalPremium : "-"}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${policy.status === 'COMPLETE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {policy.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleView(policy.quoteNumber)}
                                            >
                                                <Eye size={16} className="mr-1" /> View
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(policy.quoteNumber)}
                                            >
                                                <Edit size={16} className="mr-1" /> Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                // onClick={() => handleEmail(policy.quoteNumber)}
                                                onClick={() => handleEmail(policy.quoteNumber)} // Pass quoteNumber
                                                disabled={emailSendingQuoteNumber === policy.quoteNumber}
                                            >
                                                {emailSendingQuoteNumber === policy.quoteNumber ? (
                                                    <>
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <><Mail className="h-4 w-4 mr-2" /> Email</>
                                                )}
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDeletePolicy(policy.policyId)}>
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 flex flex-col items-center sm:flex-row sm:justify-between gap-4 border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-700 text-center sm:text-left">
                        Showing <span className="font-medium">{Math.min(endIndex, filteredPolicies.length)}</span> of <span className="font-medium">{filteredPolicies.length}</span> policies
                    </p>
                    <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                            Previous
                        </Button>
                        <span className="flex items-center px-3 py-1 text-sm text-gray-700">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(currentPage + 1)}>
                            Next
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}