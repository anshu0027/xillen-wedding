import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url, "http://localhost");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);
    const skip = (page - 1) * pageSize;
    const [policies, total] = await Promise.all([
      prisma.policy.findMany({
        include: { quote: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.policy.count(),
    ]);
    // Flatten the data for the frontend and use the correct prefix (PCI/PAI)
    const policiesWithQuote = policies.map((p) => {
      if (p.quote) {
        return {
          ...p.quote,
          quoteNumber: p.quote.quoteNumber, // Already correct prefix from DB
          policyId: p.id,
          policyCreatedAt: p.createdAt,
          pdfUrl: p.pdfUrl,
        };
      } else {
        // For direct policies with no quote
        return {
          policyId: p.id,
          policyCreatedAt: p.createdAt,
          pdfUrl: p.pdfUrl,
          policyNumber: p.policyNumber,
          // Add any other direct policy fields you want to show
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
    const policyId = url.searchParams.get("policyId");
    if (!policyId) {
      return NextResponse.json({ error: "Missing policyId" }, { status: 400 });
    }
    // Find the policy and related quote
    const policy = await prisma.policy.findUnique({
      where: { id: Number(policyId) },
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
        return NextResponse.json(
          { message: "Policy not found, nothing updated." },
        );
    }
    // If the policy has no related quote, just delete the policy
    if (!policy.quote) {
      const deleted = await prisma.policy.delete({
        where: { id: Number(policyId) },
      });
      return NextResponse.json({
        message: "Policy deleted (no related quote)",
        deleted,
      });
    }
    // Always delete the policy itself first to avoid foreign key constraint errors
    const deleted = await prisma.policy.delete({
      where: { id: Number(policyId) },
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
    console.error("DELETE /api/policy/list error:", error);
    return NextResponse.json(
      { error: "Failed to delete policy" },
      { status: 500 }
    );
  }
}
