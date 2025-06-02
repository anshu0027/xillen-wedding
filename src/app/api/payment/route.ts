import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url, "http://localhost");
    const id = url.searchParams.get("id"); // payment id (optional)
    const policyId = url.searchParams.get("policyId");
    const quoteId = url.searchParams.get("quoteId");

    if (id) {
      // Fetch payment by payment id (existing logic)
      const payment = await prisma.payment.findUnique({
        where: { id: parseInt(id) }, // Use parseInt for Int IDs
        include: {
          Policy: {
            include: {
              quote: {
                include: {
                  policyHolder: true,
                  event: { include: { venue: true } },
                },
              },
            },
          },
          // Include the direct quote relation as well
          quote: {
            include: {
              policyHolder: true,
              event: { include: { venue: true } },
            },
          },
        },
      });
      if (!payment)
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 }
        );

      // Map status for frontend
      const mappedPayment = {
        ...payment,
        status:
          payment.status === "SUCCESS"
            ? "Completed"
            : payment.status === "FAILED"
              ? "Failed"
              : payment.status,
      };
      return NextResponse.json({ payment: mappedPayment });
    }

    // If policyId or quoteId filter is present, fetch accordingly:
    let payments;
    if (policyId) {
      payments = await prisma.payment.findMany({
        where: { policyId: parseInt(policyId) }, // Use parseInt for Int IDs
        include: {
          Policy: {
            include: {
              quote: {
                include: {
                  policyHolder: true,
                  event: { include: { venue: true } },
                },
              },
            },
          },
          // Include the direct quote relation as well
          quote: {
            include: {
              policyHolder: true,
              event: { include: { venue: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (quoteId) {
      payments = await prisma.payment.findMany({
        where: {
          quoteId: parseInt(quoteId), // Filter directly by Payment.quoteId
        },
        include: {
          Policy: {
            include: {
              quote: {
                include: {
                  policyHolder: true,
                  event: { include: { venue: true } },
                },
              },
            },
          },
          // Include the direct quote relation as well
          quote: {
            include: {
              policyHolder: true,
              event: { include: { venue: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Default: fetch all payments
      payments = await prisma.payment.findMany({
        include: {
          Policy: {
            include: {
              quote: {
                include: {
                  policyHolder: true,
                  event: {
                    include: {
                      venue: true
                    }
                  },
                },
              },
            },
          },
          // Include the direct quote relation as well
          quote: {
            include: {
              policyHolder: true,
              event: { include: { venue: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // Map status for frontend
    const mappedPayments = payments.map((payment) => ({
      ...payment,
      status:
        payment.status === "SUCCESS"
          ? "Completed"
          : payment.status === "FAILED"
            ? "Failed"
            : payment.status,
    }));

    return NextResponse.json({ payments: mappedPayments });
  } catch (error) {
    console.error("GET /api/payment error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      amount,
      quoteId,
      method,
      status, // Expecting "SUCCESS", "PENDING", or "FAILED" from client
      reference, // Matches model field name
    } = body;

    if (!amount || !quoteId || !status) {
      return NextResponse.json(
        { error: "Missing required fields (amount, quoteId, status)" },
        { status: 400 }
      );
    }

    // Validate status against enum
    if (!Object.values(PaymentStatus).includes(status as PaymentStatus)) {
      return NextResponse.json(
        { error: `Invalid payment status: ${status}` },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        quoteId: parseInt(quoteId), // Ensure quoteId is an Int
        method: method || "Online", // Use 'method' from body, matches model
        status: status as PaymentStatus, // Cast to enum type
        reference: reference || null, // Use 'reference' from body, matches model
      },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/payment error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
