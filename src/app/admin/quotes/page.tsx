"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Download, Clock, Mail, Eye, Edit, PlusCircle, Trash2, FileCheck } from "lucide-react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from "@/hooks/use-toast";

// Add QuoteList type for type safety
interface QuoteList {
    isCustomerGenerated: boolean | undefined;
    id: number;
    quoteNumber: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    eventType?: string | null;
    eventDate?: string | null;
    totalPremium?: number | null;
    status?: string | null;
    coverageLevel?: number | null;
    policyHolderName?: string | null;
    customer?: string;
    source?: string;
    convertedToPolicy?: boolean;
}

export default function Quotes() {
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [quotes, setQuotes] = useState<QuoteList[]>([]);
    const [exportType, setExportType] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const exportDropdownRef = useRef<HTMLDivElement>(null);
    const itemsPerPage = 15;

    const router = useRouter();

    useEffect(() => {
        // REMOVE admin auth check, allow access to all
    }, []);

    // Helper function to process raw quote data
    const processQuotesData = (rawData: any[]): QuoteList[] => {
        return (rawData || []).map((q: any) => ({
            ...q,
            customer: q.policyHolder ? `${q.policyHolder.firstName || ''} ${q.policyHolder.lastName || ''}`.trim() : '',
            eventType: q.event?.eventType || '',
            eventDate: q.event?.eventDate || '',
            isCustomerGenerated: q.source === 'CUSTOMER', // Determine if customer generated
        })); // Removed filter to show all quotes
    };

    useEffect(() => {
        async function fetchQuotes() {
            setLoading(true);
            const res = await fetch("/api/quote/step?allQuotes=1", { method: "GET" });
            if (res.ok) {
                const data = await res.json();
                setQuotes(processQuotesData(data.quotes));
                console.log(data);
            }
            setLoading(false);
        }
        fetchQuotes();
    }, []); // processQuotesData can be memoized with useCallback if defined outside or becomes a dependency

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

    // Filter quotes based on search and filter criteria
    const filteredQuotes = quotes.filter(quote => {
        const quoteId = quote.quoteNumber || quote.id || '';
        const customerName = quote.customer || quote.policyHolderName || `${quote.firstName || ''} ${quote.lastName || ''}`;
        const email = quote.email || '';
        const matchesSearch =
            (typeof quoteId === 'string' && quoteId.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (typeof customerName === 'string' && customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (typeof email === 'string' && email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter ? quote.status === statusFilter : true;
        const matchesDateRange = (() => {
            if (!startDate && !endDate) return true;
            if (!quote.eventDate) return false;
            const eventDate = new Date(quote.eventDate);
            if (startDate && endDate) {
                return eventDate >= startDate && eventDate <= endDate;
            }
            if (startDate) {
                return eventDate >= startDate;
            }
            if (endDate) {
                return eventDate <= endDate;
            }
            return true;
        })();
        return matchesSearch && matchesStatus && matchesDateRange;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentQuotes = filteredQuotes.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, startDate, endDate]);

    const now = useMemo(() => new Date(), []);
    const filteredForExport = useMemo(() => {
        if (exportType === 'all') return filteredQuotes;
        if (exportType === 'monthly') {
            return filteredQuotes.filter(q => {
                if (!q.eventDate) return false;
                const d = new Date(q.eventDate);
                return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
            });
        }
        if (exportType === 'yearly') {
            return filteredQuotes.filter(q => {
                if (!q.eventDate) return false;
                const d = new Date(q.eventDate);
                return d.getFullYear() === now.getFullYear();
            });
        }
        if (exportType === 'weekly') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return filteredQuotes.filter(q => {
                if (!q.eventDate) return false;
                const d = new Date(q.eventDate);
                return d >= startOfWeek && d <= endOfWeek;
            });
        }
        return filteredQuotes;
    }, [filteredQuotes, exportType, now]);

    // Handle quote actions
    const handleViewQuote = (quoteNumber: string) => {
        router.push(`/admin/quotes/${quoteNumber}`);
    };
    const handleEditQuote = (quoteNumber: string) => {
        router.push(`/admin/quotes/${quoteNumber}/edit`);
    };
    const handleEmailQuote = async (quoteNumber: string) => {
        try {
            setIsSendingEmail(true);
            // Fetch the full quote data
            const res = await fetch(`/api/quote/step?quoteNumber=${quoteNumber}`);
            if (!res.ok) {
                throw new Error('Failed to fetch quote data');
            }
            const data = await res.json();
            const quote = data.quote;
            const recipientEmail = quote.email;
            if (!recipientEmail) {
                throw new Error('No email found for this quote');
            }
            const emailRes = await fetch('/api/quote/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: recipientEmail,
                    type: 'quote',
                    data: {
                        quoteNumber: quote.quoteNumber,
                        firstName: quote.firstName || 'Customer',
                        totalPremium: quote.totalPremium
                    }
                })
            });
            if (!emailRes.ok) {
                const errData = await emailRes.json();
                throw new Error(errData.error || 'Failed to send email');
            }
            toast({
                title: "Success",
                description: "Quote emailed successfully!",
                variant: "default"
            });
        } catch (error) {
            console.error('Email error:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : 'Failed to send email',
                variant: "destructive"
            });
        } finally {
            setIsSendingEmail(false);
        }
    };
    const handleCreateNewQuote = () => {
        router.push("/admin/create-quote/step1");
    };

    const handleConvertToPolicy = async (quoteNumber: string) => {
        if (!window.confirm('Are you sure you want to convert this quote to a policy?')) return;
        const res = await fetch('/api/quote/convert-to-policy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quoteNumber,
                forceConvert: true // Force conversion since this is a manual action from admin
            })
        });
        if (res.ok) {
            const data = await res.json();
            const updated = await fetch("/api/quote/step?allQuotes=1");
            const updatedData = await updated.json();
            setQuotes(processQuotesData(updatedData.quotes));
            toast({
                title: "Success",
                description: `Quote converted to policy successfully! Policy Number: ${data.policyNumber}`,
                variant: "default"
            });
        } else {
            const error = await res.json();
            toast({
                title: "Error",
                description: `Failed to convert quote: ${error.error}`,
                variant: "destructive"
            });
        }
    };
    const handleExportCSV = () => {
        const headers = ["Quote ID", "Customer", "Email", "Event Type", "Event Date", "Premium", "Status", "Coverage"];
        const csvContent = [
            headers.join(","),
            ...filteredForExport.map(quote => [
                quote.quoteNumber || quote.id || '',
                `"${quote.customer || quote.policyHolderName || `${quote.firstName || ''} ${quote.lastName || ''}`}"`,
                quote.email || '',
                quote.eventType || '',
                quote.eventDate || '',
                quote.totalPremium,
                quote.status,
                quote.coverageLevel
            ].join(","))
        ].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `quotes_export_${exportType}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    const handleDeleteQuote = async (quoteNumber: string) => {
        if (!window.confirm('Are you sure you want to delete this quote?')) return;
        const res = await fetch(`/api/quote/step?quoteNumber=${quoteNumber}`, { method: 'DELETE' });
        if (res.ok) {
            const updated = await fetch("/api/quote/step?allQuotes=1");
            const updatedData = await updated.json();
            setQuotes(processQuotesData(updatedData.quotes));
            toast({ title: "Quote deleted successfully!", variant: "default" });
        } else {
            toast({ title: "Failed to delete quote.", variant: "destructive" });
        }
    };
    const handleExportPDF = () => {
        if (filteredForExport.length === 0) {
            toast({
                title: "No Data",
                description: "No quotes available to export.",
                variant: "destructive"
            });
            return;
        }

        const doc = new jsPDF();
        const tableHeaders = ["Quote ID", "Customer", "Event Type", "Event Date", "Premium", "Status", "Coverage"];

        const allTableRows = filteredForExport.map(quote => [
            String(quote.quoteNumber || quote.id || 'N/A'),
            String(quote.customer || quote.policyHolderName || `${quote.firstName || ''} ${quote.lastName || ''}` || 'N/A'),
            String(quote.eventType || 'N/A'),
            String(quote.eventDate ? new Date(quote.eventDate).toLocaleDateString() : 'N/A'),
            String(quote.totalPremium !== null && quote.totalPremium !== undefined ? `$${quote.totalPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A"),
            String(quote.status || 'N/A'),
            String(quote.coverageLevel || 'N/A')
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
                    doc.text("Insurance Quotes Report", doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
                    
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

        doc.save(`quotes_export_${exportType}.pdf`);
    };

    // Skeleton Components
    const QuoteRowSkeleton = () => (
        <tr className="animate-pulse">
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex justify-end gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
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
                        <div className="h-10 bg-gray-200 rounded-md w-full sm:w-40"></div>
                        <div className="h-10 bg-gray-200 rounded-3xl w-full sm:w-36"></div>
                        <div className="h-10 bg-gray-200 rounded-md w-full sm:w-32"></div>
                        <div className="h-10 bg-gray-200 rounded-md w-full sm:w-32"></div>
                    </div>
                </div>
                <Card>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div className="h-10 bg-gray-200 rounded-md flex-1 max-w-md"></div>
                        <div className="h-10 bg-gray-200 rounded-md w-32"></div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            {/* Skeleton Table Header can be added if desired, or omit for simplicity */}
                            <tbody>
                                {[...Array(5)].map((_, i) => <QuoteRowSkeleton key={i} />)}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8 px-2 sm:px-0">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Insurance Quotes</h1>
                    <p className="text-gray-600 text-sm sm:text-base">Manage and track all insurance quotes</p>
                </div>
                <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button
                        variant="default"
                        onClick={handleCreateNewQuote}
                        className="w-full sm:w-auto"
                    >
                        <PlusCircle size={18} className="mr-2" />
                        Create New Quote
                    </Button>
                    <select value={exportType} onChange={e => setExportType(e.target.value)} className="w-full sm:w-[150px] rounded-3xl border border-blue-500 py-1 px-4 text-center appearance-none focus:outline-none flex items-center justify-center [&>div]:rounded-2xl font-bold text-blue-700">
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
                            placeholder="Search quotes by ID, name, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search size={18} />}
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? "Hide Filters" : "Show Filters"}
                    </Button>
                </div>
                {showFilters && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date Range</label>
                                <div className="flex items-center gap-2">
                                    <DatePicker
                                        selected={startDate}
                                        onChange={setStartDate}
                                        placeholderText="Start date"
                                        className="w-full"
                                    />
                                    <span className="text-gray-500">to</span>
                                    <DatePicker
                                        selected={endDate}
                                        onChange={setEndDate}
                                        placeholderText="End date"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <Select
                                    options={[
                                        { value: '', label: 'All Statuses' },
                                        { value: 'Pending', label: 'Pending' },
                                        { value: 'Emailed', label: 'Emailed' },
                                        { value: 'COMPLETE', label: 'Complete' },
                                        { value: 'Converted', label: 'Converted to Policy' }
                                    ]}
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    placeholder="Select status"
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setStartDate(null);
                                        setEndDate(null);
                                        setStatusFilter('');
                                    }}
                                    className="ml-auto"
                                >
                                    Reset Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                    <table className="w-full">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentQuotes.map((quote) => (
                                <tr key={quote.quoteNumber} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Clock size={16} className="text-blue-600 mr-2" />
                                            <span className="font-medium text-gray-900">{quote.quoteNumber}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{quote.customer}</div>
                                            <div className="text-sm text-gray-500">{quote.email || ''}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{quote.eventType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{quote.eventDate ? new Date(quote.eventDate).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">${quote.totalPremium}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${quote.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            quote.status === 'Emailed' ? 'bg-blue-100 text-blue-800' :
                                                quote.status === 'COMPLETE' ? 'bg-purple-100 text-purple-800' :
                                                    quote.status === 'Converted' ? 'bg-green-100 text-green-800' : ''
                                            }`}>
                                            {quote.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewQuote(quote.quoteNumber)}
                                            >
                                                <Eye size={16} />
                                            </Button>
                                            {quote.status !== 'Converted' && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditQuote(quote.quoteNumber)}
                                                    >
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEmailQuote(quote.quoteNumber)}
                                                    >
                                                        <Mail size={16} />
                                                    </Button>
                                                    {quote.status === 'COMPLETE' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-green-600 border-green-200 hover:bg-green-50"
                                                            onClick={() => handleConvertToPolicy(quote.quoteNumber)}
                                                            disabled={quote.isCustomerGenerated}
                                                        >
                                                            <FileCheck size={18} className="mr-2" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={() => handleDeleteQuote(quote.quoteNumber)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 flex flex-col items-center sm:flex-row sm:justify-between gap-4 border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-700 text-center sm:text-left">
                        Showing <span className="font-medium">{Math.min(endIndex, filteredQuotes.length)}</span> of <span className="font-medium">{filteredQuotes.length}</span> quotes
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