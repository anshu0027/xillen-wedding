"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CalendarCheck, ChevronDown } from "lucide-react"; // Added ChevronDown
import { QuoteState, useQuote } from "@/context/QuoteContext";
import { Button } from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import {
  VENUE_TYPES,
  INDOOR_OUTDOOR_OPTIONS,
  COUNTRIES,
  US_STATES,
} from "@/utils/constants";
import { isEmpty, isValidZip } from "@/utils/validators";
import dynamic from "next/dynamic";
// import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";

const QuotePreview = dynamic(() => import("@/components/ui/QuotePreview"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg shadow">
      <p className="text-gray-500">Loading Preview...</p>
    </div>
  ),
});

// Skeleton Component for Step 2
const EventInformationSkeleton = () => (
  <div className="w-full pb-12 animate-pulse">
    {/* Honoree Information Skeleton */}
    <div className="mb-10 shadow-2xl border-0 bg-gray-100 p-8 sm:p-10 md:p-12 rounded-2xl w-full">
      <div className="flex items-center justify-center text-center mb-6 gap-4">
        <div className="h-9 w-9 bg-gray-300 rounded-full"></div>
        <div>
          <div className="h-6 bg-gray-300 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-64"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-5 bg-gray-300 rounded w-1/3 mx-auto mb-3"></div> {/* Honoree Title */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/4 mx-auto"></div> {/* Label */}
              <div className="h-10 bg-gray-200 rounded w-72 mx-auto"></div> {/* Input */}
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/4 mx-auto"></div> {/* Label */}
              <div className="h-10 bg-gray-200 rounded w-72 mx-auto"></div> {/* Input */}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Venue Information Skeleton */}
    <div className="mb-8 shadow-lg border-0 bg-gray-100 p-8 sm:p-10 md:p-12 rounded-2xl w-full">
      <div className="flex items-center justify-center text-center mb-6 gap-4">
        <div className="h-9 w-9 bg-gray-300 rounded-full"></div>
        <div>
          <div className="h-6 bg-gray-300 rounded w-56 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-72"></div>
        </div>
      </div>
      <div className="space-y-8 w-full px-2 sm:px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/4 mx-auto"></div> {/* Label */}
              <div className="h-10 bg-gray-200 rounded w-72 mx-auto"></div> {/* Select */}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-1/4 mx-auto"></div> {/* Label */}
          <div className="h-10 bg-gray-200 rounded w-[92%] mx-auto"></div> {/* Input */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {[...Array(4)].map((_, i) => ( // For Address, City, State, Zip pairs
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/4 mx-auto"></div> {/* Label */}
              <div className="h-10 bg-gray-200 rounded w-72 mx-auto"></div> {/* Input/Select */}
            </div>
          ))}
        </div>
        <div className="h-10 bg-gray-200 rounded w-3/4 mx-auto mt-4"></div> {/* Checkbox */}
      </div>
    </div>

    {/* Buttons Skeleton */}
    <div className="flex flex-col sm:flex-row justify-between items-center mt-10 gap-4 w-full">
      <div className="h-12 bg-gray-200 rounded w-full sm:w-40"></div>
      <div className="h-12 bg-gray-300 rounded w-full sm:w-48"></div>
    </div>
  </div>
);

