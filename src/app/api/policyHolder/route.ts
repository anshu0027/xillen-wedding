import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url, "http://localhost");
    const id = url.searchParams.get("id");
    if (id) {
      const policyHolder = await prisma.policyHolder.findUnique({
        where: { id: Number(id) },
        include: { quote: true },
      });
      if (!policyHolder)
        return NextResponse.json(
          { error: "PolicyHolder not found" },
          { status: 404 }
        );
      return NextResponse.json({ policyHolder });
    }
    // List all policyHolders
    const policyHolders = await prisma.policyHolder.findMany({
      orderBy: { id: "desc" },
      include: { quote: true },
    });
    return NextResponse.json({ policyHolders });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch policyHolders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // TODO: Validate and parse body as per schema.prisma
    return NextResponse.json(
      { error: "Not implemented. Use /quote/step for creation." },
      { status: 501 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create policyHolder" },
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
      { error: "Failed to update policyHolder" },
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
    return NextResponse.json(
      { error: "Not implemented. Use /quote/step for deletion." },
      { status: 501 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete policyHolder" },
      { status: 500 }
    );
  }
}
