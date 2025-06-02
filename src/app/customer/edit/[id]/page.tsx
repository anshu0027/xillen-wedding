"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "@/hooks/use-toast";
import { useQuote, QuoteState } from "@/context/QuoteContext"; // Import QuoteState
import dynamic from 'next/dynamic';

// Step4Form is removed as we navigate to the review page instead.

// Loading component for dynamically imported forms
const StepFormLoading = () => (
    <div className="p-8 text-center text-gray-500">Loading form...</div>
);

const Step1Form = dynamic(() => import('@/components/quote/Step1Form'), { 
    ssr: false, loading: StepFormLoading 
});
const Step2Form = dynamic(() => import('@/components/quote/Step2Form'), { 
    ssr: false, loading: StepFormLoading 
});
const Step3Form = dynamic(() => import('@/components/quote/Step3Form'), { 
    ssr: false, loading: StepFormLoading 
});

// Define an interface for the form state, matching the output of flattenQuote
interface QuoteFormState {
  residentState: string;
  eventType: string;
  eventDate: string;
  maxGuests: string;
  email: string;
  coverageLevel: number | null;
  liabilityCoverage: string;
  liquorLiability: boolean;
  covidDisclosure: boolean;
  specialActivities: boolean;
  honoree1FirstName: string;
  honoree1LastName: string;
  honoree2FirstName: string;
  honoree2LastName: string;
  ceremonyLocationType: string;
  indoorOutdoor: string;
  venueName: string;
  venueAddress1: string;
  venueAddress2: string;
  venueCountry: string;
  venueCity: string;
  venueState: string;
  venueZip: string;
  venueAsInsured: boolean;
  firstName: string;
  lastName: string;
  phone: string;
  relationship: string;
  hearAboutUs: string;
  address: string;
  country: string;
  city: string;
  state: string;
  zip: string;
  legalNotices: boolean;
  completingFormName: string;
  quoteNumber?: string;
  totalPremium?: number | null;
  basePremium?: number | null;
  liabilityPremium?: number | null;
  liquorLiabilityPremium?: number | null;
  status?: string;
}

function flattenQuote(quote: any): QuoteFormState {
  return {
    // Step 1
    residentState: quote.residentState || quote.policyHolder?.state || "",
    eventType: quote.event?.eventType || "",
    eventDate: quote.event?.eventDate || "",
    maxGuests: quote.event?.maxGuests || "",
    email: quote?.email || "",
    coverageLevel: quote.coverageLevel ?? null,
    liabilityCoverage: quote.liabilityCoverage ?? "",
    liquorLiability: quote.liquorLiability ?? false,
    covidDisclosure: quote.covidDisclosure ?? false,
    specialActivities: quote.specialActivities ?? false,
    // Step 2
    honoree1FirstName: quote.event?.honoree1FirstName || "",
    honoree1LastName: quote.event?.honoree1LastName || "",
    honoree2FirstName: quote.event?.honoree2FirstName || "",
    honoree2LastName: quote.event?.honoree2LastName || "",
    ceremonyLocationType: quote.event.venue?.ceremonyLocationType || "",
    indoorOutdoor: quote.event.venue?.indoorOutdoor || "",
    venueName: quote.event?.venue?.name || "",
    venueAddress1: quote.event?.venue?.address1 || "",
    venueAddress2: quote.event?.venue?.address2 || "",
    venueCountry: quote.event?.venue?.country || "",
    venueCity: quote.event?.venue?.city || "",
    venueState: quote.event?.venue?.state || "",
    venueZip: quote.event?.venue?.zip || "",
    venueAsInsured: quote.event?.venue?.venueAsInsured || false,
    // Step 3
    firstName: quote.policyHolder?.firstName || "",
    lastName: quote.policyHolder?.lastName || "",
    phone: quote.policyHolder?.phone || "",
    relationship: quote.policyHolder?.relationship || "",
    hearAboutUs: quote.policyHolder?.hearAboutUs || "",
    address: quote.policyHolder?.address || "",
    country: quote.policyHolder?.country || "",
    city: quote.policyHolder?.city || "",
    state: quote.policyHolder?.state || "",
    zip: quote.policyHolder?.zip || "",
    legalNotices: quote.policyHolder?.legalNotices || false,
    completingFormName: quote.policyHolder?.completingFormName || "",
    // Other fields
    quoteNumber: quote.quoteNumber,
    totalPremium: quote.totalPremium,
    basePremium: quote.basePremium,
    liabilityPremium: quote.liabilityPremium,
    liquorLiabilityPremium: quote.liquorLiabilityPremium,
    status: quote.status,
  };
}

