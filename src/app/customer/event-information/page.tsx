"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CalendarCheck, ChevronDown } from "lucide-react";
import { useQuote } from "@/context/QuoteContext";
import { Button } from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input"; // Input is used in Step2Form
import Checkbox from "@/components/ui/Checkbox";
import {
  VENUE_TYPES,
  INDOOR_OUTDOOR_OPTIONS,
  COUNTRIES,
  US_STATES,
} from "@/utils/constants";
import { isEmpty, isValidZip } from "@/utils/validators";
import dynamic from "next/dynamic";
import { toast } from "@/hooks/use-toast";
import type { QuoteState } from "@/context/QuoteContext";

const QuotePreview = dynamic(() => import("@/components/ui/QuotePreview"), {
  ssr: false,
});

// Skeleton Loader Component
const EventInformationSkeleton = () => (
  <div className="w-full pb-12 animate-pulse">
    {/* Honoree Information Skeleton */}
    <div className="mb-10 shadow-2xl border-0 bg-slate-200/90 p-8 sm:p-10 md:p-12 rounded-2xl w-full">
      <div className="flex items-center justify-center text-center mb-4 gap-4">
        <div className="flex-shrink-0">
          <div className="w-9 h-9 bg-slate-300 rounded"></div>
        </div>
        <div>
          <div className="h-6 bg-slate-300 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-300 rounded w-64"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {[1, 2].map((i) => (
          <div key={i}>
            <div className={`h-5 bg-slate-300 rounded ${i === 1 ? 'w-32' : 'w-40'} mb-4 mx-auto`}></div>
            <div className="mb-4">
              <div className="h-4 bg-slate-300 rounded w-24 mb-2 mx-auto"></div>
              <div className="h-10 bg-slate-300 rounded w-72 mx-auto"></div>
            </div>
            <div className="mb-4">
              <div className="h-4 bg-slate-300 rounded w-24 mb-2 mx-auto"></div>
              <div className="h-10 bg-slate-300 rounded w-72 mx-auto"></div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Venue Information Skeleton */}
    <div className="mb-8 shadow-lg border-0 bg-slate-200/90 p-8 sm:p-10 md:p-12 rounded-2xl w-full">
      <div className="flex items-center justify-center text-center mb-4 gap-4">
        <div className="flex-shrink-0">
          <div className="w-7 h-7 bg-slate-300 rounded"></div>
        </div>
        <div>
          <div className="h-6 bg-slate-300 rounded w-56 mb-2"></div>
          <div className="h-4 bg-slate-300 rounded w-72"></div>
        </div>
      </div>
      <div className="space-y-8 w-full px-2 sm:px-4 md:px-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="h-10 bg-slate-300 rounded w-72 mx-auto"></div>
            <div className="h-10 bg-slate-300 rounded w-72 mx-auto"></div>
          </div>
        ))}
        <div className="h-6 bg-slate-300 rounded w-3/4 mx-auto mt-4"></div> {/* Checkbox placeholder */}
      </div>
    </div>

    {/* Navigation Buttons Skeleton */}
    <div className="flex flex-col sm:flex-row justify-between items-center mt-10 gap-4 w-full">
      <div className="h-10 bg-slate-300 rounded w-full sm:w-32"></div>
      <div className="h-10 bg-slate-300 rounded w-full sm:w-48"></div>
    </div>
  </div>
);

