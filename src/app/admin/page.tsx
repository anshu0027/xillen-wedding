"use client";
import { useRouter } from "next/navigation";
import { DollarSign, Shield, PlusCircle, Clock } from "lucide-react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
    const router = useRouter();
    const [policyStats, setPolicyStats] = useState({ current: 0, prev: 0, change: 0 });
    const [quoteStats, setQuoteStats] = useState({ current: 0, prev: 0, change: 0 });
    const [revenueStats, setRevenueStats] = useState({ current: 0, prev: 0, change: 0 });
    const [recentQuotes, setRecentQuotes] = useState<any[]>([]); // Will be used for "Recent Transactions" card
    // recentPayments state is no longer needed as "Recent Transactions" will use recentQuotes
    useEffect(() => {
        async function fetchStats() {
            const now = new Date();
            // Define date ranges for the last 30 days and the 30 days prior to that
            const currentPeriodStart = new Date(now);
            currentPeriodStart.setDate(now.getDate() - 30);

            const previousPeriodEnd = new Date(currentPeriodStart);
            previousPeriodEnd.setDate(currentPeriodStart.getDate() - 1);

            const previousPeriodStart = new Date(previousPeriodEnd);
            previousPeriodStart.setDate(previousPeriodEnd.getDate() - 30);

            // Policies
            const policiesRes = await fetch("/api/policy/list?page=1&pageSize=1000");
            const policiesData = await policiesRes.json();
            const policies = policiesData.policies || [];
            const currentPolicies = policies.filter(p => new Date(p.policyCreatedAt) >= currentPeriodStart && new Date(p.policyCreatedAt) <= now);
            const prevPolicies = policies.filter(p => new Date(p.policyCreatedAt) >= previousPeriodStart && new Date(p.policyCreatedAt) <= previousPeriodEnd);
            const policyChange = prevPolicies.length === 0 ? (currentPolicies.length === 0 ? 0 : 100) : parseFloat((((currentPolicies.length - prevPolicies.length) / prevPolicies.length) * 100).toFixed(1));
            setPolicyStats({ current: currentPolicies.length, prev: prevPolicies.length, change: policyChange });

            // Quotes
            const quotesRes = await fetch("/api/quote/step?allQuotes=1");
            const quotesData = await quotesRes.json();
            const quotes = quotesData.quotes || [];
            const currentQuotes = quotes.filter(q => new Date(q.createdAt) >= currentPeriodStart && new Date(q.createdAt) <= now);
            const prevQuotes = quotes.filter(q => new Date(q.createdAt) >= previousPeriodStart && new Date(q.createdAt) <= previousPeriodEnd);
            const quoteChange = prevQuotes.length === 0 ? (currentQuotes.length === 0 ? 0 : 100) : parseFloat((((currentQuotes.length - prevQuotes.length) / prevQuotes.length) * 100).toFixed(1));
            setQuoteStats({ current: currentQuotes.length, prev: prevQuotes.length, change: quoteChange });

            const sortedQuotes = quotes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setRecentQuotes(sortedQuotes.slice(0, 5));

            // Revenue calculation (already using quotes, no changes needed here)
            // Calculate revenue based on totalPremium from quotes (similar to transactions page's "Total Revenue")
            const currentRevenue = currentQuotes.reduce((sum, q) => sum + (q.totalPremium || 0), 0);
            const prevRevenue = prevQuotes.reduce((sum, q) => sum + (q.totalPremium || 0), 0);

            // Use Math.abs(prevRevenue) in denominator for robust percentage calculation, similar to transactions page
            const revenueChange = prevRevenue === 0 ? (currentRevenue === 0 ? 0 : 100) : parseFloat((((currentRevenue - prevRevenue) / (Math.abs(prevRevenue) || 1)) * 100).toFixed(1));
            setRevenueStats({ current: currentRevenue, prev: prevRevenue, change: revenueChange });
            // The fetch for /api/payment and setRecentPayments is removed as recentQuotes will be used.
        }
        fetchStats();
    }, []);

    function generateTransactionId(quoteNum: string | null | undefined): string {
        if (quoteNum && quoteNum.startsWith("Q")) {
            return "T" + quoteNum.substring(1);
        }
        return quoteNum || "N/A";
    }
    const stats = [
        {
            title: "Total Policies",
            value: policyStats.current,
            change: `${policyStats.change > 0 ? '+' : ''}${policyStats.change}%`,
            trend: policyStats.change >= 0 ? "up" : "down",
            icon: <Shield className="text-blue-600" size={24} />,
            onClick: () => router.push("/admin/policies"),
        },
        {
            title: "Total Quotes",
            value: quoteStats.current,
            change: `${quoteStats.change > 0 ? '+' : ''}${quoteStats.change}%`,
            trend: quoteStats.change >= 0 ? "up" : "down",
            icon: <Clock className="text-purple-600" size={24} />,
            onClick: () => router.push("/admin/quotes"),
        },
        {
            title: "Premium Revenue",
            value: `$${revenueStats.current.toLocaleString()}`,
            change: `${revenueStats.change > 0 ? '+' : ''}${revenueStats.change}%`,
            trend: revenueStats.change >= 0 ? "up" : "down",
            icon: <DollarSign className="text-emerald-600" size={24} />,
            onClick: () => router.push("/admin/transactions"),
        },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600">Overview of insurance policies and events</p>
                </div>
                <div className="mt-4 sm:mt-0 flex gap-3">
                    <Button
                        variant="primary"
                        onClick={() => router.push("/admin/create-quote/step1")}
                    >
                        <PlusCircle size={18} />
                        Generate Policy
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push("/admin/create-quote/step1")}
                    >
                        <PlusCircle size={18} />
                        Create Quote
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={stat.onClick}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-gray-50 rounded-lg">{stat.icon}</div>
                            <span className={`text-sm font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card
                    title="Recent Quotes"
                    subtitle="Latest quotes created"
                    icon={<Clock size={20} />}
                    footer={
                        <div className="text-right">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push("/admin/quotes")}
                            >
                                View All Quotes
                            </Button>
                        </div>
                    }
                >
                    <div className="divide-y divide-gray-100">
                        {recentQuotes.length === 0 ? (
                            <div className="py-3 text-gray-500">No recent quotes</div>
                        ) : recentQuotes.map((quote) => (
                            <div key={quote.id} className="py-3 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">{quote.quoteNumber}</p>
                                    <p className="text-sm text-gray-500">{quote.eventType || 'Wedding Event'} • Premium: ${quote.totalPremium || 0}</p>
                                </div>
                                <span className="text-sm text-gray-500">{new Date(quote.createdAt).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card
                    title="Recent Transactions"
                    subtitle="Latest quote activities"
                    icon={<DollarSign size={20} />}
                    footer={
                        <div className="text-right">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push("/admin/transactions")}
                            >
                                View All Transactions
                            </Button>
                        </div>
                    }
                >
                    <div className="divide-y divide-gray-100">
                        {recentQuotes.length === 0 ? (
                            <div className="py-2 text-gray-500">No recent transactions</div>
                        ) : recentQuotes.map((quote) => (
                            <div key={quote.id || quote.quoteNumber} className="py-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-gray-900 truncate" title={generateTransactionId(quote.quoteNumber)}>
                                        {generateTransactionId(quote.quoteNumber)}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 truncate" title={`${quote.policyHolder?.firstName || ""} ${quote.policyHolder?.lastName || ""}`.trim() || "Unknown Customer"}>
                                        {`${quote.policyHolder?.firstName || ""} ${quote.policyHolder?.lastName || ""}`.trim() || "Unknown Customer"} ({quote.quoteNumber})
                                    </span>
                                    <span className="font-medium text-gray-800">${(quote.totalPremium || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1 text-right">
                                    {new Date(quote.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
