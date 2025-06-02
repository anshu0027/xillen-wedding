import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, StepStatus, QuoteSource, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Types from QuoteContext - consider moving to a shared types file
type GuestRange =
  | "1-50"
  | "51-100"
  | "101-150"
  | "151-200"
  | "201-250"
  | "251-300"
  | "301-350"
  | "351-400";
type CoverageLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type LiabilityOption = "none" | "option1" | "option2" | "option3";

// Helper functions for premium calculations (copied from QuoteContext.tsx)
const calculateBasePremium = (
  level: CoverageLevel | null | undefined
): number => {
  if (level === null || level === undefined) return 0;
  // Coverage level premium mapping
  const premiumMap: Record<CoverageLevel, number> = {
    1: 160, // $7,500 coverage
    2: 200,
    3: 250,
    4: 300,
    5: 355, // $50,000 coverage
    6: 450,
    7: 600,
    8: 750,
    9: 900,
    10: 1025, // $175,000 coverage
  };
  return premiumMap[level as CoverageLevel] || 0;
};

const calculateLiabilityPremium = (
  option: LiabilityOption | string | undefined | null
): number => {
  if (option === null || option === undefined) return 0;
  switch (option) {
    case "option1": // $1M liability with $25K property damage
      return 165;
    case "option2": // $1M liability with $250K property damage
      return 180;
    case "option3": // $1M liability with $1M property damage
      return 200;
    default:
      return 0;
  }
};

const calculateLiquorLiabilityPremium = (
  hasLiquorLiability: boolean | undefined,
  guestRange: GuestRange | string | undefined | null
): number => {
  if (!hasLiquorLiability || guestRange === null || guestRange === undefined)
    return 0;
  // Guest count range premium mapping
  const premiumMap: Record<GuestRange, number> = {
    "1-50": 65,
    "51-100": 65,
    "101-150": 85,
    "151-200": 85,
    "201-250": 100,
    "251-300": 100,
    "301-350": 150,
    "351-400": 150,
  };
  return premiumMap[guestRange as GuestRange] || 0;
};

