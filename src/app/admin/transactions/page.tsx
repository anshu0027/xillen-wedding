"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  DollarSign,
  TrendingUp,
  Calendar,
  ChevronDown,
} from "lucide-react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";

const Transactions = () => {
  const router = useRouter();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [timeFrame, setTimeFrame] = useState("30days");
  const [currentPage, setCurrentPage] = useState(1);
  //   const [showFilters, setShowFilters] = useState(false);

  // Updated type for transactions to correctly reflect nested PolicyHolder
  const [transactions, setTransactions] = useState<
    Array<{
      id?: string; // Transaction ID (empty for now)
      transactionId: string; // Derived from quoteNumber
      quoteNumber: string;
      policyHolder?: {
        firstName: string | null;
        lastName: string | null;
      } | null;
      createdAt: string;
      totalPremium: number | null;
      status: string;
      source?: string | null;
      paymentMethod?: string | null;
    }>
  >([]);

  const ENTRIES_PER_PAGE = 20;

  useEffect(() => {
    async function fetchTransactions() {
      function generateTransactionId(quoteNum: string): string {
        if (quoteNum && quoteNum.startsWith("Q")) {
          return "T" + quoteNum.substring(1);
        }
        return quoteNum || "N/A"; // Fallback if not starting with Q or null
      }

      const res = await fetch("/api/quote/step?allQuotes=true", {
        method: "GET",
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(
          (data.quotes || []).map((q: any) => ({
            transactionId: generateTransactionId(q.quoteNumber),
            quoteNumber: q.quoteNumber,
            policyHolder: q.policyHolder,
            createdAt: q.createdAt,
            totalPremium: q.totalPremium,
            status: q.status,
            source: q.source || null,
            paymentMethod:
              q.source === "ADMIN"
                ? "CASH"
                : q.policy && q.policy.payments && q.policy.payments.length > 0
                  ? q.policy.payments[0].method || "-"
                  : "-",
          }))
        );
      }
    }
    fetchTransactions();
  }, []);

  // Filter transactions based on date range
  const filteredTransactions = transactions.filter((transaction) => {
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

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / ENTRIES_PER_PAGE);
  const startIndex = (currentPage - 1) * ENTRIES_PER_PAGE;
  const endIndex = startIndex + ENTRIES_PER_PAGE;
  const currentTransactionsOnPage = filteredTransactions.slice(
    startIndex,
    endIndex
  );

  // Calculate summary metrics
  const totalSales = filteredTransactions.reduce(
    (sum, transaction) => sum + (transaction.totalPremium || 0),
    0
  );
  const successfulTransactions = filteredTransactions.filter(
    (t) => t.status === "COMPLETE"
  ).length;
  // const failedTransactions = filteredTransactions.filter(
  //   (t) => t.status === "FAILED"
  // ).length;
  // const conversionRate = (
  //   (successfulTransactions /
  //     (successfulTransactions + failedTransactions || 1)) *
  //   100
  // ).toFixed(1);

  // Calculate previous period for dynamic percentage change
  function getPreviousPeriodDates() {
    let prevStart, prevEnd;
    if (startDate && endDate) {
      const diff = endDate.getTime() - startDate.getTime();
      prevEnd = new Date(startDate.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - diff);
    } else if (timeFrame === "7days") {
      prevEnd = new Date();
      prevEnd.setDate(prevEnd.getDate() - 7);
      prevStart = new Date();
      prevStart.setDate(prevStart.getDate() - 14);
    } else if (timeFrame === "30days") {
      prevEnd = new Date();
      prevEnd.setDate(prevEnd.getDate() - 30);
      prevStart = new Date();
      prevStart.setDate(prevStart.getDate() - 60);
    } else if (timeFrame === "90days") {
      prevEnd = new Date();
      prevEnd.setDate(prevEnd.getDate() - 90);
      prevStart = new Date();
      prevStart.setDate(prevStart.getDate() - 180);
    } else if (timeFrame === "ytd") {
      prevEnd = new Date(new Date().getFullYear(), 0, 1);
      prevStart = new Date(new Date().getFullYear() - 1, 0, 1);
    } else {
      prevEnd = null;
      prevStart = null;
    }
    return { prevStart, prevEnd };
  }
  const { prevStart, prevEnd } = getPreviousPeriodDates();
  const prevTransactions = transactions.filter((transaction) => {
    if (!prevStart || !prevEnd) return false;
    const transactionDate = new Date(transaction.createdAt);
    return transactionDate >= prevStart && transactionDate <= prevEnd;
  });
  const prevTotalSales = prevTransactions
    .filter((t) => t.status === "Completed")
    .reduce((sum, t) => sum + t.amount, 0);
  const prevSuccessful = prevTransactions.filter(
    (t) => t.status === "Completed"
  ).length;
  // const prevFailed = prevTransactions.filter(
  //   (t) => t.status === "Failed"
  // ).length;
  // const prevConversion = (
  //   (prevSuccessful / (prevSuccessful + prevFailed || 1)) *
  //   100
  // ).toFixed(1);


  // Calculate percentage changes
  function percentChange(current, prev) {
    if (prev === 0) return current === 0 ? 0 : 100;
    return (((current - prev) / Math.abs(prev)) * 100).toFixed(1);
  }
  const totalSalesChange = percentChange(totalSales, prevTotalSales);
  const successfulChange = percentChange(
    successfulTransactions,
    prevSuccessful
  );
  // const conversionChange = percentChange(
  //   Number(conversionRate),
  //   Number(prevConversion)
  // );

  const handleExportCSV = () => {
    const headers = [
      "Transaction ID",
      "Quote Number", // Changed from Policy Number
      "Policyholder Name",
      "Date",
      "Amount",
      "Payment Method",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map((transaction) =>
        [
          transaction.transactionId,
          transaction.quoteNumber || "-", // Consistently use quoteNumber
          `${transaction.policyHolder?.firstName || ""} ${transaction.policyHolder?.lastName || ""
            }`.trim() || "-",
          transaction.createdAt
            ? new Date(transaction.createdAt).toLocaleDateString()
            : "-",
          transaction.totalPremium ?? "-", // Amount
          transaction.source === "ADMIN" ? "CASH" : transaction.paymentMethod || "-", // Payment Method
          transaction.status,
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions_export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBack = () => {
    router.push("/admin");
  };

  // Sample chart data for visual representation
  // const chartData = {
  //   labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  //   values: [4200, 5300, 6200, 7800, 9500, 11000],
  // };

  // const renderBarChart = () => {
  //   const maxValue = Math.max(...chartData.values);
  //   return (
  //     <div className="mt-4">
  //       <div className="flex items-end h-40 gap-2">
  //         {chartData.values.map((value, index) => (
  //           <div key={index} className="flex flex-col items-center flex-1">
  //             <div
  //               className="w-full bg-blue-500 rounded-t-sm"
  //               style={{ height: `${(value / maxValue) * 100}%` }}
  //             ></div>
  //             <div className="text-xs mt-2 text-gray-600">
  //               {chartData.labels[index]}
  //             </div>
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //   );
  // };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 ml-4">
          Transaction Summary
        </h1>
      </div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="relative w-40">
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
              className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[
                { value: "7days", label: "Last 7 Days" },
                { value: "30days", label: "Last 30 Days" },
                { value: "90days", label: "Last 90 Days" },
                { value: "custom", label: "Custom Range" },
              ].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
          </div>

          {timeFrame === "custom" && (
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
          onClick={handleExportCSV}
        >
          <Download size={18} />
          Export Report
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card title="Total Revenue" icon={<DollarSign size={20} />}>
          <div className="mt-2">
            <div className="text-3xl font-bold text-gray-900">
              ${totalSales.toLocaleString()}
            </div>
            <div className="text-sm text-green-600 mt-1 flex items-center">
              <TrendingUp size={16} className="mr-1" />
              <span>
                {totalSalesChange > 0 ? "+" : ""}
                {totalSalesChange}% from previous period
              </span>
            </div>
          </div>
        </Card>
        <Card title="Completed Transactions" icon={<DollarSign size={20} />}>
          <div className="mt-2">
            <div className="text-3xl font-bold text-gray-900">
              {successfulTransactions}
            </div>
            <div className="text-sm text-green-600 mt-1 flex items-center">
              <TrendingUp size={16} className="mr-1" />
              <span>
                {successfulChange > 0 ? "+" : ""}
                {successfulChange}% from previous period
              </span>
            </div>
          </div>
        </Card>
        {/* <Card title="Conversion Rate" icon={<TrendingUp size={20} />}>
          <div className="mt-2">
            <div className="text-3xl font-bold text-gray-900">
              {conversionRate}%
            </div>
            <div className="text-sm text-green-600 mt-1 flex items-center">
              <TrendingUp size={16} className="mr-1" />
              <span>
                {conversionChange > 0 ? "+" : ""}
                {conversionChange}% from previous period
              </span>
            </div>
          </div>
        </Card> */}
      </div>

      <Card title="Recent Transactions" icon={<Calendar size={20} />}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quote Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTransactionsOnPage.map((transaction, idx) => (
                <tr
                  key={transaction.quoteNumber + idx}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.transactionId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.quoteNumber || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {`${transaction.policyHolder?.firstName || ""} ${transaction.policyHolder?.lastName || ""
                      }`.trim() || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.createdAt
                      ? new Date(transaction.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${transaction.totalPremium ?? "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.source === "ADMIN" ? "CASH" : transaction.paymentMethod || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.status === "COMPLETE"
                        ? "bg-green-100 text-green-800"
                        : transaction.status === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {transaction.status || "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No transactions found for the selected criteria.
          </div>
        )}
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
