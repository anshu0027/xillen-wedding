import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url, "http://localhost");
    const id = url.searchParams.get("id");
    if (id) {
      const policy = await prisma.policy.findUnique({
        where: { id: Number(id) },
        include: {
          quote: {
            include: {
              event: { include: { venue: true } },
              policyHolder: true,
            },
          },
          payments: true,
        },
      });
      if (!policy)
        return NextResponse.json(
          { error: "Policy not found" },
          { status: 404 }
        );
      return NextResponse.json({ policy });
    }
    // List all policies
    const policies = await prisma.policy.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        quote: {
          include: { event: { include: { venue: true } }, policyHolder: true },
        },
        payments: true,
      },
    });
    return NextResponse.json({ policies });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch policies" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Required: quoteNumber or all nested data
    const { quoteNumber, ...fields } = body;
    // Split fields for each model
    const policyFields = {};
    const quoteFields = {
      coverageLevel: fields.coverageLevel,
      liabilityCoverage: fields.liabilityCoverage,
      liquorLiability: fields.liquorLiability,
      covidDisclosure: fields.covidDisclosure,
      specialActivities: fields.specialActivities,
      totalPremium: fields.totalPremium,
      basePremium: fields.basePremium,
      liabilityPremium: fields.liabilityPremium,
      liquorLiabilityPremium: fields.liquorLiabilityPremium,
      status: "COMPLETE",
      email: fields.email,
    };
    const eventFields = {
      eventType: fields.eventType,
      eventDate: fields.eventDate ? new Date(fields.eventDate) : undefined,
      maxGuests: fields.maxGuests ? parseInt(fields.maxGuests) : undefined,
    };
    const venueFields = {
      name: fields.venueName,
      address1: fields.venueAddress1,
      address2: fields.venueAddress2,
      country: fields.venueCountry,
      city: fields.venueCity,
      state: fields.venueState,
      zip: fields.venueZip,
      locationType: fields.ceremonyLocationType,
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
        { error: "Missing policyholder details." },
        { status: 400 }
      );
    }
    let policy;
    if (quoteNumber) {
      // Update existing policy and related models
      const quote = await prisma.quote.findUnique({ where: { quoteNumber } });
      if (!quote) {
        return NextResponse.json(
          { error: "Quote not found for policy." },
          { status: 404 }
        );
      }
      policy = await prisma.policy.upsert({
        where: { quoteId: quote.id },
        update: {},
        create: { quoteId: quote.id },
        include: {
          quote: {
            include: {
              event: { include: { venue: true } },
              policyHolder: true,
            },
          },
        },
      });
      // Update related models
      await prisma.quote.update({
        where: { id: quote.id },
        data: {
          ...quoteFields,
          event: {
            upsert: {
              update: {
                ...eventFields,
                venue: { upsert: { update: venueFields, create: venueFields } },
              },
              create: { ...eventFields, venue: { create: venueFields } },
            },
          },
          policyHolder: {
            upsert: {
              update: policyHolderFields,
              create: policyHolderFields,
            },
          },
        },
      });
    } else {
      // Create new quote and policy
      let newQuoteNumber = fields.quoteNumber || "";
      if (!newQuoteNumber.startsWith("POC-")) {
        newQuoteNumber = `POC-${newQuoteNumber.replace(/^POC-/, "")}`;
      }
      const newQuote = await prisma.quote.create({
        data: {
          ...quoteFields,
          quoteNumber: newQuoteNumber,
          event: { create: { ...eventFields, venue: { create: venueFields } } },
          policyHolder: { create: policyHolderFields },
        },
        include: { event: { include: { venue: true } }, policyHolder: true },
      });
      policy = await prisma.policy.create({
        data: { quoteId: newQuote.id },
        include: {
          quote: {
            include: {
              event: { include: { venue: true } },
              policyHolder: true,
            },
          },
        },
      });
    }
    return NextResponse.json({ policy });
  } catch (error) {
    console.error("POST /api/policy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { policyId, quoteNumber, ...fields } = body;
    let policy;
    let updatedPolicy;
    if (policyId) {
      policy = await prisma.policy.findUnique({
        where: { id: Number(policyId) },
        include: { quote: true },
      });
      if (!policy) {
        return NextResponse.json(
          { error: "Policy not found" },
          { status: 404 }
        );
      }
      if (policy.quote) {
        // Update quote and nested models
        await prisma.quote.update({
          where: { id: policy.quote.id },
          data: {
            ...quoteFields,
            event: {
              upsert: {
                update: {
                  ...eventFields,
                  venue: {
                    upsert: { update: venueFields, create: venueFields },
                  },
                },
                create: { ...eventFields, venue: { create: venueFields } },
              },
            },
            policyHolder: {
              upsert: {
                update: policyHolderFields,
                create: policyHolderFields,
              },
            },
          },
        });
      }
      // Always update the policy itself
      await prisma.policy.update({
        where: { id: Number(policyId) },
        data: {
          ...policyFields,
        },
      });
      updatedPolicy = await prisma.policy.findUnique({
        where: { id: Number(policyId) },
        include: {
          quote: {
            include: {
              event: { include: { venue: true } },
              policyHolder: true,
            },
          },
          payments: true,
        },
      });
    } else if (quoteNumber) {
      quote = await prisma.quote.findUnique({
        where: { quoteNumber },
        include: { policy: true },
      });
      if (!quote || !quote.policy) {
        return NextResponse.json(
          { error: "Policy not found for quoteNumber" },
          { status: 404 }
        );
      }
      policy = quote.policy;
      // Update quote and nested models
      await prisma.quote.update({
        where: { id: quote.id },
        data: {
          ...quoteFields,
          event: {
            upsert: {
              update: {
                ...eventFields,
                venue: { upsert: { update: venueFields, create: venueFields } },
              },
              create: { ...eventFields, venue: { create: venueFields } },
            },
          },
          policyHolder: {
            upsert: {
              update: policyHolderFields,
              create: policyHolderFields,
            },
          },
        },
      });
      updatedPolicy = await prisma.policy.findUnique({
        where: { id: policy.id },
        include: {
          quote: {
            include: {
              event: { include: { venue: true } },
              policyHolder: true,
            },
          },
          payments: true,
        },
      });
    }
    return NextResponse.json({ policy: updatedPolicy });
  } catch (error) {
    console.error("PUT /api/policy error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update policy",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url, "http://localhost");
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    // Find the policy and related quote
    const policy = await prisma.policy.findUnique({
      where: { id: Number(id) },
      include: {
        quote: {
          include: {
            event: { include: { venue: true } },
            policyHolder: true,
          },
        },
      },
    });
    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }
    // If the policy has no related quote, just delete the policy
    if (!policy.quote) {
      const deleted = await prisma.policy.delete({ where: { id: Number(id) } });
      return NextResponse.json({
        message: "Policy deleted (no related quote)",
        deleted,
      });
    }
    // Always delete the policy itself first to avoid foreign key constraint errors
    const deleted = await prisma.policy.delete({
      where: { id: Number(id) },
    });
    // Now delete related quote, event, venue, policyHolder if they exist
    if (policy.quote?.event?.venue) {
      await prisma.venue.delete({ where: { id: policy.quote.event.venue.id } });
    }
    if (policy.quote?.event) {
      await prisma.event.delete({ where: { id: policy.quote.event.id } });
    }
    if (policy.quote?.policyHolder) {
      await prisma.policyHolder.delete({
        where: { id: policy.quote.policyHolder.id },
      });
    }
    if (policy.quote) {
      await prisma.quote.delete({ where: { id: policy.quote.id } });
    }
    return NextResponse.json({
      message: "Policy and related records deleted",
      deleted,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete policy" },
      { status: 500 }
    );
  }
}