export default function EventInformation() {
  const router = useRouter();
  const { state, dispatch } = useQuote();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    // Replace with real admin auth check
    const isAdminAuthenticated = () => {
      // Use the same key as AdminLayout
      return (
        typeof window !== "undefined" &&
        localStorage.getItem("admin_logged_in") === "true"
      );
    };

    // Simulate page readiness and perform checks
    const timer = setTimeout(() => {
      if (!isAdminAuthenticated()) {
        router.replace("/admin/login");
        return; // Stop further execution if redirecting
      }
      if (!state.step1Complete) {
        router.replace("/admin/create-quote/step1");
        return; // Stop further execution if redirecting
      }
      setPageReady(true); // Page is ready to be displayed
    }, 300); // Short delay to make skeleton visible for demo purposes

    return () => clearTimeout(timer);
  }, [router, state.step1Complete]); // state.step1Complete is a dependency

  const handleInputChange = (
    field: keyof QuoteState,
    value: string | boolean
  ) => {
    // Ensure pageReady is true before allowing input changes if needed,
    // though typically inputs would be disabled or not present if !pageReady
    // For this setup, direct interaction implies pageReady is true.
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
    if (isEmpty(state.honoree1FirstName))
      newErrors.honoree1FirstName = "Please enter the first name";
    if (isEmpty(state.honoree1LastName))
      newErrors.honoree1LastName = "Please enter the last name";
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
    router.push("/admin/create-quote/step1");
  };

  const handleContinue = () => {
    if (validateForm()) {
      dispatch({ type: "COMPLETE_STEP", step: 2 });
      router.push("/admin/create-quote/step3");
    } else {
      // Show toast for each missing field
      Object.entries(errors).forEach(([field, message]) => {
        toast.error(message);
      });
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

  if (!pageReady) {
    return <EventInformationSkeleton />;
  }

  return (
    <>
      {/* Outermost div simplified: max-width, margins, horizontal padding, and top margin are now handled by CreateQuoteLayout.tsx */}
      <div className="w-full pb-12">
        {" "}
        {/* Retain bottom padding, or manage spacing within sections */}
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
                  <Input
                    id="honoree1FirstName"
                    value={state.honoree1FirstName}
                    onChange={(e) =>
                      handleInputChange("honoree1FirstName", e.target.value)
                    }
                    error={!!errors.honoree1FirstName}
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
                  <Input
                    id="honoree1LastName"
                    value={state.honoree1LastName}
                    onChange={(e) =>
                      handleInputChange("honoree1LastName", e.target.value)
                    }
                    error={!!errors.honoree1LastName}
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
                  <Input
                    id="honoree2FirstName"
                    value={state.honoree2FirstName}
                    onChange={(e) =>
                      handleInputChange("honoree2FirstName", e.target.value)
                    }
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
                  <Input
                    id="honoree2LastName"
                    value={state.honoree2LastName}
                    onChange={(e) =>
                      handleInputChange("honoree2LastName", e.target.value)
                    }
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
                Ceremony Venue Information
              </div>
              <div className="text-base text-gray-500 font-medium leading-tight">
                Details about where your event will be held
              </div>
            </div>
          </div>
          <div className="space-y-8 w-full px-2 sm:px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <FormField
                label={
                  <span className="font-medium text-gray-800">Venue Type</span>
                }
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
                    onChange={(e) =>
                      handleInputChange("ceremonyLocationType", e.target.value)
                    }
                    className={`block w-full rounded-md shadow-sm pl-3 pr-10 py-2 text-base border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.ceremonyLocationType
                        ? "border-red-500 text-red-900"
                        : "border-gray-300 text-gray-900"
                    } text-center`}
                  >
                    <option value="">Select venue type</option>
                    {VENUE_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    size={16}
                  />
                </div>
              </FormField>
              <FormField
                label={
                  <span className="font-medium text-gray-800">
                    Indoor/Outdoor
                  </span>
                }
                htmlFor="indoorOutdoor"
                required
                error={errors.indoorOutdoor}
                className="mb-4"
              >
                <div className="relative w-72 mx-auto">
                  <select
                    id="indoorOutdoor"
                    value={state.indoorOutdoor}
                    onChange={(e) =>
                      handleInputChange("indoorOutdoor", e.target.value)
                    }
                    className={`block w-full rounded-md shadow-sm pl-3 pr-10 py-2 text-base border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.indoorOutdoor
                        ? "border-red-500 text-red-900"
                        : "border-gray-300 text-gray-900"
                    } text-center`}
                  >
                    <option value="">Select option</option>
                    {INDOOR_OUTDOOR_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    size={16}
                  />
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
                <Input
                  id="venueName"
                  value={state.venueName}
                  onChange={(e) =>
                    handleInputChange("venueName", e.target.value)
                  }
                  error={!!errors.venueName}
                  placeholder={isCruiseShip ? "Cruise Ship Name" : "Venue Name"}
                  className="text-center w-[92%] mx-auto"
                />
              </div>
            </FormField>

            {/* Cruise ship conditionals */}
            {isCruiseShip ? (
              <>
                <FormField
                  label={
                    <span className="font-medium text-gray-800">
                      Cruise Line
                    </span>
                  }
                  htmlFor="venueAddress1" // Was venueName, now for Cruise Line
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
                  label={
                    <span className="font-medium text-gray-800">
                      Departure Port
                    </span>
                  }
                  htmlFor="venueCity" // Using venueCity for Departure Port
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

            {/* Country, City, State are only relevant if not a cruise ship */}
            {!isCruiseShip && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <FormField
                    label={
                      <span className="font-medium text-gray-800">Country</span>
                    }
                    htmlFor="venueCountry"
                    required
                    className="mb-4"
                  >
                    <div className="relative w-72 mx-auto">
                      <select
                        id="venueCountry"
                        value={state.venueCountry}
                        onChange={(e) =>
                          handleInputChange("venueCountry", e.target.value)
                        }
                        className={`block w-full rounded-md shadow-sm pl-3 pr-10 py-2 text-base border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.venueCountry
                            ? "border-red-500 text-red-900"
                            : "border-gray-300 text-gray-900"
                        } text-center`}
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                        size={16}
                      />
                    </div>
                  </FormField>
                  <FormField
                    label={
                      <span className="font-medium text-gray-800">City</span>
                    }
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
                        className="text-center"
                      />
                    </div>
                  </FormField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <FormField
                    label={
                      <span className="font-medium text-gray-800">State</span>
                    }
                    htmlFor="venueState"
                    required
                    error={errors.venueState}
                    className="mb-4"
                  >
                    <div className="relative w-72 mx-auto">
                      <select
                        id="venueState"
                        value={state.venueState}
                        onChange={(e) =>
                          handleInputChange("venueState", e.target.value)
                        }
                        className={`block w-full rounded-md shadow-sm pl-3 pr-10 py-2 text-base border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.venueState
                            ? "border-red-500 text-red-900"
                            : "border-gray-300 text-gray-900"
                        } text-center`}
                      >
                        <option value="">Select state</option>
                        {US_STATES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                        size={16}
                      />
                    </div>
                  </FormField>
                  <FormField
                    label={
                      <span className="font-medium text-gray-800">
                        ZIP Code
                      </span>
                    }
                    htmlFor="venueZip"
                    required
                    error={errors.venueZip}
                    className="mb-4"
                  >
                    <div className="w-72 mx-auto">
                      <Input
                        id="venueZip"
                        value={state.venueZip}
                        onChange={(e) =>
                          handleInputChange("venueZip", e.target.value)
                        }
                        error={!!errors.venueZip}
                        className="text-center"
                      />
                    </div>
                  </FormField>
                </div>
              </>
            )}
            <FormField
              label="" // Label provided by Checkbox component
              htmlFor="venueAsInsured"
              className="mb-4" // Keep some margin
            >
              <Checkbox
                id="venueAsInsured"
                label="Add this venue as an Additional Insured on my policy"
                checked={state.venueAsInsured}
                onChange={(checked) =>
                  handleInputChange("venueAsInsured", checked)
                }
                className="w-full justify-center" // Center the checkbox itself
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
      <div className="hidden lg:block fixed w-80 right-11 mr-2 top-[260px] z-10">
        <QuotePreview />
      </div>
    </>
  );
}
