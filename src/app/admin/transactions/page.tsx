"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, DollarSign, TrendingUp, Calendar, Filter } from "lucide-react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import Select from "@/components/ui/Select";

const Transactions = () => {
    const router = useRouter();
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [timeFrame, setTimeFrame] = useState('30days');
    const [showFilters, setShowFilters] = useState(false);
    const [transactions, setTransactions] = useState<Array<{ id: string; createdAt: string; amount: number; status: string; method: string; policy: { quote: { quoteNumber: string; firstName: string; lastName: string; } } }>>([]);

    useEffect(() => {
        async function fetchTransactions() {
            const res = await fetch("/api/payment", { method: "GET" });
            if (res.ok) {
                const data = await res.json();
                console.log("Fetched transactions:", data.payments);
                setTransactions(data.payments || []);
            }
        }
        fetchTransactions();
    }, []);

    // Filter transactions based on date range
    const filteredTransactions = transactions.filter(transaction => {
        if (!startDate && !endDate) return true;
        const transactionDate = new Date(transaction.createdAt);
        if (startDate && endDate) {
            return transactionDate >= startDate && transactionDate <= endDate;
        }
        if (startDate) {
            return transactionDate >= startDate;
        }
        if (endDate) {
            return transactionDate <= endDate;
        }
        return true;
    });

    // Calculate summary metrics
    const totalSales = filteredTransactions
        .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
    const successfulTransactions = filteredTransactions.filter(t => t.status === 'Completed').length;
    const failedTransactions = filteredTransactions.filter(t => t.status === 'Failed').length;
    const conversionRate = ((successfulTransactions / (successfulTransactions + failedTransactions || 1)) * 100).toFixed(1);

    // Calculate previous period for dynamic percentage change
    function getPreviousPeriodDates() {
        let prevStart, prevEnd;
        if (startDate && endDate) {
            const diff = endDate.getTime() - startDate.getTime();
            prevEnd = new Date(startDate.getTime() - 1);
            prevStart = new Date(prevEnd.getTime() - diff);
        } else if (timeFrame === '7days') {
            prevEnd = new Date();
            prevEnd.setDate(prevEnd.getDate() - 7);
            prevStart = new Date();
            prevStart.setDate(prevStart.getDate() - 14);
        } else if (timeFrame === '30days') {
            prevEnd = new Date();
            prevEnd.setDate(prevEnd.getDate() - 30);
            prevStart = new Date();
            prevStart.setDate(prevStart.getDate() - 60);
        } else if (timeFrame === '90days') {
            prevEnd = new Date();
            prevEnd.setDate(prevEnd.getDate() - 90);
            prevStart = new Date();
            prevStart.setDate(prevStart.getDate() - 180);
        } else if (timeFrame === 'ytd') {
            prevEnd = new Date(new Date().getFullYear(), 0, 1);
            prevStart = new Date(new Date().getFullYear() - 1, 0, 1);
        } else {
            prevEnd = null;
            prevStart = null;
        }
        return { prevStart, prevEnd };
    }
    const { prevStart, prevEnd } = getPreviousPeriodDates();
    const prevTransactions = transactions.filter(transaction => {
        if (!prevStart || !prevEnd) return false;
        const transactionDate = new Date(transaction.createdAt);
        return transactionDate >= prevStart && transactionDate <= prevEnd;
    });
    const prevTotalSales = prevTransactions.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0);
    const prevSuccessful = prevTransactions.filter(t => t.status === 'Completed').length;
    const prevFailed = prevTransactions.filter(t => t.status === 'Failed').length;
    const prevConversion = ((prevSuccessful / (prevSuccessful + prevFailed || 1)) * 100).toFixed(1);
    // Calculate percentage changes
    function percentChange(current, prev) {
        if (prev === 0) return current === 0 ? 0 : 100;
        return (((current - prev) / Math.abs(prev)) * 100).toFixed(1);
    }
    const totalSalesChange = percentChange(totalSales, prevTotalSales);
    const successfulChange = percentChange(successfulTransactions, prevSuccessful);
    const conversionChange = percentChange(Number(conversionRate), Number(prevConversion));

    const handleExportCSV = () => {
        const headers = ['Transaction ID', 'Policy Number', 'Customer', 'Date', 'Amount', 'Payment Method', 'Status'];
        const csvContent = [
            headers.join(','),
            ...filteredTransactions.map(transaction => [
                transaction.id,
                transaction.policy.quote.quoteNumber,
                `${transaction.policy.quote.firstName} ${transaction.policy.quote.lastName}`,
                transaction.createdAt,
                transaction.amount,
                transaction.method,
                transaction.status
            ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions_export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleBack = () => {
        router.push('/admin');
    };

    // Sample chart data for visual representation
    const chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [4200, 5300, 6200, 7800, 9500, 11000]
    };

    const renderBarChart = () => {
        const maxValue = Math.max(...chartData.values);
        return (
            <div className="mt-4">
                <div className="flex items-end h-40 gap-2">
                    {chartData.values.map((value, index) => (
                        <div key={index} className="flex flex-col items-center flex-1">
                            <div
                                className="w-full bg-blue-500 rounded-t-sm"
                                style={{ height: `${(value / maxValue) * 100}%` }}
                            ></div>
                            <div className="text-xs mt-2 text-gray-600">{chartData.labels[index]}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="flex items-center mb-6">
                <Button
                    variant="outline"
                    size="sm"
                    icon={<ArrowLeft size={16} />}
                    onClick={handleBack}
                >
                    Back to Dashboard
                </Button>
                <h1 className="text-2xl font-bold text-gray-900 ml-4">Transaction Summary</h1>
            </div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Select
                        className="w-40"
                        options={[
                            { value: '7days', label: 'Last 7 Days' },
                            { value: '30days', label: 'Last 30 Days' },
                            { value: '90days', label: 'Last 90 Days' },
                            { value: 'ytd', label: 'Year to Date' },
                            { value: 'custom', label: 'Custom Range' }
                        ]}
                        value={timeFrame}
                        onChange={setTimeFrame}
                    />
                    {timeFrame === 'custom' && (
                        <div className="mt-2 flex items-center gap-2">
                            <DatePicker
                                selected={startDate}
                                onChange={setStartDate}
                                placeholderText="Start date"
                                className="w-32"
                            />
                            <span className="text-gray-500">to</span>
                            <DatePicker
                                selected={endDate}
                                onChange={setEndDate}
                                placeholderText="End date"
                                className="w-32"
                            />
                        </div>
                    )}
                </div>
                <Button
                    variant="outline"
                    icon={<Download size={18} />}
                    onClick={handleExportCSV}
                >
                    Export Report
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card title="Total Revenue" icon={<DollarSign size={20} />}>
                    <div className="mt-2">
                        <div className="text-3xl font-bold text-gray-900">${totalSales.toLocaleString()}</div>
                        <div className="text-sm text-green-600 mt-1 flex items-center">
                            <TrendingUp size={16} className="mr-1" />
                            <span>{totalSalesChange > 0 ? '+' : ''}{totalSalesChange}% from previous period</span>
                        </div>
                    </div>
                </Card>
                <Card title="Completed Transactions" icon={<DollarSign size={20} />}>
                    <div className="mt-2">
                        <div className="text-3xl font-bold text-gray-900">{successfulTransactions}</div>
                        <div className="text-sm text-green-600 mt-1 flex items-center">
                            <TrendingUp size={16} className="mr-1" />
                            <span>{successfulChange > 0 ? '+' : ''}{successfulChange}% from previous period</span>
                        </div>
                    </div>
                </Card>
                <Card title="Conversion Rate" icon={<TrendingUp size={20} />}>
                    <div className="mt-2">
                        <div className="text-3xl font-bold text-gray-900">{conversionRate}%</div>
                        <div className="text-sm text-green-600 mt-1 flex items-center">
                            <TrendingUp size={16} className="mr-1" />
                            <span>{conversionChange > 0 ? '+' : ''}{conversionChange}% from previous period</span>
                        </div>
                    </div>
                </Card>
            </div>
            <Card title="Revenue Trend" icon={<TrendingUp size={20} />} className="mb-8">
                {renderBarChart()}
            </Card>
            <Card title="Recent Transactions" icon={<Calendar size={20} />}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTransactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">{transaction.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{transaction.policy?.quote?.quoteNumber || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{`${transaction.policy?.quote?.firstName || ''} ${transaction.policy?.quote?.lastName || ''}`.trim() || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">${transaction.amount ?? '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{transaction.method || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                            transaction.status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {transaction.status || '-'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default function TransactionsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Transactions />
        </Suspense>
    );
} 