export default function EventInformation() {
  const router = useRouter();
  const { state, dispatch } = useQuote();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !state.step1Complete) {
      router.replace("/customer/quote-generator");
    }
  }, [state.step1Complete, router, isMounted]);

  const handleInputChange = (
    field: keyof QuoteState,
    value: string | boolean
  ) => {
    dispatch({ type: "UPDATE_FIELD", field, value });
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const nameRegex = /^[a-zA-Z\-' ]+$/;
    if (isEmpty(state.honoree1FirstName))
      newErrors.honoree1FirstName = "Please enter the first name";
    else if (!nameRegex.test(state.honoree1FirstName))
      newErrors.honoree1FirstName = "First name contains invalid characters";
    if (isEmpty(state.honoree1LastName))
      newErrors.honoree1LastName = "Please enter the last name";
    else if (!nameRegex.test(state.honoree1LastName))
      newErrors.honoree1LastName = "Last name contains invalid characters";
    if (isEmpty(state.ceremonyLocationType))
      newErrors.ceremonyLocationType = "Please select a venue type";
    if (isEmpty(state.indoorOutdoor))
      newErrors.indoorOutdoor = "Please select indoor/outdoor option";
    if (isEmpty(state.venueName))
      newErrors.venueName = "Please enter the venue name";
    if (isEmpty(state.venueAddress1))
      newErrors.venueAddress1 = "Please enter the venue address";
    if (isEmpty(state.venueCity)) newErrors.venueCity = "Please enter the city";
    if (isEmpty(state.venueState))
      newErrors.venueState = "Please select a state";
    if (isEmpty(state.venueZip))
      newErrors.venueZip = "Please enter the ZIP code";
    else if (!isValidZip(state.venueZip))
      newErrors.venueZip = "Please enter a valid ZIP code";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBack = () => {
    router.push("/customer/quote-generator");
  };

  const handleContinue = async () => {
    if (validateForm()) {
      dispatch({ type: "COMPLETE_STEP", step: 2 });
      // Save to DB
      const storedQuoteNumber = localStorage.getItem("quoteNumber");
      if (!storedQuoteNumber) {
        toast.error("Missing quote number. Please start from Step 1.");
        return;
      }
      const payload = {
        ...state,
        quoteNumber: storedQuoteNumber,
        step: "STEP2",
        source: "CUSTOMER",
      };
      await fetch("/api/quote/step", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      router.push("/customer/policy-holder");
    } else {
      Object.values(errors).forEach((msg) => toast.error(msg));
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  };

  const isCruiseShip = state.ceremonyLocationType === "cruise_ship";
  const isRehearsalCruiseShip = state.rehearsalVenueType === "cruise_ship";
  const isCeremonyCruiseShip = state.ceremonyVenueType === "cruise_ship";
  const isBrunchCruiseShip = state.brunchVenueType === "cruise_ship";

  if (!isMounted) {
    return <EventInformationSkeleton />; // Show skeleton until component is mounted
  }

  if (!state.step1Complete) {
    // After mount, if step1 is not complete, a redirect should be in progress from the useEffect.
    // Continue showing skeleton (or a specific redirecting loader) to prevent form flash
    // while navigation occurs.
    return <EventInformationSkeleton />;
  }


  return (
    <>
      {/* Outermost div simplified: max-width, margins, horizontal padding, and top margin are now handled by CustomerLayout.tsx */}
      <div className="w-full pb-12">
        {" "}
        {/* Retain bottom padding if needed, or manage spacing within sections */}
        
        {/* Honoree Information */}
        <div className="mb-10 shadow-2xl border-0 bg-white/90 p-8 sm:p-10 md:p-12 rounded-2xl w-full">
          <div className="flex items-center justify-center text-center mb-4 gap-4">
            <div className="flex-shrink-0">
              <CalendarCheck size={36} className="text-indigo-600" />
            </div>
            <div>
              <div className="text-xl md:text-2xl font-extrabold leading-tight mb-1">
                Honoree Information
              </div>
              <div className="text-base text-gray-500 font-medium leading-tight">
                Tell us who is being celebrated
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div>
              <h3 className="font-bold text-gray-700 mb-4 text-center text-lg">
                Honoree #1
              </h3>
              <FormField
                label={
                  <span className="font-medium text-gray-800">First Name</span>
                }
                htmlFor="honoree1FirstName"
                required
                error={errors.honoree1FirstName}
                className="mb-4"
              >
                <div className="w-72 mx-auto">
                  {" "}
                  {/* Centering the w-72 div */}
                  <Input
                    id="honoree1FirstName"
                    value={state.honoree1FirstName}
                    onChange={(e) =>
                      handleInputChange("honoree1FirstName", e.target.value)
                    }
                    error={!!errors.honoree1FirstName}
                    placeholder="John"
                    className="text-center"
                  />
                </div>
              </FormField>
              <FormField
                label={
                  <span className="font-medium text-gray-800">Last Name</span>
                }
                htmlFor="honoree1LastName"
                required
                error={errors.honoree1LastName}
                className="mb-4"
              >
                <div className="w-72 mx-auto">
                  {" "}
                  {/* Centering the w-72 div */}
                  <Input
                    id="honoree1LastName"
                    value={state.honoree1LastName}
                    onChange={(e) =>
                      handleInputChange("honoree1LastName", e.target.value)
                    }
                    error={!!errors.honoree1LastName}
                    placeholder="Doe"
                    className="text-center"
                  />
                </div>
              </FormField>
            </div>
            <div>
              <h3 className="font-bold text-center text-gray-700 mb-4 text-lg">
                Honoree #2{" "}
                <span className="text-semibold text-sm text-gray-400">
                  (if applicable)
                </span>
              </h3>
              <FormField
                label={
                  <span className="font-medium text-gray-800">First Name</span>
                }
                htmlFor="honoree2FirstName"
                className="mb-4"
              >
                <div className="w-72 mx-auto">
                  {" "}
                  {/* Centering the w-72 div */}
                  <Input
                    id="honoree2FirstName"
                    value={state.honoree2FirstName}
                    onChange={(e) =>
                      handleInputChange("honoree2FirstName", e.target.value)
                    }
                    placeholder="John"
                    className="text-center"
                  />
                </div>
              </FormField>
              <FormField
                label={
                  <span className="font-medium text-gray-800">Last Name</span>
                }
                htmlFor="honoree2LastName"
                className="mb-4"
              >
                <div className="w-72 mx-auto">
                  {" "}
                  {/* Centering the w-72 div */}
                  <Input
                    id="honoree2LastName"
                    value={state.honoree2LastName}
                    onChange={(e) =>
                      handleInputChange("honoree2LastName", e.target.value)
                    }
                    placeholder="Doe"
                    className="text-center"
                  />
                </div>
              </FormField>
            </div>
          </div>
        </div>


        {/* Venue Information */}
        <div className="mb-8 shadow-lg border-0 bg-white p-8 sm:p-10 md:p-12 rounded-2xl w-full">
          <div className="flex items-center justify-center text-center mb-4 gap-4">
            <div className="flex-shrink-0">
              <MapPin size={28} className="text-blue-600" />
            </div>
            <div>
              <div className="text-xl md:text-2xl font-extrabold leading-tight mb-1">
                {state.eventType === "wedding" ? "Reception Venue Information" : "Ceremony Venue Information"}
              </div>
              <div className="text-base text-gray-500 font-medium leading-tight">
                Details about where your event will be held
              </div>
            </div>
          </div>
          <div className="space-y-8 w-full px-2 sm:px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Venue Type */}
              <FormField
                label={<span className="font-medium text-gray-800">Venue Type</span>}
                htmlFor="ceremonyLocationType"
                required
                error={errors.ceremonyLocationType}
                tooltip="The type of location where your event will be held"
                className="mb-4"
              >
                <div className="relative w-72 mx-auto">
                  <select
                    id="ceremonyLocationType"
                    value={state.ceremonyLocationType}
                    onChange={(e) => handleInputChange("ceremonyLocationType", e.target.value)}
                    className={`block w-full rounded-md shadow-sm border pl-3 pr-10 py-2 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.ceremonyLocationType ? "border-red-500 text-red-900" : "border-gray-300 text-gray-900"
                    } text-center`}
                  >
                    <option value="">Select venue type</option>
                    {VENUE_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                </div>
              </FormField>

              {/* Indoor/Outdoor */}
              <FormField
                label={<span className="font-medium text-gray-800">Indoor/Outdoor</span>}
                htmlFor="indoorOutdoor"
                required
                error={errors.indoorOutdoor}
                className="mb-4"
              >
                <div className="relative w-72 mx-auto">
                  <select
                    id="indoorOutdoor"
                    value={state.indoorOutdoor}
                    onChange={(e) => handleInputChange("indoorOutdoor", e.target.value)}
                    className={`block w-full rounded-md shadow-sm border pl-3 pr-10 py-2 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.indoorOutdoor ? "border-red-500 text-red-900" : "border-gray-300 text-gray-900"
                    } text-center`}
                  >
                    <option value="">Select option</option>
                    {INDOOR_OUTDOOR_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                </div>
              </FormField>
            </div>

            <FormField
              label={
                <span className="font-medium text-gray-800">Venue Name</span>
              }
              htmlFor="venueName"
              required
              error={errors.venueName}
              className="mb-4"
            >
              <div className="w-full">
                {" "}
                {/* Takes full width as per Step2Form */}
                <Input
                  id="venueName"
                  value={state.venueName}
                  onChange={(e) =>
                    handleInputChange("venueName", e.target.value)
                  }
                  error={!!errors.venueName}
                  placeholder={isCruiseShip ? "Cruise Ship Name" : "Venue Name"}
                  className="text-center w-[92%] mx-auto" // Specific styling from Step2Form
                />
              </div>
            </FormField>
            {/* Reception Venue Address Fields */}
            {isCruiseShip ? (
              <>
                <FormField
                  label="Cruise Line"
                  htmlFor="venueAddress1"
                  required
                  error={errors.venueAddress1}
                  className="mb-4"
                >
                  <div className="w-72 mx-auto">
                    <Input
                      id="venueAddress1"
                      value={state.venueAddress1}
                      onChange={(e) =>
                        handleInputChange("venueAddress1", e.target.value)
                      }
                      error={!!errors.venueAddress1}
                      placeholder="e.g., Royal Caribbean"
                      className="text-center"
                    />
                  </div>
                </FormField>
                <FormField
                  label="Departure Port"
                  htmlFor="venueCity"
                  required
                  error={errors.venueCity}
                  className="mb-4"
                >
                  <div className="w-72 mx-auto">
                    <Input
                      id="venueCity"
                      value={state.venueCity}
                      onChange={(e) =>
                        handleInputChange("venueCity", e.target.value)
                      }
                      error={!!errors.venueCity}
                      placeholder="e.g., Miami, Florida"
                      className="text-center"
                    />
                  </div>
                </FormField>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <FormField
                  label={
                    <span className="font-medium text-gray-800">
                      Address Line 1
                    </span>
                  }
                  htmlFor="venueAddress1"
                  required
                  error={errors.venueAddress1}
                  className="mb-4"
                >
                  <div className="w-72 mx-auto">
                    <Input
                      id="venueAddress1"
                      value={state.venueAddress1}
                      onChange={(e) =>
                        handleInputChange("venueAddress1", e.target.value)
                      }
                      error={!!errors.venueAddress1}
                      placeholder="Street Address"
                      className="text-center"
                    />
                  </div>
                </FormField>
                <FormField
                  label={
                    <span className="font-medium text-gray-800">
                      Address Line 2
                    </span>
                  }
                  htmlFor="venueAddress2"
                  className="mb-4"
                >
                  <div className="w-72 mx-auto">
                    <Input
                      id="venueAddress2"
                      value={state.venueAddress2}
                      onChange={(e) =>
                        handleInputChange("venueAddress2", e.target.value)
                      }
                      placeholder="Apt, Suite, Building (optional)"
                      className="text-center"
                    />
                  </div>
                </FormField>
              </div>
            )}
            {/* City, State, and ZIP only shown for non-cruise ship venues */}
            {!isCruiseShip && (
              <>
                {/* City and State */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <FormField
                    label={<span className="font-medium text-gray-800">City</span>}
                    htmlFor="venueCity"
                    required
                    error={errors.venueCity}
                    className="mb-4"
                  >
                    <div className="w-72 mx-auto">
                      <Input
                        id="venueCity"
                        value={state.venueCity}
                        onChange={(e) => handleInputChange("venueCity", e.target.value)}
                        error={!!errors.venueCity}
                        className="text-center"
                      />
                    </div>
                  </FormField>

                  <FormField
                    label={<span className="font-medium text-gray-800">State</span>}
                    htmlFor="venueState"
                    required
                    error={errors.venueState}
                    className="mb-4"
                  >
                    <div className="relative w-72 mx-auto">
                      <select
                        id="venueState"
                        value={state.venueState}
                        onChange={(e) => handleInputChange("venueState", e.target.value)}
                        className={`block w-full rounded-md shadow-sm border pl-3 pr-10 py-2 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.venueState ? "border-red-500 text-red-900" : "border-gray-300 text-gray-900"
                        } text-center`}
                      >
                        <option value="">Select state</option>
                        {US_STATES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                  </FormField>
                </div>

                {/* ZIP Code */}
                <div className="grid grid-cols-1 gap-6 w-full">
                  <FormField
                    label={<span className="font-medium text-gray-800">ZIP Code</span>}
                    htmlFor="venueZip"
                    required
                    error={errors.venueZip}
                    className="mb-4"
                  >
                    <div className="w-72 mx-auto">
                      <Input
                        id="venueZip"
                        value={state.venueZip}
                        onChange={(e) => handleInputChange("venueZip", e.target.value)}
                        error={!!errors.venueZip}
                        className="text-center"
                      />
                    </div>
                  </FormField>
                </div>
              </>
            )}
            <FormField
              label=""
              htmlFor="venueAsInsured"
              className="mb-4"
            >
              <Checkbox
                id="venueAsInsured"
                label={<span className="font-medium">Add this venue as an Additional Insured on my policy</span>}
                checked={state.venueAsInsured}
                onChange={(checked) => handleInputChange("venueAsInsured", checked)}
                className="w-full justify-center"
              />
            </FormField>
          </div>
        </div>

        {/* Additional Wedding Venues */}
        {state.eventType === "wedding" && (
          <>
            {/* Ceremony Venue */}
            <div className="mb-8 shadow-lg border-0 bg-white p-8 sm:p-10 md:p-12 rounded-2xl w-full">
              <div className="flex items-center justify-center text-center mb-4 gap-4">
                <div className="flex-shrink-0">
                  <MapPin size={28} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-extrabold leading-tight mb-1">
                    Ceremony Venue Information
                  </div>
                  <div className="text-base text-gray-500 font-medium leading-tight">
                    Details about where your ceremony will be held
                  </div>
                </div>
              </div>
              <div className="space-y-8 w-full px-2 sm:px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {/* Venue Type */}
                  <FormField
                    label={<span className="font-medium text-gray-800">Venue Type</span>}
                    htmlFor="ceremonyVenueType"
                    required
                    error={errors.ceremonyVenueType}
                    tooltip="The type of location where your ceremony will be held"
                    className="mb-4"
                  >
                    <div className="relative w-72 mx-auto">
                      <select
                        id="ceremonyVenueType"
                        value={state.ceremonyVenueType}
                        onChange={(e) => handleInputChange("ceremonyVenueType", e.target.value)}
                        className={`block w-full rounded-md shadow-sm border pl-3 pr-10 py-2 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.ceremonyVenueType ? "border-red-500 text-red-900" : "border-gray-300 text-gray-900"
                        } text-center`}
                      >
                        <option value="">Select venue type</option>
                        {VENUE_TYPES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                  </FormField>

                  {/* Indoor/Outdoor */}
                  <FormField
                    label={<span className="font-medium text-gray-800">Indoor/Outdoor</span>}
                    htmlFor="ceremonyVenueIndoorOutdoor"
                    required
                    error={errors.ceremonyVenueIndoorOutdoor}
                    className="mb-4"
                  >
                    <div className="relative w-72 mx-auto">
                      <select
                        id="ceremonyVenueIndoorOutdoor"
                        value={state.ceremonyVenueIndoorOutdoor}
                        onChange={(e) => handleInputChange("ceremonyVenueIndoorOutdoor", e.target.value)}
                        className={`block w-full rounded-md shadow-sm border pl-3 pr-10 py-2 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.ceremonyVenueIndoorOutdoor ? "border-red-500 text-red-900" : "border-gray-300 text-gray-900"
                        } text-center`}
                      >
                        <option value="">Select option</option>
                        {INDOOR_OUTDOOR_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                  </FormField>
                </div>

                {/* Venue Name */}
                <FormField
                  label={<span className="font-medium text-gray-800">Venue Name</span>}
                  htmlFor="ceremonyVenueName"
                  required
                  error={errors.ceremonyVenueName}
                  className="mb-4"
                >
                  <div className="w-full">
                    <Input
                      id="ceremonyVenueName"
                      value={state.ceremonyVenueName}
                      onChange={(e) => handleInputChange("ceremonyVenueName", e.target.value)}
                      error={!!errors.ceremonyVenueName}
                      placeholder="Venue Name"
                      className="text-center w-[92%] mx-auto"
                    />
                  </div>
                </FormField>

                {/* Ceremony Venue Address Fields */}
                {isCeremonyCruiseShip ? (
                  <>
                    <FormField
                      label="Cruise Line"
                      htmlFor="ceremonyVenueAddress1"
                      required
                      error={errors.ceremonyVenueAddress1}
                    className="mb-4"
                  >
                    <div className="w-72 mx-auto">
                      <Input
                          id="ceremonyVenueAddress1"
                          value={state.ceremonyVenueAddress1}
                          onChange={(e) => handleInputChange("ceremonyVenueAddress1", e.target.value)}
                          error={!!errors.ceremonyVenueAddress1}
                          placeholder="e.g., Royal Caribbean"
                        className="text-center"
                      />
                    </div>
                  </FormField>
                    <FormField
                      label="Departure Port"
                      htmlFor="ceremonyVenueCity"
                      required
                      error={errors.ceremonyVenueCity}
                      className="mb-4"
                    >
                      <div className="w-72 mx-auto">
                        <Input
                          id="ceremonyVenueCity"
                          value={state.ceremonyVenueCity}
                          onChange={(e) => handleInputChange("ceremonyVenueCity", e.target.value)}
                          error={!!errors.ceremonyVenueCity}
                          placeholder="e.g., Miami, Florida"
                          className="text-center"
                        />
                </div>
                    </FormField>
                  </>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <FormField
                      label={<span className="font-medium text-gray-800">Address Line 1</span>}
                      htmlFor="ceremonyVenueAddress1"
                    required
                      error={errors.ceremonyVenueAddress1}
                      className="mb-4"
                    >
                      <div className="w-72 mx-auto">
                        <Input
                          id="ceremonyVenueAddress1"
                          value={state.ceremonyVenueAddress1}
                          onChange={(e) => handleInputChange("ceremonyVenueAddress1", e.target.value)}
                          error={!!errors.ceremonyVenueAddress1}
                          placeholder="Street Address"
                          className="text-center"
                        />
                      </div>
                    </FormField>
                    <FormField
                      label={<span className="font-medium text-gray-800">Address Line 2</span>}
                      htmlFor="ceremonyVenueAddress2"
                      className="mb-4"
                    >
                      <div className="w-72 mx-auto">
                        <Input
                          id="ceremonyVenueAddress2"
                          value={state.ceremonyVenueAddress2}
                          onChange={(e) => handleInputChange("ceremonyVenueAddress2", e.target.value)}
                          placeholder="Apt, Suite, Building (optional)"
                          className="text-center"
                        />
                      </div>
                    </FormField>
                  </div>
                )}

                {/* City, State, and ZIP only shown for non-cruise ship venues */}
                {!isCeremonyCruiseShip && (
                  <>
                    {/* City and State */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <FormField
                        label={<span className="font-medium text-gray-800">City</span>}
                        htmlFor="ceremonyVenueCity"
                        required
                        error={errors.ceremonyVenueCity}
                        className="mb-4"
                      >
                        <div className="w-72 mx-auto">
                          <Input
                            id="ceremonyVenueCity"
                            value={state.ceremonyVenueCity}
                            onChange={(e) => handleInputChange("ceremonyVenueCity", e.target.value)}
                            error={!!errors.ceremonyVenueCity}
                            className="text-center"
                          />
                        </div>
                      </FormField>

                      <FormField
                        label={<span className="font-medium text-gray-800">State</span>}
                        htmlFor="ceremonyVenueState"
                        required
                        error={errors.ceremonyVenueState}
                    className="mb-4"
                  >
                    <div className="relative w-72 mx-auto">
                      <select
                            id="ceremonyVenueState"
                            value={state.ceremonyVenueState}
                            onChange={(e) => handleInputChange("ceremonyVenueState", e.target.value)}
                        className={`block w-full rounded-md shadow-sm border pl-3 pr-10 py-2 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.ceremonyVenueState ? "border-red-500 text-red-900" : "border-gray-300 text-gray-900"
                        } text-center`}
                      >
                        <option value="">Select state</option>
                        {US_STATES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                        </div>
                      </FormField>
                    </div>

                    {/* ZIP Code */}
                    <div className="grid grid-cols-1 gap-6 w-full">
                      <FormField
                        label={<span className="font-medium text-gray-800">ZIP Code</span>}
                        htmlFor="ceremonyVenueZip"
                        required
                        error={errors.ceremonyVenueZip}
                        className="mb-4"
                      >
                        <div className="w-72 mx-auto">
                          <Input
                            id="ceremonyVenueZip"
                            value={state.ceremonyVenueZip}
                            onChange={(e) => handleInputChange("ceremonyVenueZip", e.target.value)}
                            error={!!errors.ceremonyVenueZip}
                            className="text-center"
                      />
                    </div>
                  </FormField>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Rehearsal Dinner Venue - Similar structure to Ceremony Venue */}
            <div className="mb-8 shadow-lg border-0 bg-white p-8 sm:p-10 md:p-12 rounded-2xl w-full">
              <div className="flex items-center justify-center text-center mb-4 gap-4">
                <div className="flex-shrink-0">
                  <MapPin size={28} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-extrabold leading-tight mb-1">
                    Rehearsal Dinner Venue Information
                  </div>
                  <div className="text-base text-gray-500 font-medium leading-tight">
                    Details about where your rehearsal dinner will be held
                  </div>
                </div>
              </div>
              <div className="space-y-8 w-full px-2 sm:px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {/* Venue Type */}
                  <FormField
                    label={<span className="font-medium text-gray-800">Venue Type</span>}
                    htmlFor="rehearsalVenueType"
                    required
                    error={errors.rehearsalVenueType}
                    tooltip="The type of location where your rehearsal dinner will be held"
                    className="mb-4"
                  >
                    <div className="relative w-72 mx-auto">
                      <select
                        id="rehearsalVenueType"
                        value={state.rehearsalVenueType}
                        onChange={(e) => handleInputChange("rehearsalVenueType", e.target.value)}
                        className={`block w-full rounded-md shadow-sm border pl-3 pr-10 py-2 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.rehearsalVenueType ? "border-red-500 text-red-900" : "border-gray-300 text-gray-900"
                        } text-center`}
                      >
                        <option value="">Select venue type</option>
                        {VENUE_TYPES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                  </FormField>

                  {/* Indoor/Outdoor */}
                  <FormField
                    label={<span className="font-medium text-gray-800">Indoor/Outdoor</span>}
                    htmlFor="rehearsalVenueIndoorOutdoor"
                    required
                    error={errors.rehearsalVenueIndoorOutdoor}
                    className="mb-4"
                  >
                    <div className="relative w-72 mx-auto">
                      <select
                        id="rehearsalVenueIndoorOutdoor"
                        value={state.rehearsalVenueIndoorOutdoor}
                        onChange={(e) => handleInputChange("rehearsalVenueIndoorOutdoor", e.target.value)}
                        className={`block w-full rounded-md shadow-sm border pl-3 pr-10 py-2 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.rehearsalVenueIndoorOutdoor ? "border-red-500 text-red-900" : "border-gray-300 text-gray-900"
                        } text-center`}
                      >
                        <option value="">Select option</option>
                        {INDOOR_OUTDOOR_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                  </FormField>
                </div>

                {/* Venue Name */}
                <FormField
                  label={<span className="font-medium text-gray-800">Venue Name</span>}
                  htmlFor="rehearsalVenueName"
                  required
                  error={errors.rehearsalVenueName}
                  className="mb-4"
                >
                  <div className="w-full">
                    <Input
                      id="rehearsalVenueName"
                      value={state.rehearsalVenueName}
                      onChange={(e) => handleInputChange("rehearsalVenueName", e.target.value)}
                      error={!!errors.rehearsalVenueName}
                      placeholder="Venue Name"
                      className="text-center w-[92%] mx-auto"
                    />
                  </div>
                </FormField>

                {/* Rehearsal Dinner Venue Address Fields */}
                {isRehearsalCruiseShip ? (
                  <>
                    <FormField
                      label="Cruise Line"
                      htmlFor="rehearsalVenueAddress1"
                      required
                      error={errors.rehearsalVenueAddress1}
                      className="mb-4"
                    >
                      <div className="w-72 mx-auto">
                        <Input
                          id="rehearsalVenueAddress1"
                          value={state.rehearsalVenueAddress1}
                          onChange={(e) => handleInputChange("rehearsalVenueAddress1", e.target.value)}
                          error={!!errors.rehearsalVenueAddress1}
                          placeholder="e.g., Royal Caribbean"
                          className="text-center"
                        />
                      </div>
                    </FormField>
                    <FormField
                      label="Departure Port"
                      htmlFor="rehearsalVenueCity"
                      required
                      error={errors.rehearsalVenueCity}
                      className="mb-4"
                    >
                      <div className="w-72 mx-auto">
                        <Input
                          id="rehearsalVenueCity"
                          value={state.rehearsalVenueCity}
                          onChange={(e) => handleInputChange("rehearsalVenueCity", e.target.value)}
                          error={!!errors.rehearsalVenueCity}
                          placeholder="e.g., Miami, Florida"
                          className="text-center"
                        />
                      </div>
                    </FormField>
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <FormField
                      label={<span className="font-medium text-gray-800">Address Line 1</span>}
                      htmlFor="rehearsalVenueAddress1"
                      required
                      error={errors.rehearsalVenueAddress1}
                      className="mb-4"
                    >
                      <div className="w-72 mx-auto">
                        <Input
                          id="rehearsalVenueAddress1"
                          value={state.rehearsalVenueAddress1}
                          onChange={(e) => handleInputChange("rehearsalVenueAddress1", e.target.value)}
                          error={!!errors.rehearsalVenueAddress1}
                          placeholder="Street Address"
                          className="text-center"
                        />
                      </div>
                    </FormField>
                    <FormField
                      label={<span className="font-medium text-gray-800">Address Line 2</span>}
                      htmlFor="rehearsalVenueAddress2"
                      className="mb-4"
                    >
                      <div className="w-72 mx-auto">
                        <Input
                          id="rehearsalVenueAddress2"
                          value={state.rehearsalVenueAddress2}
                          onChange={(e) => handleInputChange("rehearsalVenueAddress2", e.target.value)}
                          placeholder="Apt, Suite, Building (optional)"
                          className="text-center"
                        />
                      </div>
                    </FormField>
                  </div>
                )}

                {/* City, State, and ZIP only shown for non-cruise ship venues */}
                {!isRehearsalCruiseShip && (
                  <>
                    {/* City and State */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <FormField
                        label={<span className="font-medium text-gray-800">City</span>}
                        htmlFor="rehearsalVenueCity"
                        required
                        error={errors.rehearsalVenueCity}
                        className="mb-4"
                      >
                        <div className="w-72 mx-auto">
                          <Input
                            id="rehearsalVenueCity"
                            value={state.rehearsalVenueCity}
                            onChange={(e) => handleInputChange("rehearsalVenueCity", e.target.value)}
                            error={!!errors.rehearsalVenueCity}
                            className="text-center"
                          />
                        </div>
                      </FormField>

                      <FormField
                        label={<span className="font-medium text-gray-800">State</span>}
                        htmlFor="rehearsalVenueState"
                        required
                        error={errors.rehearsalVenueState}
                        className="mb-4"
                      >
                        <div className="relative w-72 mx-auto">
                          <select
                            id="rehearsalVenueState"
                            value={state.rehearsalVenueState}
                            onChange={(e) => handleInputChange("rehearsalVenueState", e.target.value)}
                            className={`block w-full rounded-md shadow-sm border pl-3 pr-10 py-2 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.rehearsalVenueState ? "border-red-500 text-red-900" : "border-gray-300 text-gray-900"
                            } text-center`}
                          >
                            <option value="">Select state</option>
                            {US_STATES.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                        </div>
                      </FormField>
                    </div>

                  {/* ZIP Code */}
                    <div className="grid grid-cols-1 gap-6 w-full">
                  <FormField
                        label={<span className="font-medium text-gray-800">ZIP Code</span>}
                        htmlFor="rehearsalVenueZip"
                    required
                        error={errors.rehearsalVenueZip}
                    className="mb-4"
                  >
                    <div className="w-72 mx-auto">
                      <Input
                            id="rehearsalVenueZip"
                            value={state.rehearsalVenueZip}
                            onChange={(e) => handleInputChange("rehearsalVenueZip", e.target.value)}
                            error={!!errors.rehearsalVenueZip}
                        className="text-center"
                      />
                    </div>
                  </FormField>
                </div>
              </>
            )}
              </div>
            </div>

            {/* Brunch Venue */}
            <div className="mb-8 shadow-lg border-0 bg-white p-8 sm:p-10 md:p-12 rounded-2xl w-full">
              <div className="flex items-center justify-center text-center mb-4 gap-4">
                <div className="flex-shrink-0">
                  <MapPin size={28} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-extrabold leading-tight mb-1">
                    Brunch Venue Information
                  </div>
                  <div className="text-base text-gray-500 font-medium leading-tight">
                    Details about where your brunch will be held
                  </div>
                </div>
              </div>
              <div className="space-y-8 w-full px-2 sm:px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {/* Venue Type */}
            <FormField
                    label={<span className="font-medium text-gray-800">Venue Type</span>}
                    htmlFor="brunchVenueType"
                    required
                    error={errors.brunchVenueType}
                    tooltip="The type of location where your brunch will be held"
                    className="mb-4"
                  >
                    <div className="relative w-72 mx-auto">
                      <select
                        id="brunchVenueType"
                        value={state.brunchVenueType}
                        onChange={(e) => handleInputChange("brunchVenueType", e.target.value)}
                        className={`block w-full rounded-md shadow-sm border pl-3 pr-10 py-2 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.brunchVenueType ? "border-red-500 text-red-900" : "border-gray-300 text-gray-900"
                        } text-center`}
            >
                        <option value="">Select venue type</option>
                        {VENUE_TYPES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                  </FormField>

                  {/* Indoor/Outdoor */}
                  <FormField
                    label={<span className="font-medium text-gray-800">Indoor/Outdoor</span>}
                    htmlFor="brunchVenueIndoorOutdoor"
                    required
                    error={errors.brunchVenueIndoorOutdoor}
                    className="mb-4"
                  >
                    <div className="relative w-72 mx-auto">
                      <select
                        id="brunchVenueIndoorOutdoor"
                        value={state.brunchVenueIndoorOutdoor}
                        onChange={(e) => handleInputChange("brunchVenueIndoorOutdoor", e.target.value)}
                        className={`block w-full rounded-md shadow-sm border pl-3 pr-10 py-2 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.brunchVenueIndoorOutdoor ? "border-red-500 text-red-900" : "border-gray-300 text-gray-900"
                        } text-center`}
                      >
                        <option value="">Select option</option>
                        {INDOOR_OUTDOOR_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                  </FormField>
                </div>

                {/* Venue Name */}
                <FormField
                  label={<span className="font-medium text-gray-800">Venue Name</span>}
                  htmlFor="brunchVenueName"
                  required
                  error={errors.brunchVenueName}
                  className="mb-4"
                >
                  <div className="w-full">
                    <Input
                      id="brunchVenueName"
                      value={state.brunchVenueName}
                      onChange={(e) => handleInputChange("brunchVenueName", e.target.value)}
                      error={!!errors.brunchVenueName}
                      placeholder="Venue Name"
                      className="text-center w-[92%] mx-auto"
                    />
                  </div>
            </FormField>

                {/* Brunch Venue Address Fields */}
                {isBrunchCruiseShip ? (
                  <>
                    <FormField
                      label="Cruise Line"
                      htmlFor="brunchVenueAddress1"
                      required
                      error={errors.brunchVenueAddress1}
                      className="mb-4"
                    >
                      <div className="w-72 mx-auto">
                        <Input
                          id="brunchVenueAddress1"
                          value={state.brunchVenueAddress1}
                          onChange={(e) => handleInputChange("brunchVenueAddress1", e.target.value)}
                          error={!!errors.brunchVenueAddress1}
                          placeholder="e.g., Royal Caribbean"
                          className="text-center"
                        />
          </div>
                    </FormField>
                    <FormField
                      label="Departure Port"
                      htmlFor="brunchVenueCity"
                      required
                      error={errors.brunchVenueCity}
                      className="mb-4"
                    >
                      <div className="w-72 mx-auto">
                        <Input
                          id="brunchVenueCity"
                          value={state.brunchVenueCity}
                          onChange={(e) => handleInputChange("brunchVenueCity", e.target.value)}
                          error={!!errors.brunchVenueCity}
                          placeholder="e.g., Miami, Florida"
                          className="text-center"
                        />
        </div>
                    </FormField>
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <FormField
                      label={<span className="font-medium text-gray-800">Address Line 1</span>}
                      htmlFor="brunchVenueAddress1"
                      required
                      error={errors.brunchVenueAddress1}
                      className="mb-4"
                    >
                      <div className="w-72 mx-auto">
                        <Input
                          id="brunchVenueAddress1"
                          value={state.brunchVenueAddress1}
                          onChange={(e) => handleInputChange("brunchVenueAddress1", e.target.value)}
                          error={!!errors.brunchVenueAddress1}
                          placeholder="Street Address"
                          className="text-center"
                        />
                      </div>
                    </FormField>
                    <FormField
                      label={<span className="font-medium text-gray-800">Address Line 2</span>}
                      htmlFor="brunchVenueAddress2"
                      className="mb-4"
                    >
                      <div className="w-72 mx-auto">
                        <Input
                          id="brunchVenueAddress2"
                          value={state.brunchVenueAddress2}
                          onChange={(e) => handleInputChange("brunchVenueAddress2", e.target.value)}
                          placeholder="Apt, Suite, Building (optional)"
                          className="text-center"
                        />
                      </div>
                    </FormField>
                  </div>
                )}

                {/* City, State, and ZIP only shown for non-cruise ship venues */}
                {!isBrunchCruiseShip && (
                  <>
                    {/* City and State */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <FormField
                        label={<span className="font-medium text-gray-800">City</span>}
                        htmlFor="brunchVenueCity"
                        required
                        error={errors.brunchVenueCity}
                        className="mb-4"
                      >
                        <div className="w-72 mx-auto">
                          <Input
                            id="brunchVenueCity"
                            value={state.brunchVenueCity}
                            onChange={(e) => handleInputChange("brunchVenueCity", e.target.value)}
                            error={!!errors.brunchVenueCity}
                            className="text-center"
                          />
                        </div>
                      </FormField>

                      <FormField
                        label={<span className="font-medium text-gray-800">State</span>}
                        htmlFor="brunchVenueState"
                        required
                        error={errors.brunchVenueState}
                        className="mb-4"
                      >
                        <div className="relative w-72 mx-auto">
                          <select
                            id="brunchVenueState"
                            value={state.brunchVenueState}
                            onChange={(e) => handleInputChange("brunchVenueState", e.target.value)}
                            className={`block w-full rounded-md shadow-sm border pl-3 pr-10 py-2 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.brunchVenueState ? "border-red-500 text-red-900" : "border-gray-300 text-gray-900"
                            } text-center`}
                          >
                            <option value="">Select state</option>
                            {US_STATES.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                        </div>
                      </FormField>
                    </div>

                    {/* ZIP Code */}
                    <div className="grid grid-cols-1 gap-6 w-full">
                      <FormField
                        label={<span className="font-medium text-gray-800">ZIP Code</span>}
                        htmlFor="brunchVenueZip"
                        required
                        error={errors.brunchVenueZip}
                        className="mb-4"
                      >
                        <div className="w-72 mx-auto">
                          <Input
                            id="brunchVenueZip"
                            value={state.brunchVenueZip}
                            onChange={(e) => handleInputChange("brunchVenueZip", e.target.value)}
                            error={!!errors.brunchVenueZip}
                            className="text-center"
                          />
                        </div>
                      </FormField>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
        
        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-10 gap-4 w-full">
          <Button
            variant="outline"
            onClick={handleBack}
            className="w-full sm:w-auto transition-transform duration-150 hover:scale-105"
          >
            Back to Quote
          </Button>
          <Button
            variant="primary"
            onClick={handleContinue}
            className="w-full sm:w-auto transition-transform duration-150 hover:scale-105"
          >
            Continue to Policyholder
          </Button>
        </div>
      </div>

      {/* Standardized QuotePreview positioning: w-80, right-11, mr-2 */}
      <div className="hidden lg:block fixed w-80 right-11 mr-2 top-[260px] z-10">
        <QuotePreview />
      </div>
    </>
  );
}
