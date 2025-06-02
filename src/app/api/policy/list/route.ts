import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";

import  { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url, "http://localhost");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);
    const skip = (page - 1) * pageSize;

    const [policies, total] = await Promise.all([
      prisma.policy.findMany({
        include: {
          quote: {
            include: {
              policyHolder: true,
              event: true,// Include policyHolder details from the quote
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.policy.count(),
    ]);

    // Format policies for frontend
    const policiesWithQuote = policies.map((p) => {
      if (p.quote) {
        return {
          ...p.quote,
          quoteNumber: p.quote.quoteNumber,
          policyId: p.id,
          policyNumber: p.policyNumber,
          email: p.quote.email,
          policyCreatedAt: p.createdAt,
          pdfUrl: p.pdfUrl,
        };
      } else {
        return {
          policyId: p.id,
          policyCreatedAt: p.createdAt,
          pdfUrl: p.pdfUrl,
          policyNumber: p.policyNumber,
          // Add more direct policy fields here if needed
        };
      }
    });

    return NextResponse.json({ policies: policiesWithQuote, total });
  } catch (error) {
    console.error("GET /api/policy/list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch policies" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url, "http://localhost");
    const policyIdStr = url.searchParams.get("policyId");

    if (!policyIdStr) {
      return NextResponse.json({ error: "Missing policyId" }, { status: 400 });
    }
    const policyId = Number(policyIdStr);
    console.log("Deleting policy with ID:", policyId);

    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
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

    // Helper to safely delete if id exists
    async function safeDelete(tx, modelName: keyof typeof prisma, id?: number) {
      if (id !== undefined && id !== null) {
        await tx[modelName].delete({ where: { id } });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { policyId } });

      await safeDelete(tx, "venue", policy.quote?.event?.venue?.id);
      await safeDelete(tx, "event", policy.quote?.event?.id);
      await safeDelete(tx, "policyHolder", policy.quote?.policyHolder?.id);
      await safeDelete(tx, "quote", policy.quote?.id);

      await tx.policy.delete({ where: { id: policyId } });
    });

    return NextResponse.json({
      message: "Policy and related records deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/policy error:", error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    return NextResponse.json(
      { error: "Failed to delete policy" },
      { status: 500 }
    );
  }
}
