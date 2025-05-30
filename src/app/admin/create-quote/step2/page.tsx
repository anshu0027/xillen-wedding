"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CalendarCheck, ChevronDown } from "lucide-react"; // Added ChevronDown
import { useQuote } from "@/context/QuoteContext";
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
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";

const QuotePreview = dynamic(() => import("@/components/ui/QuotePreview"), {
  ssr: false,
});

export default function EventInformation() {
  const router = useRouter();
  const { state, dispatch } = useQuote();
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Replace with real admin auth check
    const isAdminAuthenticated = () => {
      // Use the same key as AdminLayout
      return (
        typeof window !== "undefined" &&
        localStorage.getItem("admin_logged_in") === "true"
      );
    };
    if (!isAdminAuthenticated()) {
      router.replace("/admin/login");
    }
  }, [router]);

  useEffect(() => {
    if (!state.step1Complete) {
      router.replace("/admin/create-quote/step1");
    }
  }, [state.step1Complete, router]);

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
        toast.error(message, {
          variant: "custom",
          className: "bg-white text-red-600",
        });
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
                label={
                  <span className="font-medium">
                    Add this venue as an Additional Insured on my policy
                  </span>
                }
                checked={state.venueAsInsured}
                onChange={(checked) =>
                  handleInputChange("venueAsInsured", checked)
                }
                className="w-full justify-center" // Center the checkbox itself
              />
            </FormField>
          </div>
        </div>
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