// Helper function for generating quote numbers
function generateQuoteNumber(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
  const year = String(now.getFullYear());
  const dateStr = `${day}${month}${year}`;
  // Generate a 6-digit random number
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `QI-${dateStr}-${randomNumber}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Incoming quote POST:", body);
    // console.time("POST /api/quote/step");
    const {
      step, // Expected: "STEP1", "STEP2", "STEP3", "COMPLETE"
      quoteNumber: rawQuoteNumber,
      source = "CUSTOMER", // Default to CUSTOMER
      // paymentStatus, // Remove paymentStatus from POST logic
      ...fields
    } = body;
    const quoteNumber = rawQuoteNumber === "" ? undefined : rawQuoteNumber;

    // Determine if customer or admin
    const referer = req.headers.get("referer");
    // Admin source is explicitly set or if accessing via /admin/ path
    const isAdminRequest =
      source === "ADMIN" || (referer && referer.includes("/admin/"));
    const effectiveSource = isAdminRequest
      ? QuoteSource.ADMIN
      : QuoteSource.CUSTOMER;
    const isCustomerGenerated = effectiveSource === QuoteSource.CUSTOMER;

    let currentStepStatus: StepStatus;

    if (step && Object.values(StepStatus).includes(step as StepStatus)) {
      currentStepStatus = step as StepStatus;
    } else if (isCustomerGenerated && !quoteNumber) {
      // For new customer quotes, default to STEP1 if not specified.
      currentStepStatus = StepStatus.STEP1;
    } else if (isAdminRequest && !quoteNumber) {
      // Admin creating a new quote, defaults to COMPLETE.
      currentStepStatus = StepStatus.COMPLETE;
    } else if (
      quoteNumber &&
      fields.status &&
      Object.values(StepStatus).includes(fields.status as StepStatus)
    ) {
      // If updating via POST and status is provided in fields
      currentStepStatus = fields.status as StepStatus;
    } else if (quoteNumber) {
      // If updating via POST and no specific step/status sent, assume COMPLETE or keep existing (handled later)
      currentStepStatus = StepStatus.COMPLETE; // Fallback for POST updates if no status sent
    } else {
      return NextResponse.json(
        { error: "Invalid or missing 'step' information." },
        { status: 400 }
      );
    }

    // For Admin: Quote can only be saved/created when step is COMPLETE.
    if (
      isAdminRequest &&
      currentStepStatus !== StepStatus.COMPLETE &&
      !quoteNumber
    ) {
      // Stricter for new admin quotes
      return NextResponse.json(
        { error: "Admin quotes must be created with step COMPLETE." },
        { status: 400 }
      );
    }

    // --- USER HANDLING ---
    let user;
    if (fields.email) {
      user = await prisma.user.findUnique({ where: { email: fields.email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: fields.email,
            firstName: fields.firstName || "",
            lastName: fields.lastName || "",
            phone: fields.phone || "",
          },
        });
      }
    } else {
      return NextResponse.json(
        { error: "Missing user email." },
        { status: 400 }
      );
    }

    // --- FIELD CONVERSION & VALIDATION ---
    function parseLiabilityCoverage(
      val: string | number | undefined | null
    ): number {
      if (
        val === undefined ||
        val === null ||
        val === "none" ||
        isNaN(Number(val))
      )
        return 0;
      return parseFloat(val as string);
    }

    const quoteFields = {
      residentState: fields.residentState,
      email: fields.email,
      coverageLevel:
        fields.coverageLevel !== undefined
          ? parseInt(fields.coverageLevel)
          : undefined,
      liabilityCoverage: parseLiabilityCoverage(fields.liabilityCoverage),
      liquorLiability:
        fields.liquorLiability === "true" || fields.liquorLiability === true,
      covidDisclosure:
        fields.covidDisclosure === "true" || fields.covidDisclosure === true,
      specialActivities:
        fields.specialActivities === "true" ||
        fields.specialActivities === true,
      totalPremium:
        fields.totalPremium !== undefined
          ? parseFloat(fields.totalPremium)
          : undefined,
      basePremium:
        fields.basePremium !== undefined
          ? parseFloat(fields.basePremium)
          : undefined,
      liabilityPremium:
        fields.liabilityPremium !== undefined
          ? parseFloat(fields.liabilityPremium)
          : undefined,
      liquorLiabilityPremium:
        fields.liquorLiabilityPremium !== undefined
          ? parseFloat(fields.liquorLiabilityPremium)
          : undefined,
      source: effectiveSource,
      isCustomerGenerated: isCustomerGenerated,
      status: currentStepStatus, // Set status based on the current step/flow
      user: { connect: { id: user.id } },
    };

    // Event fields
    const eventFields = {
      eventType: fields.eventType,
      eventDate: fields.eventDate ? new Date(fields.eventDate) : new Date(),
      maxGuests: fields.maxGuests ? parseInt(fields.maxGuests.toString()) : 0,
      honoree1FirstName: fields.honoree1FirstName,
      honoree1LastName: fields.honoree1LastName,
      honoree2FirstName: fields.honoree2FirstName,
      honoree2LastName: fields.honoree2LastName,
    };

    const venueFields = {
      name: fields.venueName,
      address1: fields.venueAddress1,
      address2: fields.venueAddress2,
      country: fields.venueCountry,
      city: fields.venueCity,
      state: fields.venueState,
      zip: fields.venueZip,
      ceremonyLocationType: fields.ceremonyLocationType,
      indoorOutdoor: fields.indoorOutdoor,
      venueAsInsured: fields.venueAsInsured,
    };

    const policyHolderFields = {
      firstName: fields.firstName,
      lastName: fields.lastName,
      phone: fields.phone,
      relationship: fields.relationship,
      hearAboutUs: fields.hearAboutUs,
      address: fields.address,
      country: fields.country,
      city: fields.city,
      state: fields.state,
      zip: fields.zip,
      legalNotices: fields.legalNotices,
      completingFormName: fields.completingFormName,
    };

    // Validate required fields (for step 1, only require quote basics)
    if (
      !fields.residentState ||
      !fields.eventType ||
      !fields.maxGuests ||
      !fields.eventDate ||
      !fields.coverageLevel ||
      !fields.email ||
      !fields.covidDisclosure
    ) {
      return NextResponse.json(
        { error: "Missing required quote details." },
        { status: 400 }
      );
    }

    // --- QUOTE CREATE LOGIC ---
    let savedQuote;
    let newQuoteNumberToTry;
    let attempt = 0;
    const maxAttempts = 5;
    let lastError;
    while (attempt < maxAttempts) {
      newQuoteNumberToTry = generateQuoteNumber(); // Use the unified function
      try {
        savedQuote = await prisma.quote.create({
          data: {
            ...quoteFields,
            quoteNumber: newQuoteNumberToTry,
            // Only create event/policyHolder if provided (step 1 may not have all fields)
            ...(fields.eventType && fields.eventDate && fields.maxGuests
              ? {
                event: {
                  create: {
                    ...eventFields,
                    venue: { create: venueFields },
                  },
                },
              }
              : {}),
            ...(fields.firstName && fields.lastName && fields.phone
              ? {
                policyHolder: { create: policyHolderFields },
              }
              : {}),
          },
          include: {
            event: { include: { venue: true } },
            policyHolder: true,
          },
        });
        break; // Success
      } catch (error: any) {
        if (
          error?.code === "P2002" && // Prisma unique constraint violation
          error.meta?.target?.includes("quoteNumber")
        ) {
          attempt++;
          console.warn(
            `Quote number ${newQuoteNumberToTry} collision. Retrying... (${attempt}/${maxAttempts})`
          );
          lastError = error;
          continue; // Retry
        } else {
          throw error;
        }
      }
    }
    if (!savedQuote) {
      throw (
        lastError ||
        new Error("Failed to create quote after multiple attempts.")
      );
    }

    // Return quoteNumber and quote (do not convert to policy here)
    return NextResponse.json({
      message: "Quote saved successfully",
      quoteNumber: savedQuote.quoteNumber,
      quote: savedQuote,
    });
  } catch (error) {
    console.error("POST /api/quote/step error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Incoming quote PUT:", body);
    const {
      quoteNumber,
      step, // Optional: client might send the current step to update status
      source: sourceFromBody,
      // paymentStatus, // paymentStatus is usually handled by payment events or conversion
      ...fields
    } = body;

    if (!quoteNumber) {
      return NextResponse.json(
        { error: "quoteNumber is required to update a quote." },
        { status: 400 }
      );
    }

    const existingQuote = await prisma.quote.findUnique({
      where: { quoteNumber },
      include: {
        event: { include: { venue: true } },
        policyHolder: true,
        user: true,
      },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: `Quote with number ${quoteNumber} not found.` },
        { status: 404 }
      );
    }

    // Determine source and isCustomerGenerated
    const referer = req.headers.get("referer");
    let effectiveSource: QuoteSource;
    if (sourceFromBody) {
      effectiveSource =
        sourceFromBody === "ADMIN" ? QuoteSource.ADMIN : QuoteSource.CUSTOMER;
    } else {
      // If source not in body, derive from existing quote or referer for safety
      effectiveSource =
        existingQuote.source ||
        (referer && referer.includes("/admin/")
          ? QuoteSource.ADMIN
          : QuoteSource.CUSTOMER);
    }
    const isCustomerGeneratedUpdate = effectiveSource === QuoteSource.CUSTOMER;

    // --- USER HANDLING ---
    let userToConnectInfo = { id: existingQuote.userId }; // Default to existing user

    // if (fields.email && fields.email !== existingQuote.user?.email) {
    //   let userForUpdate = await prisma.user.findUnique({
    //     where: { email: fields.email },
    //   });
    //   if (!userForUpdate) {
    //     userForUpdate = await prisma.user.create({
    //       data: {
    //         email: fields.email,
    //         firstName:
    //           fields.firstName || existingQuote.policyHolder?.firstName || "",
    //         lastName:
    //           fields.lastName || existingQuote.policyHolder?.lastName || "",
    //         phone: fields.phone || existingQuote.policyHolder?.phone || "",
    //       },
    //     });
    //   }
    //   userToConnectInfo = { id: userForUpdate.id };
    // } 

    if (fields.email && fields.email !== existingQuote.user?.email) {
      const existingUserWithEmail = await prisma.user.findUnique({
        where: { email: fields.email },
      });

      if (existingUserWithEmail) {
        // Optional: update user's name/phone only if you want to sync
        await prisma.user.update({
          where: { id: existingUserWithEmail.id },
          data: {
            firstName: fields.firstName ?? undefined,
            lastName: fields.lastName ?? undefined,
            phone: fields.phone ?? undefined,
          },
        });

        userToConnectInfo = { id: existingUserWithEmail.id };
      } else {
        // If no match, keep the existing user link
        console.warn(`No user found with email ${fields.email}, keeping existing user.`);
      }
    }


    else if (!existingQuote.userId) {
      // This should not happen if user is always linked. Handle error if necessary.
      console.error(`Quote ${quoteNumber} is missing a user link.`);
      return NextResponse.json(
        { error: "Quote is missing user information." },
        { status: 500 }
      );
    }

    // --- FIELD CONVERSION & VALIDATION (re-use from POST or adapt) ---
    function parseLiabilityCoverage(
      val: string | number | undefined | null
    ): number {
      if (
        val === undefined ||
        val === null ||
        val === "none" ||
        isNaN(Number(val))
      )
        return 0;
      return parseFloat(val as string);
    }

    // Determine the status to update
    let newStatus = existingQuote.status; // Default to existing status
    if (step && Object.values(StepStatus).includes(step as StepStatus)) {
      newStatus = step as StepStatus;
    } else if (
      fields.status &&
      Object.values(StepStatus).includes(fields.status as StepStatus)
    ) {
      newStatus = fields.status as StepStatus;
    }

    const dataToUpdate: Prisma.quoteUpdateInput = {
      user: { connect: userToConnectInfo },
      source: effectiveSource,
      isCustomerGenerated: isCustomerGeneratedUpdate,
      status: newStatus,
    };

    // Selectively add fields to update
    if (fields.residentState !== undefined)
      dataToUpdate.residentState = fields.residentState;
    if (fields.email !== undefined) dataToUpdate.email = fields.email;

    // --- Conditional Premium Recalculation ---
    const needsPremiumRecalculation =
      fields.coverageLevel !== undefined ||
      fields.liabilityCoverage !== undefined ||
      fields.liquorLiability !== undefined ||
      fields.maxGuests !== undefined;

    if (needsPremiumRecalculation) {
      const coverageLevelForCalc =
        fields.coverageLevel !== undefined
          ? parseInt(fields.coverageLevel)
          : existingQuote.coverageLevel;
      const liabilityCoverageForCalc =
        fields.liabilityCoverage !== undefined
          ? String(fields.liabilityCoverage)
          : String(existingQuote.liabilityCoverage);
      const liquorLiabilityForCalc =
        fields.liquorLiability !== undefined
          ? fields.liquorLiability === "true" || fields.liquorLiability === true
          : existingQuote.liquorLiability;

      let maxGuestsForCalc: GuestRange | undefined = undefined;
      const maxGuestsValue =
        fields.maxGuests !== undefined
          ? parseInt(String(fields.maxGuests))
          : existingQuote.event?.maxGuests;

      if (maxGuestsValue !== undefined && maxGuestsValue !== null) {
        if (maxGuestsValue <= 50) maxGuestsForCalc = "1-50";
        else if (maxGuestsValue <= 100) maxGuestsForCalc = "51-100";
        else if (maxGuestsValue <= 150) maxGuestsForCalc = "101-150";
        else if (maxGuestsValue <= 200) maxGuestsForCalc = "151-200";
        else if (maxGuestsValue <= 250) maxGuestsForCalc = "201-250";
        else if (maxGuestsValue <= 300) maxGuestsForCalc = "251-300";
        else if (maxGuestsValue <= 350) maxGuestsForCalc = "301-350";
        else if (maxGuestsValue <= 400) maxGuestsForCalc = "351-400";
      }

      const newBasePremium = calculateBasePremium(
        coverageLevelForCalc as CoverageLevel | null
      );
      const newLiabilityPremium = calculateLiabilityPremium(
        liabilityCoverageForCalc as LiabilityOption | null
      );
      const newLiquorLiabilityPremium = calculateLiquorLiabilityPremium(
        liquorLiabilityForCalc === null ? undefined : liquorLiabilityForCalc,
        maxGuestsForCalc as GuestRange | null
      );
      const newTotalPremium =
        newBasePremium + newLiabilityPremium + newLiquorLiabilityPremium;

      dataToUpdate.coverageLevel = coverageLevelForCalc;
      dataToUpdate.liabilityCoverage = parseLiabilityCoverage(liabilityCoverageForCalc);
      dataToUpdate.liquorLiability = liquorLiabilityForCalc;
      dataToUpdate.basePremium = newBasePremium;
      dataToUpdate.liabilityPremium = newLiabilityPremium;
      dataToUpdate.liquorLiabilityPremium = newLiquorLiabilityPremium;
      dataToUpdate.totalPremium = newTotalPremium;
    }

    if (fields.covidDisclosure !== undefined)
      dataToUpdate.covidDisclosure =
        fields.covidDisclosure === "true" || fields.covidDisclosure === true;
    if (fields.specialActivities !== undefined)
      dataToUpdate.specialActivities =
        fields.specialActivities === "true" ||
        fields.specialActivities === true;

    // Event Data
    const eventDataForUpdate: Partial<Prisma.EventUncheckedUpdateWithoutQuoteInput> =
      {};
    if (fields.eventType !== undefined)
      eventDataForUpdate.eventType = fields.eventType;
    if (fields.eventDate !== undefined)
      eventDataForUpdate.eventDate = new Date(fields.eventDate);
    if (fields.maxGuests !== undefined)
      eventDataForUpdate.maxGuests = parseInt(fields.maxGuests.toString());
    if (fields.honoree1FirstName !== undefined)
      eventDataForUpdate.honoree1FirstName = fields.honoree1FirstName;
    if (fields.honoree1LastName !== undefined)
      eventDataForUpdate.honoree1LastName = fields.honoree1LastName;
    if (fields.honoree2FirstName !== undefined)
      eventDataForUpdate.honoree2FirstName = fields.honoree2FirstName;
    if (fields.honoree2LastName !== undefined)
      eventDataForUpdate.honoree2LastName = fields.honoree2LastName;

    // Venue Data (nested within event)
    const venueDataForUpdate: Partial<Prisma.VenueUncheckedUpdateWithoutEventInput> =
      {};
    if (fields.venueName !== undefined)
      venueDataForUpdate.name = fields.venueName;
    if (fields.venueAddress1 !== undefined)
      venueDataForUpdate.address1 = fields.venueAddress1;
    if (fields.venueAddress2 !== undefined)
      venueDataForUpdate.address2 = fields.venueAddress2;
    if (fields.venueCountry !== undefined)
      venueDataForUpdate.country = fields.venueCountry;
    if (fields.venueCity !== undefined)
      venueDataForUpdate.city = fields.venueCity;
    if (fields.venueState !== undefined)
      venueDataForUpdate.state = fields.venueState;
    if (fields.venueZip !== undefined) venueDataForUpdate.zip = fields.venueZip;
    if (fields.ceremonyLocationType !== undefined)
      venueDataForUpdate.ceremonyLocationType = fields.ceremonyLocationType;
    if (fields.indoorOutdoor !== undefined)
      venueDataForUpdate.indoorOutdoor = fields.indoorOutdoor;
    if (fields.venueAsInsured !== undefined)
      venueDataForUpdate.venueAsInsured =
        typeof fields.venueAsInsured === "boolean"
          ? fields.venueAsInsured
          : fields.venueAsInsured === "true";

    if (
      Object.keys(eventDataForUpdate).length > 0 ||
      Object.keys(venueDataForUpdate).length > 0
    ) {
      dataToUpdate.event = {
        upsert: {
          create: {
            // Provide all required fields for create, falling back to existing or defaults
            eventType:
              fields.eventType ||
              existingQuote.event?.eventType ||
              "DefaultEvent",
            eventDate: fields.eventDate
              ? new Date(fields.eventDate)
              : existingQuote.event?.eventDate || new Date(),
            maxGuests: fields.maxGuests
              ? parseInt(fields.maxGuests.toString())
              : existingQuote.event?.maxGuests || 0,
            honoree1FirstName:
              fields.honoree1FirstName ??
              existingQuote.event?.honoree1FirstName,
            honoree1LastName:
              fields.honoree1LastName ?? existingQuote.event?.honoree1LastName,
            honoree2FirstName:
              fields.honoree2FirstName ??
              existingQuote.event?.honoree2FirstName,
            honoree2LastName:
              fields.honoree2LastName ?? existingQuote.event?.honoree2LastName,
            venue: {
              create: {
                name:
                  fields.venueName ||
                  existingQuote.event?.venue?.name ||
                  "Default Venue",
                address1:
                  fields.venueAddress1 ||
                  existingQuote.event?.venue?.address1 ||
                  "Default Address",
                country:
                  fields.venueCountry ||
                  existingQuote.event?.venue?.country ||
                  "USA",
                city:
                  fields.venueCity ||
                  existingQuote.event?.venue?.city ||
                  "Default City",
                state:
                  fields.venueState ||
                  existingQuote.event?.venue?.state ||
                  "CA",
                zip:
                  fields.venueZip || existingQuote.event?.venue?.zip || "00000",
                ceremonyLocationType:
                  fields.ceremonyLocationType ??
                  existingQuote.event?.venue?.ceremonyLocationType,
                indoorOutdoor:
                  fields.indoorOutdoor ??
                  existingQuote.event?.venue?.indoorOutdoor,
                venueAsInsured:
                  typeof fields.venueAsInsured === "boolean"
                    ? fields.venueAsInsured
                    : fields.venueAsInsured === "true" ||
                    existingQuote.event?.venue?.venueAsInsured ||
                    false,
              },
            },
          },
          update: {
            ...eventDataForUpdate,
            ...(Object.keys(venueDataForUpdate).length > 0 && {
              venue: {
                upsert: {
                  create:
                    venueDataForUpdate as Prisma.VenueCreateWithoutEventInput,
                  update: venueDataForUpdate,
                },
              }, // Simplified, ensure create has all required
            }),
          },
        },
      };
    }

    // PolicyHolder Data
    const policyHolderDataForUpdate: Partial<Prisma.PolicyHolderUncheckedUpdateWithoutQuoteInput> =
      {};
    if (fields.firstName !== undefined)
      policyHolderDataForUpdate.firstName = fields.firstName;
    if (fields.lastName !== undefined)
      policyHolderDataForUpdate.lastName = fields.lastName;
    if (fields.phone !== undefined)
      policyHolderDataForUpdate.phone = fields.phone;
    // ... (add other policyHolder fields similarly)
    if (fields.address !== undefined)
      policyHolderDataForUpdate.address = fields.address;
    if (fields.country !== undefined)
      policyHolderDataForUpdate.country = fields.country;
    if (fields.city !== undefined) policyHolderDataForUpdate.city = fields.city;
    if (fields.state !== undefined)
      policyHolderDataForUpdate.state = fields.state;
    if (fields.zip !== undefined) policyHolderDataForUpdate.zip = fields.zip;
    if (fields.relationship !== undefined)
      policyHolderDataForUpdate.relationship = fields.relationship;
    if (fields.hearAboutUs !== undefined)
      policyHolderDataForUpdate.hearAboutUs = fields.hearAboutUs;
    if (fields.legalNotices !== undefined)
      policyHolderDataForUpdate.legalNotices =
        typeof fields.legalNotices === "boolean"
          ? fields.legalNotices
          : fields.legalNotices === "true";
    if (fields.completingFormName !== undefined)
      policyHolderDataForUpdate.completingFormName = fields.completingFormName;

    // --- QUOTE UPDATE LOGIC ---
    const updatedQuote = await prisma.quote.update({
      where: { quoteNumber },
      data: {
        ...dataToUpdate,
        ...(Object.keys(policyHolderDataForUpdate).length > 0 && {
          policyHolder: {
            upsert: {
              create: {
                // Provide all required fields for create
                firstName:
                  fields.firstName ||
                  existingQuote.policyHolder?.firstName ||
                  "N/A",
                lastName:
                  fields.lastName ||
                  existingQuote.policyHolder?.lastName ||
                  "N/A",
                phone:
                  fields.phone || existingQuote.policyHolder?.phone || "N/A",
                address:
                  fields.address ||
                  existingQuote.policyHolder?.address ||
                  "N/A",
                country:
                  fields.country ||
                  existingQuote.policyHolder?.country ||
                  "USA",
                city: fields.city || existingQuote.policyHolder?.city || "N/A",
                state:
                  fields.state || existingQuote.policyHolder?.state || "CA",
                zip: fields.zip || existingQuote.policyHolder?.zip || "00000",
                relationship:
                  fields.relationship ??
                  existingQuote.policyHolder?.relationship,
                hearAboutUs:
                  fields.hearAboutUs ?? existingQuote.policyHolder?.hearAboutUs,
                legalNotices:
                  typeof fields.legalNotices === "boolean"
                    ? fields.legalNotices
                    : fields.legalNotices === "true" ||
                    existingQuote.policyHolder?.legalNotices ||
                    false,
                completingFormName:
                  fields.completingFormName ??
                  existingQuote.policyHolder?.completingFormName,
              },
              update: policyHolderDataForUpdate,
            },
          },
        }),
      },
      include: {
        event: { include: { venue: true } },
        policyHolder: true,
        policy: true, // Include policy if it's linked
        user: true,
      },
    });

    return NextResponse.json({
      message: "Quote updated successfully",
      quote: updatedQuote,
    });
  } catch (error) {
    console.error("PUT /api/quote/step error:", error);
    return NextResponse.json(
      // @ts-ignore
      {
        error:
          error instanceof Error
            ? error.message
            : "Server error during quote update",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url, "http://localhost");
    const allQuotes = url.searchParams.get("allQuotes");
    const quoteNumber = url.searchParams.get("quoteNumber");
    const id = url.searchParams.get("id");
    const email = url.searchParams.get("email");

    if (quoteNumber) {
      let quote = await prisma.quote.findUnique({
        where: { quoteNumber },
        include: {
          event: { include: { venue: true } },
          policyHolder: true,
          policy: true,
        },
      });
      if (!quote) {
        // Try alternate prefix if not found
        if (quoteNumber.startsWith("PI-")) {
          const altNumber = quoteNumber.replace(/^PI-/, "QI-");
          quote = await prisma.quote.findUnique({
            where: { quoteNumber: altNumber },
            include: {
              event: { include: { venue: true } },
              policyHolder: true,
              policy: true,
            },
          });
        } else if (quoteNumber.startsWith("WI-")) {
          const altNumber = quoteNumber.replace(/^WI-/, "PI-");
          quote = await prisma.quote.findUnique({
            where: { quoteNumber: altNumber },
            include: {
              event: { include: { venue: true } },
              policyHolder: true,
              policy: true,
            },
          });
        }
      }
      if (!quote)
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      return NextResponse.json({ quote });
    }

    if (id) {
      const quote = await prisma.quote.findUnique({
        where: { id: Number(id) },
        include: {
          event: { include: { venue: true } },
          policyHolder: true,
          policy: true,
        },
      });
      if (!quote)
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      return NextResponse.json({ quote });
    }

    if (email) {
      // Find the latest quote for this email (now in quote.email)
      const quote = await prisma.quote.findFirst({
        where: { email },
        orderBy: { createdAt: "desc" },
        include: {
          event: { include: { venue: true } },
          policyHolder: true,
          policy: true,
        },
      });
      if (!quote)
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      return NextResponse.json({ quote });
    }

    if (allQuotes) {
      const quotes = await prisma.quote.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          event: { include: { venue: true } },
          policyHolder: true,
          policy: { include: { payments: true } },
          Payment: true, // Include direct payments associated with the quote
        },
      });
      // Also fetch policies for admin policies table
      const policies = await prisma.policy.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          quote: {
            include: {
              event: { include: { venue: true } },
              policyHolder: true,
            },
          },
        },
      });
      // Flatten policies for table
      const policiesFlat = policies.map((p) => ({
        ...p.quote,
        policyId: p.id,
        policyCreatedAt: p.createdAt,
        status: "COMPLETE", // Set status to COMPLETE for policies
        policyNumber: `POC-${p.quote?.quoteNumber || p.id}`, // Generate policy number with POC prefix
      }));
      return NextResponse.json({ quotes, policies: policiesFlat });
    }

    // For policies, order by event.eventDate
    const policies = await prisma.quote.findMany({
      where: { status: "COMPLETE" },
      orderBy: { event: { eventDate: "desc" } },
      include: {
        event: { include: { venue: true } },
        policyHolder: true,
        policy: true,
      },
    });
    return NextResponse.json({ policies });
  } catch (error) {
    console.error("GET /api/quote/step error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes/policies" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url, "http://localhost");
    const quoteNumber = url.searchParams.get("quoteNumber");

    if (!quoteNumber) {
      return NextResponse.json(
        { error: "Missing quoteNumber" },
        { status: 400 }
      );
    }

    // Find quote and cascade delete related records
    const quote = await prisma.quote.findUnique({
      where: { quoteNumber },
      include: {
        event: { include: { venue: true } },
        policyHolder: true,
        policy: { include: { payments: true } },
      },
    });
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const deletionPromises = [];

    // Stage 1: Delete dependents of related records
    if (quote.policy && quote.policy.payments.length > 0) {
      deletionPromises.push(prisma.payment.deleteMany({ where: { policyId: quote.policy.id } }));
    }
    if (quote.event && quote.event.venue) {
      deletionPromises.push(prisma.venue.delete({ where: { id: quote.event.venue.id } }));
    }

    // Execute Stage 1 deletions in parallel
    if (deletionPromises.length > 0) {
      await Promise.all(deletionPromises);
    }

    // Stage 2: Delete direct related records of the quote
    const directDependentDeletionPromises = [];
    if (quote.policy) {
      directDependentDeletionPromises.push(prisma.policy.delete({ where: { id: quote.policy.id } }));
    }
    if (quote.event) {
      directDependentDeletionPromises.push(prisma.event.delete({ where: { id: quote.event.id } }));
    }
    if (quote.policyHolder) {
      directDependentDeletionPromises.push(prisma.policyHolder.delete({
        where: { id: quote.policyHolder.id },
      }));
    }

    // Execute Stage 2 deletions in parallel
    if (directDependentDeletionPromises.length > 0) {
      await Promise.all(directDependentDeletionPromises);
    }

    // Finally, delete quote
    await prisma.quote.delete({ where: { quoteNumber } });

    return NextResponse.json({ message: "Quote and related records deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/quote/step error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete quote",
      },
      { status: 500 }
    );
  }
}
