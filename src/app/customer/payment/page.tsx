"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CreditCard, Banknote, QrCode } from "lucide-react";
import { Button } from "@/components/ui/Button";

const paymentOptions = [
  { label: "Net Banking", value: "netbanking", icon: <Banknote size={20} /> },
  { label: "UPI", value: "upi", icon: <QrCode size={20} /> },
  { label: "Credit Card", value: "card", icon: <CreditCard size={20} /> },
];

export default function Payment() {
  const router = useRouter();
  const [selected, setSelected] = useState("netbanking");
  const [processing, setProcessing] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // For initial page skeleton
  const [isRetrieved, setIsRetrieved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsRetrieved(localStorage.getItem("retrievedQuote") === "true");
    }
    // Simulate a brief loading period for the page skeleton
    const timer = setTimeout(() => setPageLoading(false), 200); // Adjust delay as needed
    return () => clearTimeout(timer);
  }, []); // Empty dependency array means this runs once on mount

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      if (isRetrieved) {
        localStorage.removeItem("retrievedQuote");
        router.replace(
          `/customer/review?payment=success&method=${selected}&retrieved=true`
        );
      } else {
        router.replace(`/customer/review?payment=success&method=${selected}`);
      }
    }, 1500);
  };

  const PaymentPageSkeleton = () => (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-2xl border border-blue-100 flex flex-col items-center animate-pulse">
      <div className="h-10 bg-gray-300 rounded w-3/4 mb-8"></div> {/* Title */}
      <div className="space-y-4 w-full mb-10">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
            <div className="h-6 w-6 bg-gray-300 rounded"></div> {/* Radio + Icon placeholder */}
            <div className="h-6 bg-gray-300 rounded w-1/2"></div> {/* Label placeholder */}
          </div>
        ))}
      </div>
      <div className="h-12 bg-blue-300 rounded-md w-full text-lg py-3 mt-2"></div> {/* Pay Now Button */}
      <div className="h-4 bg-gray-200 rounded w-1/2 mt-6"></div> {/* Footer text */}
    </div>
  );


  // Show skeleton if initial page is loading OR if payment is processing
  // (though processing has its own button state, this provides a consistent full-page skeleton feel)
  if (pageLoading || processing) {
    return <PaymentPageSkeleton />;
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-2xl border border-blue-100 flex flex-col items-center">
      <h2 className="text-3xl font-extrabold text-blue-900 mb-8 text-center drop-shadow">
        Dummy Payment Gateway
      </h2>
      <div className="space-y-4 w-full mb-10">
        {paymentOptions.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-150 ${
              selected === opt.value
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 bg-white"
            } focus-within:ring-2 focus-within:ring-blue-400`}
            tabIndex={0}
            aria-checked={selected === opt.value}
            role="radio"
          >
            <input
              type="radio"
              name="payment"
              value={opt.value}
              checked={selected === opt.value}
              onChange={() => setSelected(opt.value)}
              className="accent-blue-600 focus:ring-2 focus:ring-blue-400"
            />
            {opt.icon}
            <span className="font-semibold text-gray-800 text-lg">
              {opt.label}
            </span>
          </label>
        ))}
      </div>
      <Button
        variant="primary"
        size="lg"
        onClick={handlePay}
        disabled={processing}
        className="w-full text-lg py-3 mt-2"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              ></path>
            </svg>
            Processing...
          </span>
        ) : (
          "Pay Now"
        )}
      </Button>
      <p className="text-xs text-gray-500 mt-6 text-center">
        This is a demo payment page. No real transaction will occur.
      </p>
    </div>
  );
}
