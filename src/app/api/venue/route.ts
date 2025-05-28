import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url, "http://localhost");
    const id = url.searchParams.get("id");
    if (id) {
      const venue = await prisma.venue.findUnique({
        where: { id: Number(id) },
        include: { event: true },
      });
      if (!venue)
        return NextResponse.json({ error: "Venue not found" }, { status: 404 });
      return NextResponse.json({ venue });
    }
    // List all venues
    const venues = await prisma.venue.findMany({
      orderBy: { id: "desc" },
      include: { event: true },
    });
    return NextResponse.json({ venues });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch venues" },
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
      { error: "Failed to create venue" },
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
      { error: "Failed to update venue" },
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
      { error: "Failed to delete venue" },
      { status: 500 }
    );
  }
}
