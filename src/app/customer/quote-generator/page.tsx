"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronDown, DollarSign } from "lucide-react";
import { useQuote } from "@/context/QuoteContext";
import type { QuoteState } from "@/context/QuoteContext";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
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
  LIQUOR_LIABILITY_PREMIUMS_NEW,
} from "@/utils/constants";
import {
  isDateInFuture,
  isDateAtLeast48HoursAhead,
  isDateWithinTwoYears,
  formatCurrency,
} from "@/utils/validators";
import { toast } from "@/hooks/use-toast";

export default function QuoteGenerator() {
  const router = useRouter();
  const { state, dispatch } = useQuote();

  // Form state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showQuoteResults, setShowQuoteResults] = useState(false);
  const [showSpecialActivitiesModal, setShowSpecialActivitiesModal] =
    useState(false);
  const [pageLoading, setPageLoading] = useState(true);


  // Clear quoteNumber on mount to always start a new quote
  useEffect(() => {
    localStorage.removeItem("quoteNumber");
  }, []);

  useEffect(() => {
    // Simulate a brief loading period for the page skeleton
    const timer = setTimeout(() => setPageLoading(false), 200); // Adjust delay as needed
    return () => clearTimeout(timer);
  }, []);

  // Handle form field changes
  const handleInputChange = useCallback(
    (field: keyof QuoteState, value: QuoteState[keyof QuoteState]) => {
      dispatch({ type: "UPDATE_FIELD", field, value });

      // Clear error for this field when it's updated
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }

      // Reset quote results when key fields change
      if (
        [
          "coverageLevel",
          "liabilityCoverage",
          "liquorLiability",
          "maxGuests",
        ].includes(field)
      ) {
        setShowQuoteResults(false);
      }
    },
    [dispatch, errors]
  );

  // Format date for the date picker
  const selectedDate = state.eventDate ? new Date(state.eventDate) : null;

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    if (date) {
      handleInputChange("eventDate", date.toISOString().split("T")[0]);
    } else {
      handleInputChange("eventDate", "");
    }
  };

  // Calculate minimum date (48 hours from now)
  const minDate = new Date();
  minDate.setHours(minDate.getHours() + 48);

  // Calculate maximum date (2 years from now)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 2);

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!state.residentState) {
      newErrors.residentState = "Please select your state of residence";
    }

    if (!state.eventType) {
      newErrors.eventType = "Please select an event type";
    }

    if (!state.maxGuests) {
      newErrors.maxGuests = "Please select the maximum number of guests";
    }

    if (!state.eventDate) {
      newErrors.eventDate = "Please select the event date";
    } else {
      const eventDate = new Date(state.eventDate);
      if (!isDateInFuture(eventDate)) {
        newErrors.eventDate = "Event date must be in the future";
      } else if (!isDateAtLeast48HoursAhead(eventDate)) {
        newErrors.eventDate =
          "Event date must be at least 48 hours in the future";
      } else if (!isDateWithinTwoYears(eventDate)) {
        newErrors.eventDate = "Event date must be within the next 2 years";
      }
    }

    if (state.coverageLevel === null) {
      newErrors.coverageLevel = "Please select a coverage level";
    }

    if (!state.covidDisclosure) {
      newErrors.covidDisclosure = "You must acknowledge the COVID-19 exclusion";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle calculate quote
  const handleCalculateQuote = async () => {
    if (validateForm()) {
      // First, calculate premiums and update state
      dispatch({ type: "CALCULATE_QUOTE" });
      // Wait for state to update before sending to API
      setTimeout(async () => {
        // Call API to create quote
        try {
          const res = await fetch("/api/quote/step", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...state,
              step: "STEP1",
              source: "CUSTOMER",
            }),
          });
          const data = await res.json();
          if (res.ok && data.quoteNumber) {
            // Store quoteNumber in localStorage and context
            localStorage.setItem("quoteNumber", data.quoteNumber);
            dispatch({
              type: "UPDATE_FIELD",
              field: "quoteNumber",
              value: data.quoteNumber,
            });
            setShowQuoteResults(true);
            // Send email with quote
            try {
              const emailRes = await fetch("/api/quote/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  to: state.email,
                  type: "quote",
                  data: {
                    quoteNumber: data.quoteNumber,
                    firstName: state.firstName || "Customer",
                    totalPremium: state.totalPremium,
                  },
                }),
              });
              if (emailRes.ok) {
                toast.success("Quotation email sent!");
              } else {
                const emailData = await emailRes.json();
                toast.error(
                  "Failed to send email: " +
                  (emailData.error || "Unknown error")
                );
              }
            } catch (err) {
              toast.error("Failed to send email.");
            }
          } else {
            toast.error(
              "Failed to create quote: " + (data.error || "Unknown error")
            );
          }
        } catch (err) {
          toast.error("Failed to create quote.");
        }
      }, 0);
    } else {
      Object.entries(errors).forEach(([, msg]) => toast.error(msg));
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  };

  // Handle continue to next step
  const handleContinue = async () => {
    if (validateForm()) {
      if (!showQuoteResults) {
        handleCalculateQuote();
        return;
      }
      dispatch({ type: "COMPLETE_STEP", step: 1 });
      router.push("/customer/event-information");
    } else {
      Object.entries(errors).forEach(([, msg]) =>
        toast.error(msg)
      );
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  };

  // Disable liquor liability if no liability coverage selected
  const isLiquorLiabilityDisabled = state.liabilityCoverage === "none";

  // If liability is none, ensure liquor liability is false
  useEffect(() => {
    if (isLiquorLiabilityDisabled && state.liquorLiability) {
      handleInputChange("liquorLiability", false);
    }
  }, [
    isLiquorLiabilityDisabled,
    state.liquorLiability,
    state.liabilityCoverage,
    handleInputChange,
  ]);

  // Handle special activities checkbox
  const handleSpecialActivitiesChange = (checked: boolean) => {
    if (checked) {
      setShowSpecialActivitiesModal(true);
    } else {
      handleInputChange("specialActivities", false);
    }
  };


  const QuoteGeneratorSkeleton = () => (
    <div className="animate-pulse">
      <div className="w-full mx-auto mb-10 text-center shadow-2xl bg-gray-100/90 rounded-2xl p-8 sm:p-10 md:p-12">
        <div className="mb-8">
          <div className="h-10 bg-gray-300 rounded w-3/4 mx-auto mb-3"></div> {/* Title */}
          <div className="h-6 bg-gray-300 rounded w-1/2 mx-auto"></div>      {/* Subtitle */}
        </div>
        <div className="grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-10">
          {[...Array(7)].map((_, i) => ( // 7 form fields before COVID disclosure
            <div key={i} className="mb-6 flex flex-col items-center">
              <div className="h-5 bg-gray-300 rounded w-1/2 mb-2"></div> {/* Label */}
              <div className="h-10 bg-gray-200 rounded w-[325px]"></div> {/* Input/Select */}
            </div>
          ))}
        </div>

        {/* COVID-19 Disclosure Skeleton */}
        <div className="w-full bg-yellow-100 border-l-4 border-yellow-300 rounded-lg p-4 mt-8 flex items-start gap-3">
          <div className="h-6 w-6 bg-yellow-200 rounded-full mt-1"></div> {/* Icon */}
          <div>
            <div className="h-5 bg-yellow-200 rounded w-1/3 mb-2"></div> {/* Title */}
            <div className="h-10 bg-yellow-200 rounded w-full"></div> {/* Checkbox area */}
          </div>
        </div>

        <div className="flex justify-center mt-10">
          <div className="h-12 bg-blue-300 rounded-md w-48"></div> {/* Calculate Button */}
        </div>
      </div>

      {/* Quote Results Skeleton (conditionally shown, but part of initial structure if showQuoteResults were true) */}
      {/* For simplicity, we'll just show a basic placeholder if it were to be visible */}
      {/* A more complex skeleton would check showQuoteResults, but this is for initial page load primarily */}
      <div className="mb-8 border-0 bg-gray-100 shadow-lg rounded-lg p-6">
        <div className="h-7 bg-gray-300 rounded w-1/2 mb-2"></div> {/* Card Title */}
        <div className="h-5 bg-gray-300 rounded w-1/3 mb-6"></div> {/* Card Subtitle */}
        <div className="space-y-6">
          <div className="bg-gray-200 rounded-xl p-6">
            <div className="h-6 bg-gray-300 rounded w-1/3 mx-auto mb-2"></div>
            <div className="h-10 bg-gray-300 rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-2/5 mb-1"></div>
            <div className="h-4 bg-gray-300 rounded w-2/5"></div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <div className="h-12 bg-blue-300 rounded-md w-48"></div> {/* Continue Button */}
        </div>
      </div>
    </div>
  );


  if (pageLoading) {
    return <QuoteGeneratorSkeleton />;
  }

  return (
    <>
      <div className="w-full mx-auto mb-10 text-center shadow-2xl border-0 bg-white/90 rounded-2xl p-8 sm:p-10 md:p-12">
        <div className="mb-8">
          <p className="text-3xl md:text-4xl font-extrabold text-blue-900 drop-shadow text-center">
            Get Your Wedding Insurance Quote
          </p>
          <p className="text-lg md:text-xl text-blue-700 font-medium text-center">
            Tell us about your event to receive an instant quote
          </p>
        </div>
        <div className="grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-10">
          {/* Resident State */}
          <div className="mb-6 flex flex-col items-center">
            <label
              htmlFor="residentState"
              className="font-semibold text-gray-800"
            >
              Policy Holder&apos;s Resident State
            </label>
            <div className="relative w-[325px]">
              <select
                id="residentState"
                value={state.residentState}
                onChange={(e) =>
                  handleInputChange("residentState", e.target.value)
                }
                className={`w-full p-2 pr-8 border rounded text-center appearance-none ${errors.residentState ? "border-red-500" : ""
                  }`}
              >
                <option value="">Select your state</option>
                {US_STATES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                size={16}
              />
            </div>
          </div>

          {/* Event Type */}
          <div className="mb-6 flex flex-col items-center">
            <label htmlFor="eventType" className="font-semibold text-gray-800">
              Event Type
            </label>
            <div className="relative w-[325px]">
              <select
                id="eventType"
                value={state.eventType}
                onChange={(e) => handleInputChange("eventType", e.target.value)}
                className={`w-full p-2 pr-8 border rounded text-center appearance-none ${errors.eventType ? "border-red-500" : ""
                  }`}
              >
                <option value="">Select event type</option>
                {EVENT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                size={16}
              />
            </div>
          </div>

          {/* Maximum Guests */}
          <div className="mb-6 flex flex-col items-center">
            <label htmlFor="maxGuests" className="font-semibold text-gray-800">
              Maximum Number of Guests
            </label>
            <div className="relative w-[325px]">
              <select
                id="maxGuests"
                value={state.maxGuests}
                onChange={(e) => handleInputChange("maxGuests", e.target.value)}
                className={`w-full p-2 pr-8 border rounded text-center appearance-none ${errors.maxGuests ? "border-red-500" : ""
                  }`}
              >
                <option value="">Select guest count range</option>
                {GUEST_RANGES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                size={16}
              />
            </div>
          </div>

          {/* Event Date */}
          <div className="mb-6 flex flex-col items-center">
            <label htmlFor="eventDate" className="font-semibold text-gray-800">
              Event Date
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              minDate={minDate}
              maxDate={maxDate}
              placeholderText="Select event date"
              error={!!errors.eventDate}
              className="w-[325px] text-center block"
            />
          </div>

          {/* Email Address */}
          <div className="mb-6 flex flex-col items-center">
            <label
              htmlFor="email"
              className="font-semibold text-gray-800 block"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={state.email || ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter your email"
              className="w-[325px] text-center p-2 border rounded"
              required
            />
          </div>

          {/* Coverage Level */}
          <div className="mb-6 flex flex-col items-center">
            <label
              htmlFor="coverageLevel"
              className="font-semibold text-gray-800"
            >
              Core Coverage Level
            </label>
            <div className="relative w-[325px]">
              <select
                id="coverageLevel"
                value={state.coverageLevel?.toString() || ""}
                onChange={(e) =>
                  handleInputChange("coverageLevel", parseInt(e.target.value))
                }
                className={`w-full p-2 pr-8 border rounded text-center appearance-none ${errors.coverageLevel ? "border-red-500" : ""
                  }`}
              >
                <option value="">Select coverage level</option>
                {COVERAGE_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                size={16}
              />
            </div>
          </div>

          {/* Liability Coverage */}
          <div className="mb-6 flex flex-col items-center">
            <label
              htmlFor="liabilityCoverage"
              className="font-semibold text-gray-800"
            >
              Liability Coverage
            </label>
            <div className="relative w-[325px]">
              <select
                id="liabilityCoverage"
                value={state.liabilityCoverage}
                onChange={(e) =>
                  handleInputChange("liabilityCoverage", e.target.value)
                }
                className={`w-full p-2 pr-8 border rounded text-center appearance-none ${errors.liabilityCoverage ? "border-red-500" : ""
                  }`}
              >
                {LIABILITY_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className={option.isNew ? "text-red-400" : ""}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                size={16}
              />
            </div>
          </div>

          {/* Host Liquor Liability */}
          <div className="mb-6 flex flex-col items-center">
            <label
              htmlFor="liquorLiability"
              className="font-semibold text-gray-800"
            >
              Host Liquor Liability
            </label>
            <Checkbox
              id="liquorLiability"
              label={
                <span className="font-medium">
                  Yes, add Host Liquor Liability coverage{" "}
                  {!isLiquorLiabilityDisabled && state.maxGuests
                    ? `(+$${LIABILITY_OPTIONS.find(
                      (o) => o.value === state.liabilityCoverage && o.isNew
                    )
                      ? LIQUOR_LIABILITY_PREMIUMS_NEW[state.maxGuests]
                      : LIQUOR_LIABILITY_PREMIUMS[state.maxGuests]
                    })`
                    : ""}
                </span>
              }
              checked={state.liquorLiability}
              onChange={(checked) =>
                handleInputChange("liquorLiability", checked)
              }
              disabled={isLiquorLiabilityDisabled}
              description={
                <span className="break-words whitespace-normal max-w-sm">
                  {isLiquorLiabilityDisabled
                    ? "You must select Liability Coverage to add Host Liquor Liability"
                    : "Provides coverage for alcohol-related incidents if alcohol is served at your event"}
                </span>
              }
            />
          </div>

          {/* Special Activities */}
          <div className="mb-6 flex flex-col items-center">
            <label
              htmlFor="specialActivities"
              className="font-semibold text-gray-800"
            >
              Special Activities
            </label>
            <Checkbox
              id="specialActivities"
              label={
                <span className="font-medium">
                  My event will include special activities or features
                </span>
              }
              checked={state.specialActivities}
              onChange={handleSpecialActivitiesChange}
              description="Examples: fireworks, bounce houses, live animals, etc."
            />
          </div>
        </div>

        {/* COVID-19 Disclosure */}
        <div className="w-full bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mt-8 flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-500 mt-1" />
          <div>
            <h3 className="font-semibold text-yellow-800 mb-1">
              Important Disclosures
            </h3>
            <FormField
              label={
                <span className="font-medium text-gray-800">
                  COVID-19 Exclusion Acknowledgment
                </span>
              }
              htmlFor="covidDisclosure"
              error={errors.covidDisclosure}
              className="mt-3"
            >
              <Checkbox
                id="covidDisclosure"
                label={
                  <span className="font-medium">
                    I understand that cancellations or impacts due to COVID-19,
                    pandemics, or communicable diseases are not covered by this
                    policy
                  </span>
                }
                checked={state.covidDisclosure}
                onChange={(checked) =>
                  handleInputChange("covidDisclosure", checked)
                }
                error={!!errors.covidDisclosure}
              />
            </FormField>
          </div>
        </div>

        <div className="flex justify-center mt-10">
          <Button
            variant="primary"
            size="lg"
            onClick={handleCalculateQuote}
            className="transition-transform duration-150 hover:scale-105"
          >
            <DollarSign size={18} />
            Calculate Quote
          </Button>
        </div>
      </div>

      {/* Quote Results */}
      {showQuoteResults && (
        <Card
          title={
            <span className="text-xl font-bold text-blue-800">
              Your Insurance Quote
            </span>
          }
          subtitle={
            <span className="text-base text-gray-600">
              Quote #{state.quoteNumber || "PENDING"}
            </span>
          }
          icon={<DollarSign size={24} className="text-blue-600" />}
          className="mb-8 border-0 bg-white shadow-lg"
          footer={
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="lg"
                onClick={handleContinue}
                className="transition-transform duration-150 hover:scale-105"
              >
                Continue to Event Details
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-1">
                  Total Premium
                </h3>
                <p className="text-3xl font-bold text-blue-700">
                  {formatCurrency(state.totalPremium)}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Premium Breakdown:
                </h4>
                <div className="space-y-2 text-gray-700">
                  <div className="flex justify-between text-sm">
                    <span>Core Coverage:</span>
                    <span className="font-medium">
                      {formatCurrency(state.basePremium)}
                    </span>
                  </div>
                  {state.liabilityCoverage !== "none" && (
                    <div className="flex justify-between text-sm">
                      <span>Liability Coverage:</span>
                      <span className="font-medium">
                        {formatCurrency(state.liabilityPremium)}
                      </span>
                    </div>
                  )}
                  {state.liquorLiability && (
                    <div className="flex justify-between text-sm">
                      <span>Host Liquor Liability:</span>
                      <span className="font-medium">
                        {formatCurrency(state.liquorLiabilityPremium)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Coverage Summary
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex justify-between">
                  <span>Event Type:</span>
                  <span className="font-medium">
                    {
                      EVENT_TYPES.find((t) => t.value === state.eventType)
                        ?.label
                    }
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Event Date:</span>
                  <span className="font-medium">
                    {state.eventDate
                      ? new Date(state.eventDate).toLocaleDateString()
                      : "N/A"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Core Coverage:</span>
                  <span className="font-medium">
                    {
                      COVERAGE_LEVELS.find(
                        (l) => l.value === state.coverageLevel?.toString()
                      )?.label
                    }
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Liability Coverage:</span>
                  <span className="font-medium">
                    {
                      LIABILITY_OPTIONS.find(
                        (o) => o.value === state.liabilityCoverage
                      )?.label
                    }
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Host Liquor Liability:</span>
                  <span className="font-medium">
                    {state.liquorLiability ? "Included" : "Not Included"}
                  </span>
                </li>
              </ul>
            </div>
            <div className="flex items-center text-sm bg-gray-100 text-gray-700 p-4 rounded-lg">
              <AlertCircle size={16} className="flex-shrink-0 mr-2" />
              <p>
                This quote is valid for 30 days. Continue to provide event
                details and complete your purchase.
              </p>
            </div>
          </div>
        </Card>
      )}
      {/* Special Activities Modal */}
      {showSpecialActivitiesModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-6 sm:px-6">
          <div className="bg-white rounded-2xl shadow-xl w-full min-w-[300px] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl max-h-[90vh] overflow-y-auto transition-transform duration-300 ease-out animate-fade-in">
            <div className="p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-semibold text-red-600 mb-4">
                Special Activities Warning
              </h3>
              <p className="text-gray-700 mb-5 text-sm sm:text-base leading-relaxed">
                The following activities are typically excluded from coverage.
                If your event includes any of these, please contact our support
                team for special underwriting.
              </p>

              <ul className="list-disc pl-5 mb-6 space-y-1 text-sm text-gray-800">
                {PROHIBITED_ACTIVITIES.map((activity, index) => (
                  <li key={index}>{activity}</li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    handleInputChange("specialActivities", false);
                    setShowSpecialActivitiesModal(false);
                  }}
                >
                  My event doesn&apos;t include these
                </Button>
                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setShowSpecialActivitiesModal(false);
                    window.open("/contact", "_blank", "noopener,noreferrer");
                  }}
                >
                  Contact me for special coverage
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
