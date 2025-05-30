import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url, "http://localhost");
    const id = url.searchParams.get("id");

    const includeFields = {
      // For policies linked via quote (admin flow)
      quote: {
        include: {
          event: {
            include: {
              venue: true
            }
          },
          policyHolder: true,
        },
      },
      // For policies linked directly (customer flow)
      event: {
        include: {
          venue: true
        }
      },
      policyHolder: true,
      payments: true,
    };

    if (id) {
      const policy = await prisma.policy.findUnique({
        where: { id: Number(id) },
        include: includeFields,
      });

      if (!policy) {
        return NextResponse.json(
          {
            error: "Policy not found"
          },
          {
            status: 404
          }
        );
      }

      return NextResponse.json({ policy });
    }

    const policies = await prisma.policy.findMany({
      orderBy: { createdAt: "desc" },
      include: includeFields,
    });

    return NextResponse.json({ policies });
  } catch (error) {
    console.error("GET /api/policy error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch policies"
      },
      {
        status: 500
      }
    );
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Destructure all needed fields explicitly for clarity
    const {
      policyNumber,
      pdfUrl,

      // Event
      eventType,
      eventDate,
      maxGuests,
      honoree1FirstName,
      honoree1LastName,
      honoree2FirstName,
      honoree2LastName,

      // Venue
      venueName,
      venueAddress1,
      venueAddress2,
      venueCountry,
      venueCity,
      venueState,
      venueZip,
      locationType,
      ceremonyLocationType,
      indoorOutdoor,
      venueAsInsured,

      // PolicyHolder
      firstName,
      lastName,
      phone,
      relationship,
      hearAboutUs,
      address,
      country,
      city,
      state,
      zip,
      legalNotices,
      completingFormName,

      // Payment
      paymentAmount,
      paymentStatus,
      paymentMethod,
      paymentReference,
    } = body;

    // Basic validations
    if (!policyNumber)
      return NextResponse.json(
        { error: "policyNumber required" },
        { status: 400 }
      );
    if (!eventType || !eventDate || !maxGuests)
      return NextResponse.json(
        { error: "Incomplete event info" },
        { status: 400 }
      );
    if (
      !venueName ||
      !venueAddress1 ||
      !venueCountry ||
      !venueCity ||
      !venueState ||
      !venueZip
    )
      return NextResponse.json(
        { error: "Incomplete venue info" },
        { status: 400 }
      );
    if (!firstName || !lastName || !phone)
      return NextResponse.json(
        { error: "Incomplete policyholder info" },
        { status: 400 }
      );
    if (!paymentAmount || !paymentStatus)
      return NextResponse.json(
        { error: "Incomplete payment info" },
        { status: 400 }
      );

    // Create Policy + related nested models in one go
    const policy = await prisma.policy.create({
      data: {
        policyNumber,
        pdfUrl,

        event: {
          create: {
            eventType,
            eventDate: new Date(eventDate),
            maxGuests: parseInt(maxGuests),
            honoree1FirstName,
            honoree1LastName,
            honoree2FirstName,
            honoree2LastName,

            venue: {
              create: {
                name: venueName,
                address1: venueAddress1,
                address2: venueAddress2,
                country: venueCountry,
                city: venueCity,
                state: venueState,
                zip: venueZip,
                locationType,
                ceremonyLocationType,
                indoorOutdoor,
                venueAsInsured,
              },
            },
          },
        },

        policyHolder: {
          create: {
            firstName,
            lastName,
            phone,
            relationship,
            hearAboutUs,
            address,
            country,
            city,
            state,
            zip,
            legalNotices,
            completingFormName,
          },
        },

        payments: {
          create: {
            amount: parseFloat(paymentAmount),
            status: paymentStatus, // Must be one of PaymentStatus enum
            method: paymentMethod,
            reference: paymentReference,
          },
        },
      },

      include: {
        event: {
          include: {
            venue: true,
          },
        },
        policyHolder: true,
        payments: true,
      },
    });

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
    const { policyId, ...fields } = body;

    if (!policyId || isNaN(Number(policyId))) {
      return NextResponse.json(
        { error: "Missing or invalid policyId" },
        { status: 400 }
      );
    }
    console.log(policyId)

    const policyRecord = await prisma.policy.findUnique({
      where: { id: Number(policyId) },
      include: {
        quote: {
          include: {
            event: {
              include: {
                venue: true
              }
            }, policyHolder: true
          },
        },
        event: {
          include: {
            venue: true
          }
        },
        policyHolder: true,
      },
    });

    if (!policyRecord) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

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

    const policyBaseData = {
      policyNumber: fields.policyNumber,
      pdfUrl: fields.pdfUrl,
    };

    if (!policyRecord.quote) {
      // Update policy, policyHolder, event, and venue directly
      await prisma.policy.update({
        where: { id: Number(policyId) },
        data: {
          ...policyBaseData,
          policyHolder: {
            upsert: {
              update: policyHolderFields,
              create: policyHolderFields,
            },
          },
          event: {
            upsert: {
              update: {
                ...eventFields,
                venue: {
                  upsert: {
                    update: venueFields,
                    create: venueFields,
                  },
                },
              },
              create: {
                ...eventFields,
                venue: { create: venueFields },
              },
            },
          },
        },
      });
    } else {
      // Update quote flow
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
        status: fields.status ?? "COMPLETE",
        email: fields.email,
        event: {
          upsert: {
            update: {
              ...eventFields,
              venue: {
                upsert: {
                  update: venueFields,
                  create: venueFields,
                },
              },
            },
            create: {
              ...eventFields,
              venue: { create: venueFields },
            },
          },
        },
        policyHolder: {
          upsert: {
            update: policyHolderFields,
            create: policyHolderFields,
          },
        },
      };

      await prisma.policy.update({
        where: { id: Number(policyId) },
        data: policyBaseData,
      });

      await prisma.quote.update({
        where: { id: policyRecord.quote.id },
        data: quoteFields,
      });
    }

    const updated = await prisma.policy.findUnique({
      where: { id: Number(policyId) },
      include: {
        quote: {
          include: {
            event: { include: { venue: true } },
            policyHolder: true,
          },
        },
        event: { include: { venue: true } },
        policyHolder: true,
        payments: true,
      },
    });

    return NextResponse.json({ policy: updated });
  } catch (error) {
    console.error("PUT /api/policy error:", error);
    return NextResponse.json(
      { error: "Failed to update policy" },
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

    const policy = await prisma.policy.findUnique({
      where: { id: Number(id) },
      include: {
        quote: {
          include: {
            event: { include: { venue: true } },
            policyHolder: true,
          },
        },
        event: { include: { venue: true } },
        policyHolder: true,
      },
    });

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    if (!policy.quote) {
      // Delete customer flow policy-related models first
      if (policy.event?.venue) {
        await prisma.venue.delete({ where: { id: policy.event.venue.id } });
      }
      if (policy.event) {
        await prisma.event.delete({ where: { id: policy.event.id } });
      }
      if (policy.policyHolder) {
        await prisma.policyHolder.delete({
          where: { id: policy.policyHolder.id },
        });
      }
    } else {
      // Admin flow delete: quote and nested models
      if (policy.quote.event?.venue) {
        await prisma.venue.delete({
          where: { id: policy.quote.event.venue.id },
        });
      }
      if (policy.quote.event) {
        await prisma.event.delete({ where: { id: policy.quote.event.id } });
      }
      if (policy.quote.policyHolder) {
        await prisma.policyHolder.delete({
          where: { id: policy.quote.policyHolder.id },
        });
      }
      await prisma.quote.delete({ where: { id: policy.quote.id } });
    }

    const deleted = await prisma.policy.delete({ where: { id: Number(id) } });

    return NextResponse.json({
      message: "Policy and related records deleted",
      deletedPolicy: deleted,
    });
  } catch (error) {
    console.error("DELETE /api/policy error:", error);
    return NextResponse.json(
      { error: "Failed to delete policy" },
      { status: 500 }
    );
  }
}

