"use client";
import { useRouter } from "next/navigation";
import { DollarSign, Shield, AlertTriangle, PlusCircle, Clock } from "lucide-react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
    const router = useRouter();
    const [policyStats, setPolicyStats] = useState({ current: 0, prev: 0, change: 0 });
    const [quoteStats, setQuoteStats] = useState({ current: 0, prev: 0, change: 0 });
    const [revenueStats, setRevenueStats] = useState({ current: 0, prev: 0, change: 0 });
    const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
    const [recentPayments, setRecentPayments] = useState<any[]>([]);
    useEffect(() => {
        async function fetchStats() {
            // Policies
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
            const prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
            const prevEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 31);
            // Policies
            const policiesRes = await fetch("/api/policy/list?page=1&pageSize=1000");
            const policiesData = await policiesRes.json();
            const policies = policiesData.policies || [];
            const currentPolicies = policies.filter(p => new Date(p.policyCreatedAt) >= start);
            const prevPolicies = policies.filter(p => new Date(p.policyCreatedAt) >= prevStart && new Date(p.policyCreatedAt) <= prevEnd);
            const policyChange = prevPolicies.length === 0 ? (currentPolicies.length === 0 ? 0 : 100) : (((currentPolicies.length - prevPolicies.length) / Math.abs(prevPolicies.length)) * 100).toFixed(1);
            setPolicyStats({ current: currentPolicies.length, prev: prevPolicies.length, change: policyChange });
            // Quotes
            const quotesRes = await fetch("/api/quote/step?allQuotes=1");
            const quotesData = await quotesRes.json();
            const quotes = quotesData.quotes || [];
            const sortedQuotes = quotes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setRecentQuotes(sortedQuotes.slice(0, 5));
            // Revenue
            const paymentsRes = await fetch("/api/payment");
            const paymentsData = await paymentsRes.json();
            const payments = paymentsData.payments || [];
            const sortedPayments = payments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setRecentPayments(sortedPayments.slice(0, 5));
        }
        fetchStats();
    }, []);
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
            title: "Active Quotes",
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
        <div className="p-6">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600">Overview of insurance policies and events</p>
                </div>
                <div className="mt-4 sm:mt-0 flex gap-3">
                    <Link href="/admin/create-quote/step1">
                        <Button
                            variant="primary"
                            icon={<PlusCircle size={18} />}
                        >
                            Generate Policy
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        icon={<Clock size={18} />}
                        onClick={() => router.push("/admin/create-quote/step1")}
                    >
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
                    subtitle="Latest payments received"
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
                        {recentPayments.length === 0 ? (
                            <div className="py-3 text-gray-500">No recent transactions</div>
                        ) : recentPayments.map((payment) => (
                            <div key={payment.id} className="py-3">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-gray-900">TRX-{payment.id}</p>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.status === 'Completed' ? 'bg-green-100 text-green-800' : payment.status === 'Failed' ? 'bg-red-100 text-red-800' : ''}`}>{payment.status}</span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-sm text-gray-500">Policy #{payment.policy?.quote?.quoteNumber || '-'}</p>
                                    <p className="text-sm font-medium text-gray-900">${payment.amount}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
