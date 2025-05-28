import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url, "http://localhost");
    const id = url.searchParams.get("id");
    if (id) {
      const payment = await prisma.payment.findUnique({
        where: { id: Number(id) },
        include: { policy: { include: { quote: true } } },
      });
      if (!payment)
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 }
        );
      return NextResponse.json({ payment });
    }
    const payments = await prisma.payment.findMany({
      include: { policy: { include: { quote: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ payments });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { amount, policyId, method, status } = await req.json();
    if (!amount || !policyId) {
      return NextResponse.json(
        { error: "Missing amount or policyId" },
        { status: 400 }
      );
    }
    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        policyId: Number(policyId),
        method: method || "Cash",
        status: status || "Completed",
      },
    });
    return NextResponse.json({ payment });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    // TODO: Implement update logic
    return NextResponse.json({ error: "Not implemented." }, { status: 501 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update payment" },
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
    // TODO: Cascade delete as needed
    return NextResponse.json({ error: "Not implemented." }, { status: 501 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 }
    );
  }
}
