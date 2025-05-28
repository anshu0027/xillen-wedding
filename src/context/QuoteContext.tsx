'use client';
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export type GuestRange = '1-50' | '51-100' | '101-150' | '151-200' | '201-250' | '251-300' | '301-350' | '351-400';
export type CoverageLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type LiabilityOption = 'none' | 'option1' | 'option2' | 'option3';

export interface QuoteState {
  // Step 1 - Quote
  residentState: string;
  eventType: string;
  maxGuests: GuestRange | '';
  eventDate: string;
  coverageLevel: CoverageLevel | null;
  liabilityCoverage: LiabilityOption;
  liquorLiability: boolean;
  covidDisclosure: boolean;
  specialActivities: boolean;
  email: string;

  // Quote results
  quoteNumber: string;
  totalPremium: number;
  basePremium: number;
  liabilityPremium: number;
  liquorLiabilityPremium: number;

  // Step 2 - Event Information
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

  // Step 3 - Policy Holder
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

  // Form progression
  step1Complete: boolean;
  step2Complete: boolean;
  step3Complete: boolean;
}

const initialState: QuoteState = {
  // Step 1 - Quote
  residentState: '',
  eventType: '',
  maxGuests: '',
  eventDate: '',
  coverageLevel: null,
  liabilityCoverage: 'none',
  liquorLiability: false,
  covidDisclosure: false,
  specialActivities: false,
  email: '',

  // Quote results
  quoteNumber: '',
  totalPremium: 0,
  basePremium: 0,
  liabilityPremium: 0,
  liquorLiabilityPremium: 0,

  // Step 2 - Event Information
  honoree1FirstName: '',
  honoree1LastName: '',
  honoree2FirstName: '',
  honoree2LastName: '',
  ceremonyLocationType: '',
  indoorOutdoor: '',
  venueName: '',
  venueAddress1: '',
  venueAddress2: '',
  venueCountry: 'United States',
  venueCity: '',
  venueState: '',
  venueZip: '',
  venueAsInsured: false,

  // Step 3 - Policy Holder
  firstName: '',
  lastName: '',
  phone: '',
  relationship: '',
  hearAboutUs: '',
  address: '',
  country: 'United States',
  city: '',
  state: '',
  zip: '',
  legalNotices: false,
  completingFormName: '',

  // Form progression
  step1Complete: false,
  step2Complete: false,
  step3Complete: false,
};

type QuoteAction =
  | { type: 'UPDATE_FIELD'; field: keyof QuoteState; value: any }
  | { type: 'CALCULATE_QUOTE' }
  | { type: 'COMPLETE_STEP'; step: 1 | 2 | 3 }
  | { type: 'RESET_FORM' };

const quoteReducer = (state: QuoteState, action: QuoteAction): QuoteState => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.field]: action.value
      };

    case 'CALCULATE_QUOTE':
      const basePremium = calculateBasePremium(state.coverageLevel);
      const liabilityPremium = calculateLiabilityPremium(state.liabilityCoverage);
      const liquorLiabilityPremium = calculateLiquorLiabilityPremium(
        state.liquorLiability,
        state.maxGuests as GuestRange
      );
      // Generate a unique quote number
      const quoteNumber = getNextQuoteNumber();
      return {
        ...state,
        quoteNumber,
        basePremium,
        liabilityPremium,
        liquorLiabilityPremium,
        totalPremium: basePremium + liabilityPremium + liquorLiabilityPremium
      };

    case 'COMPLETE_STEP':
      if (action.step === 1) {
        return { ...state, step1Complete: true };
      } else if (action.step === 2) {
        return { ...state, step2Complete: true };
      } else {
        return { ...state, step3Complete: true };
      }

    case 'RESET_FORM':
      return initialState;

    default:
      return state;
  }
};

// Helper functions for premium calculations
const calculateBasePremium = (level: CoverageLevel | null): number => {
  if (!level) return 0;

  // Coverage level premium mapping
  const premiumMap: Record<CoverageLevel, number> = {
    1: 160,  // $7,500 coverage
    2: 200,
    3: 250,
    4: 300,
    5: 355,  // $50,000 coverage
    6: 450,
    7: 600,
    8: 750,
    9: 900,
    10: 1025, // $175,000 coverage
  };

  return premiumMap[level] || 0;
};

const calculateLiabilityPremium = (option: LiabilityOption): number => {
  switch (option) {
    case 'option1': // $1M liability with $25K property damage
      return 165;
    case 'option2': // $1M liability with $250K property damage
      return 180;
    case 'option3': // $1M liability with $1M property damage
      return 200;
    default:
      return 0;
  }
};

const calculateLiquorLiabilityPremium = (hasLiquorLiability: boolean, guestRange: GuestRange): number => {
  if (!hasLiquorLiability) return 0;

  // Guest count range premium mapping
  const premiumMap: Record<GuestRange, number> = {
    '1-50': 65,
    '51-100': 65,
    '101-150': 85,
    '151-200': 85,
    '201-250': 100,
    '251-300': 100,
    '301-350': 150,
    '351-400': 150
  };

  return premiumMap[guestRange] || 0;
};

// NOTE: getNextQuoteNumber is ONLY for display purposes and should NOT be used for DB operations.
// For customer: PCI, for admin: QAI. This is only for UI preview, not DB.
const getNextQuoteNumber = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  let seq = 1;
  if (typeof window !== 'undefined') {
    const lastDate = localStorage.getItem('quoteDate');
    let lastSeq = parseInt(localStorage.getItem('quoteSeq') || '0', 10);
    if (lastDate === dateStr) {
      seq = lastSeq + 1;
    }
    localStorage.setItem('quoteDate', dateStr);
    localStorage.setItem('quoteSeq', seq.toString());
  }
  // Default to PCI for customer preview
  return `PCI-${dateStr}-${seq}`;
};

interface QuoteContextType {
  state: QuoteState;
  dispatch: React.Dispatch<QuoteAction>;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export const QuoteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(quoteReducer, initialState);

  return (
    <QuoteContext.Provider value={{ state, dispatch }}>
      {children}
    </QuoteContext.Provider>
  );
};

export const useQuote = (): QuoteContextType => {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
};