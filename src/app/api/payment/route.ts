import { NextRequest, NextResponse } from "next/server";
import { prisma, PaymentStatus } from "../../../../backend/prismaClient";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url, "http://localhost");
    const id = url.searchParams.get("id"); // payment id (optional)
    const policyId = url.searchParams.get("policyId");
    const quoteId = url.searchParams.get("quoteId");

    if (id) {
      // Fetch payment by payment id (existing logic)
      const payment = await prisma.payment.findUnique({
        where: { id: Number(id) },
        include: {
          policy: {
            include: {
              quote: {
                include: {
                  policyHolder: true, // Include PolicyHolder details
                },
              },
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
        where: { policyId: Number(policyId) },
        include: {
          policy: {
            include: {
              quote: {
                include: {
                  policyHolder: true, // Include PolicyHolder details
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (quoteId) {
      payments = await prisma.payment.findMany({
        where: {
          policy: {
            quoteId: Number(quoteId),
          },
        },
        include: {
          policy: {
            include: {
              quote: {
                include: {
                  policyHolder: true, // Include PolicyHolder details
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Default: fetch all payments
      payments = await prisma.payment.findMany({
        include: {
          policy: {
            include: {
              quote: {
                include: {
                  policyHolder: true, // Include PolicyHolder details
                },
              },
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
      policyId,
      method,
      status, // Expecting "SUCCESS", "PENDING", or "FAILED" from client
      reference,
    } = body;

    if (!amount || !policyId || !status) {
      return NextResponse.json(
        { error: "Missing required fields (amount, policyId, status)" },
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
        policyId: parseInt(policyId),
        method: method || "Online",
        status: status as PaymentStatus, // Cast to enum type
        reference: reference || null,
      },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/payment error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