export default function EditUserQuote() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState<QuoteFormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showQuoteResults, setShowQuoteResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For initial data load
  const { dispatch } = useQuote(); // Use dispatch from context

  useEffect(() => {
    async function fetchQuote() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/quote/step?quoteNumber=${id}`);
        if (res.ok) {
          const data = await res.json();
          const flatQuote = flattenQuote(data.quote);
          setFormState(flatQuote);
          // Dispatch action to update context state
          dispatch({
            type: "SET_ENTIRE_QUOTE_STATE",
            payload: flatQuote as Partial<QuoteState>,
          });
          // Mark as retrieved quote
          if (typeof window !== "undefined") {
            localStorage.setItem("retrievedQuote", "true");
          }
        } else {
          toast({
            title: "Failed to load quote.",
            description: "Please try again later.",
            variant: "destructive",
          });
          router.push("/"); // Redirect if quote can't be loaded
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuote();
  }, [id, dispatch, router]); // Add dispatch to dependency array

  // Skeleton Loader Component
  const EditUserQuoteSkeleton = () => (
    <div className="p-6 m-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-6 gap-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div> {/* Title */}
        <div className="h-10 bg-gray-200 rounded-md w-full sm:w-36"></div> {/* Back Button */}
      </div>
      {/* Stepper Skeleton */}
      <div className="mb-8 flex flex-row justify-center max-w-4xl mx-auto items-center gap-2 sm:gap-3 md:gap-10">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded-full flex-1 min-w-0 md:flex-initial md:w-48"></div>
        ))}
      </div>
      {/* Form Area Skeleton */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div> {/* Form Title (conceptual) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => ( // Generic form fields
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div> {/* Label */}
              <div className="h-10 bg-gray-200 rounded-md"></div> {/* Input */}
            </div>
          ))}
        </div>
        <div className="mt-8 h-12 bg-gray-200 rounded-md w-1/3 ml-auto"></div> {/* Save/Continue Button */}
      </div>
    </div>
  );

  if (isLoading || !formState) return <EditUserQuoteSkeleton />;

  const handleInputChange = (field: string, value: any) => {
    setFormState((prev: QuoteFormState | null) => ({
      ...(prev as QuoteFormState),
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formState?.residentState) newErrors.residentState = "Required";
    if (!formState?.eventType) newErrors.eventType = "Required";
    if (!formState?.maxGuests) newErrors.maxGuests = "Required";
    if (!formState?.email) newErrors.email = "Required";
    if (!formState?.eventDate) newErrors.eventDate = "Required";
    if (!formState?.coverageLevel) newErrors.coverageLevel = "Required";
    if (
      formState?.covidDisclosure === undefined ||
      formState?.covidDisclosure === null
    )
      newErrors.covidDisclosure = "Required"; // Check for boolean presence
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formState.honoree1FirstName) newErrors.honoree1FirstName = "Required";
    if (!formState.honoree1LastName) newErrors.honoree1LastName = "Required";
    if (!formState.ceremonyLocationType)
      newErrors.ceremonyLocationType = "Required";
    if (!formState.indoorOutdoor) newErrors.indoorOutdoor = "Required";
    if (!formState.venueName) newErrors.venueName = "Required";
    if (!formState.venueAddress1) newErrors.venueAddress1 = "Required";
    if (!formState.venueCountry) newErrors.venueCountry = "Required";
    if (!formState.venueCity) newErrors.venueCity = "Required";
    if (!formState.venueState) newErrors.venueState = "Required";
    if (!formState.venueZip) newErrors.venueZip = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!formState.firstName) newErrors.firstName = "Required";
    if (!formState.lastName) newErrors.lastName = "Required";
    if (!formState.phone) newErrors.phone = "Required";
    if (!formState.relationship) newErrors.relationship = "Required";
    if (!formState.address) newErrors.address = "Required";
    if (!formState.city) newErrors.city = "Required";
    if (!formState.state) newErrors.state = "Required";
    if (!formState.zip) newErrors.zip = "Required";
    if (!formState.legalNotices) newErrors.legalNotices = "Required";
    if (!formState.completingFormName)
      newErrors.completingFormName = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveCurrentStepData = async (currentStepNumForValidation: number) => {
    let valid = false;
    if (currentStepNumForValidation === 1) valid = validateStep1();
    else if (currentStepNumForValidation === 2) valid = validateStep2();
    else if (currentStepNumForValidation === 3) valid = validateStep3();

    if (!valid) {
      toast({
        title: "Please fix errors before saving.",
        description: "",
        variant: "destructive",
      });
      return false;
    }

    const payload = {
      ...formState,
      quoteNumber: id,
      step: formState.status || "INCOMPLETE", // Send current status or a default
      source: "CUSTOMER_EDIT_SAVE_STEP",
    };

    const res = await fetch("/api/quote/step", {
      method: "PUT", // Changed to PUT for updating
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      toast({
        title: "Quote progress saved!",
        description: "",
        variant: "default",
      });
      const updatedStateFromSave = flattenQuote(data.quote);
      setFormState(updatedStateFromSave);
      // Dispatch action to update context state
      dispatch({
        type: "SET_ENTIRE_QUOTE_STATE",
        payload: updatedStateFromSave as Partial<QuoteState>,
      });
      return true;
    } else {
      const data = await res.json();
      toast({
        title: "Failed to update quote: " + (data.error || "Unknown error"),
        description: "",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleProceedToReview = async () => {
    if (!validateStep1()) {
      setStep(1);
      toast({
        title: "Please complete Step 1 correctly.",
        variant: "destructive",
      });
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      toast({
        title: "Please complete Step 2 correctly.",
        variant: "destructive",
      });
      return;
    }
    if (!validateStep3()) {
      setStep(3);
      toast({
        title: "Please complete Step 3 correctly.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...formState,
      quoteNumber: id,
      step: "COMPLETE", // Mark as complete for review
      source: "CUSTOMER_EDIT_FINALIZED",
    };

    const res = await fetch("/api/quote/step", {
      method: "PUT", // Changed to PUT for updating
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      const finalQuoteState = flattenQuote(data.quote);
      setFormState(finalQuoteState);
      // Dispatch action to update context state
      dispatch({
        type: "SET_ENTIRE_QUOTE_STATE",
        payload: finalQuoteState as Partial<QuoteState>,
      });
      localStorage.setItem("quoteNumber", id); // Ensure review page can pick up quote number
      router.push("/customer/review");
    } else {
      const data = await res.json();
      toast({
        title:
          "Failed to finalize quote for review: " +
          (data.error || "Unknown error"),
        variant: "destructive",
      });
    }
  };

  const handleStep1Continue = async () => {
    if (validateStep1()) {
      if (!showQuoteResults && formState.eventType) {
        // Check if eventType is selected, as an indicator for readiness to calculate
        toast({
          title: "Please calculate the quote first (button in Step 1).",
          variant: "default",
        });
        return;
      }
      const saved = await saveCurrentStepData(1);
      if (saved) setStep(2);
    }
  };

  const handleStep2Continue = async () => {
    if (validateStep2()) {
      const saved = await saveCurrentStepData(2);
      if (saved) setStep(3);
    }
  };

  // Called by Step1Form after it calculates quote and updates parent formState via onChange
  const handleStep1QuoteCalculated = async () => {
    setShowQuoteResults(true);
    await saveCurrentStepData(1); // Save the state that now includes premiums
  };

  return (
    <div className="p-6 m-auto">
      <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl text-center sm:text-left font-bold text-gray-900 order-1 sm:order-none">
          Edit Your Quote
        </h1>
        <Button
          className="w-full sm:w-auto order-2 sm:order-none"
          variant="outline"
          size="sm"
          onClick={() => router.push("/")}
        >
          Back to Home
        </Button>
      </div>
      <div className="mb-8 flex flex-row justify-center max-w-4xl mx-auto items-center gap-2 sm:gap-3 md:gap-10">
        {[
          { label: "Step 1", stepNum: 1 },
          { label: "Step 2", stepNum: 2 },
          { label: "Step 3", stepNum: 3 },
          { label: "Review & Pay", stepNum: 4 }, // Conceptual step 4 for the button
        ].map((s_item) => (
          <Button
            key={s_item.stepNum}
            className="flex-1 min-w-0 text-center rounded-full md:flex-initial md:w-48"
            variant={
              step === s_item.stepNum && s_item.stepNum !== 4
                ? "default"
                : "outline"
            }
            onClick={() => {
              if (s_item.stepNum === 4) {
                handleProceedToReview();
              } else {
                setStep(s_item.stepNum);
              }
            }}
          >
            {s_item.label}
          </Button>
        ))}
      </div>
      {step === 1 && (
        <Step1Form
          state={formState}
          errors={errors}
          onChange={handleInputChange}
          onValidate={validateStep1}
          onContinue={handleStep1Continue}
          showQuoteResults={showQuoteResults}
          handleCalculateQuote={handleStep1QuoteCalculated} // Renamed prop, Step1Form calls this after its internal calculation and state update
          onSave={() => saveCurrentStepData(1)}
          isCustomerEdit={true}
        />
      )}
      {step === 2 && (
        <Step2Form
          state={formState}
          errors={errors}
          onChange={handleInputChange}
          onValidate={validateStep2}
          onContinue={handleStep2Continue}
          onSave={() => saveCurrentStepData(2)}
        />
      )}
      {step === 3 && (
        <Step3Form
          state={formState}
          errors={errors}
          onChange={handleInputChange}
          onValidate={validateStep3}
          onContinue={handleProceedToReview}
          onSave={() => saveCurrentStepData(3)}
        />
      )}
    </div>
  );
}
