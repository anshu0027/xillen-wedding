import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quoteNumber, forceConvert } = body;

    if (!quoteNumber) {
      return NextResponse.json(
        { error: "Missing quoteNumber" },
        { status: 400 }
      );
    }

    // Find the quote with all related data
    const quote = await prisma.quote.findUnique({
      where: { quoteNumber },
      include: {
        event: { include: { venue: true } },
        policyHolder: true,
        policy: true,
        user: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Check if quote is already converted
    if (quote.convertedToPolicy) {
      return NextResponse.json(
        { error: "Quote is already converted to a policy" },
        { status: 400 }
      );
    }

    // Check if quote is complete
    if (quote.status !== "COMPLETE") {
      return NextResponse.json(
        { error: "Quote must be completed before converting to policy" },
        { status: 400 }
      );
    }

    const isAdminGenerated =
      quoteNumber.startsWith("QI-") &&
      req.headers.get("referer")?.includes("/admin/");

    if (isAdminGenerated && !forceConvert) {
      return NextResponse.json(
        {
          error: "Admin-generated quotes require manual conversion",
          requiresManualConversion: true,
        },
        { status: 400 }
      );
    }

    // Determine prefix
    let policyPrefix = "PCI";
    if (quote.source === "ADMIN") {
      policyPrefix = "PAI";
    }
    const policyNumber = quote.policy
      ? quote.policy.policyNumber
      : `${policyPrefix}-${quote.id}`;

    let updatedPolicy = await prisma.policy.findUnique({
      where: { quoteId: quote.id },
    });

    if (!updatedPolicy) {
      try {
        updatedPolicy = await prisma.policy.create({
          data: {
            policyNumber,
            quoteId: quote.id,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          Array.isArray(error.meta?.target) &&
          error.meta.target.includes("policyNumber")
        ) {
          // Fetch the existing policy and return it
          updatedPolicy = await prisma.policy.findUnique({
            where: { quoteId: quote.id },
          });
          if (updatedPolicy) {
            return NextResponse.json({
              message: "Quote already converted to policy",
              policyNumber: updatedPolicy.policyNumber,
              policy: updatedPolicy,
            });
          }
          return NextResponse.json(
            { error: "Policy number already exists. Please try again." },
            { status: 409 }
          );
        }
        throw error;
      }
    }

    // Update quote status and convertedToPolicy
    await prisma.quote.update({
      where: { quoteNumber },
      data: { status: "COMPLETE", convertedToPolicy: true },
    });

    return NextResponse.json({
      message: "Quote converted to policy successfully",
      policyNumber,
      policy: updatedPolicy,
    });
  } catch (error) {
    console.error("POST /api/quote/convert-to-policy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
