import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, StepStatus, QuoteSource } from "@prisma/client";
import { generateUniqueId } from "@/../backend/prismaClient";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Incoming quote POST:", body);
    const {
      step,
      quoteNumber: rawQuoteNumber,
      source = "CUSTOMER",
      paymentStatus,
      ...fields
    } = body;
    const quoteNumber = rawQuoteNumber === "" ? undefined : rawQuoteNumber;

    // Determine if customer or admin
    const referer = req.headers.get("referer");
    const isCustomerGenerated =
      source === "CUSTOMER" || !referer || !referer.includes("/admin/");

    if (step !== "COMPLETE") {
      return NextResponse.json(
        {
          error:
            "Quote can only be saved when step is COMPLETE and payment is successful.",
        },
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
      source: isCustomerGenerated ? QuoteSource.CUSTOMER : QuoteSource.ADMIN,
      status: StepStatus.COMPLETE,
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

    // Validate required fields
    if (
      !eventFields.eventType ||
      !eventFields.eventDate ||
      !eventFields.maxGuests
    ) {
      return NextResponse.json(
        { error: "Missing event details." },
        { status: 400 }
      );
    }
    if (
      !venueFields.name ||
      !venueFields.address1 ||
      !venueFields.country ||
      !venueFields.city ||
      !venueFields.state ||
      !venueFields.zip
    ) {
      return NextResponse.json(
        { error: "Missing venue details." },
        { status: 400 }
      );
    }
    if (
      !policyHolderFields.firstName ||
      !policyHolderFields.lastName ||
      !policyHolderFields.phone
    ) {
      return NextResponse.json(
        { error: "Missing policy holder details." },
        { status: 400 }
      );
    }

    // --- QUOTE CREATE/UPDATE LOGIC ---
    let savedQuote;

    // Ensure email is always defined before any Prisma call
    const safeQuoteFields = {
      ...quoteFields,
      email: quoteFields.email ?? "no-email@example.com", // fallback if missing
    };

    if (quoteNumber) {
      // Check if quote exists
      const existingQuote = await prisma.quote.findUnique({
        where: { quoteNumber },
        include: { event: { include: { venue: true } } },
      });

      if (existingQuote) {
        // Update existing quote
        savedQuote = await prisma.quote.update({
          where: { quoteNumber },
          data: {
            ...safeQuoteFields,
            event: {
              upsert: {
                create: { ...eventFields, venue: { create: venueFields } },
                update: {
                  ...eventFields,
                  venue: existingQuote.event?.venue
                    ? { update: venueFields }
                    : { create: venueFields },
                },
              },
            },
            policyHolder: {
              upsert: {
                create: policyHolderFields,
                update: policyHolderFields,
              },
            },
          },
        });
        // Always fetch the updated quote with all relations for response
        savedQuote = await prisma.quote.findUnique({
          where: { quoteNumber },
          include: {
            event: { include: { venue: true } },
            policyHolder: true,
            policy: true,
          },
        });
      } else {
        // Create new quote with existing number
        savedQuote = await prisma.quote.create({
          data: {
            ...safeQuoteFields,
            quoteNumber,
            event: {
              create: {
                ...eventFields,
                venue: { create: venueFields },
              },
            },
            policyHolder: { create: policyHolderFields },
          },
        });
        // Always fetch the updated quote with all relations for response
        savedQuote = await prisma.quote.findUnique({
          where: { quoteNumber },
          include: {
            event: { include: { venue: true } },
            policyHolder: true,
            policy: true,
          },
        });
      }
    } else {
      // Create new quote with new number
      const prefix = isCustomerGenerated ? "PCI" : "QAI";
      let attempt = 0;
      const maxAttempts = 5;
      let lastError;
      while (attempt < maxAttempts) {
        const newQuoteNumber = generateUniqueId(prefix);
        try {
          savedQuote = await prisma.quote.create({
            data: {
              ...safeQuoteFields,
              quoteNumber: newQuoteNumber,
              event: {
                create: {
                  ...eventFields,
                  venue: { create: venueFields },
                },
              },
              policyHolder: { create: policyHolderFields },
            },
            include: {
              event: { include: { venue: true } },
              policyHolder: true,
            },
          });
          break; // Success
        } catch (error) {
          if (
            error.code === "P2002" &&
            error.meta?.target?.includes("quoteNumber")
          ) {
            attempt++;
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
    }

    // If this is a customer quote with successful payment, convert to policy
    if (isCustomerGenerated && paymentStatus === "SUCCESS") {
      // Call the convert-to-policy endpoint instead of creating policy directly
      const convertResponse = await fetch(
        new URL("/api/quote/convert-to-policy", req.url).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quoteNumber: savedQuote.quoteNumber,
            forceConvert: true, // Force convert since payment is successful
          }),
        }
      );

      if (!convertResponse.ok) {
        throw new Error("Failed to convert quote to policy");
      }

      const { policyNumber, policy } = await convertResponse.json();

      return NextResponse.json({
        message: "Quote saved and converted to policy successfully",
        quoteNumber: savedQuote.quoteNumber,
        policyNumber,
        policy,
        converted: true,
      });
    }

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
      quoteNumber, // Expect quoteNumber to identify the quote to update
      // step, // 'step' might not be relevant for PUT, or could be used to set status
      source = "CUSTOMER", // Default or from payload
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
      include: { event: { include: { venue: true } }, policyHolder: true, user: true },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: `Quote with number ${quoteNumber} not found.` },
        { status: 404 }
      );
    }

    // --- USER HANDLING (similar to POST, in case email is updated) ---
    let user;
    if (fields.email) {
      user = await prisma.user.findUnique({ where: { email: fields.email } });
      if (!user) {
        // If admin is changing email to a new user, create that user.
        // Or, decide if email changes should only link to existing users.
        // For simplicity, let's assume if email is provided, we find or create.
        user = await prisma.user.create({
          data: {
            email: fields.email,
            firstName: fields.firstName || existingQuote.policyHolder?.firstName || "",
            lastName: fields.lastName || existingQuote.policyHolder?.lastName || "",
            phone: fields.phone || existingQuote.policyHolder?.phone || "",
          },
        });
      }
    } else if (existingQuote.user) {
        user = existingQuote.user; // Keep existing user if email not in payload
    } else {
        // This case should ideally not happen if quotes always have users.
        // If it can, handle appropriately, maybe error or use a default.
         return NextResponse.json(
        { error: "User email is missing and no existing user linked to quote." },
        { status: 400 }
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

    const quoteFieldsToUpdate: any = {
      residentState: fields.residentState,
      email: fields.email, // This will be the quote's primary email
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
      source: source === "ADMIN" ? QuoteSource.ADMIN : QuoteSource.CUSTOMER, // Determine source
      status: fields.status || StepStatus.COMPLETE, // Default to COMPLETE or take from payload
      user: { connect: { id: user.id } },
    };

    // Event fields
    const eventFieldsToUpdate = {
      eventType: fields.eventType,
      eventDate: fields.eventDate ? new Date(fields.eventDate) : undefined,
      maxGuests: fields.maxGuests ? parseInt(fields.maxGuests.toString()) : undefined,
      honoree1FirstName: fields.honoree1FirstName,
      honoree1LastName: fields.honoree1LastName,
      honoree2FirstName: fields.honoree2FirstName,
      honoree2LastName: fields.honoree2LastName,
    };

    const venueFieldsToUpdate = {
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

    const policyHolderFieldsToUpdate = {
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

    // --- QUOTE UPDATE LOGIC ---
    const updatedQuote = await prisma.quote.update({
      where: { quoteNumber },
      data: {
        ...quoteFieldsToUpdate,
        event: {
          upsert: { // Use upsert for event and venue if they might not exist (though for an update they should)
            create: { ...eventFieldsToUpdate, venue: { create: venueFieldsToUpdate } },
            update: {
              ...eventFieldsToUpdate,
              venue: existingQuote.event?.venue
                ? { update: venueFieldsToUpdate }
                : { create: venueFieldsToUpdate }, // Should ideally be just update
            },
          },
        },
        policyHolder: {
          upsert: { // Use upsert for policyHolder
            create: policyHolderFieldsToUpdate,
            update: policyHolderFieldsToUpdate,
          },
        },
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
      { error: error instanceof Error ? error.message : "Server error during quote update" },
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
          policy: true,
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
    // Delete payments
    if (quote.policy && quote.policy.payments.length > 0) {
      await prisma.payment.deleteMany({ where: { policyId: quote.policy.id } });
    }
    // Delete policy
    if (quote.policy) {
      await prisma.policy.delete({ where: { id: quote.policy.id } });
    }
    // Delete venue
    if (quote.event && quote.event.venue) {
      await prisma.venue.delete({ where: { id: quote.event.venue.id } });
    }
    // Delete event
    if (quote.event) {
      await prisma.event.delete({ where: { id: quote.event.id } });
    }
    // Delete policyHolder
    if (quote.policyHolder) {
      await prisma.policyHolder.delete({
        where: { id: quote.policyHolder.id },
      });
    }
    // Finally, delete quote
    await prisma.quote.delete({ where: { quoteNumber } });
    return NextResponse.json({ message: "Quote and related records deleted" });
  } catch (error) {
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
