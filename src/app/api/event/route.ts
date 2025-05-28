import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url, "http://localhost");
    const id = url.searchParams.get("id");
    if (id) {
      const event = await prisma.event.findUnique({
        where: { id: Number(id) },
        include: { venue: true, quote: true },
      });
      if (!event)
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      return NextResponse.json({ event });
    }
    // List all events
    const events = await prisma.event.findMany({
      orderBy: { eventDate: "desc" },
      include: { venue: true, quote: true },
    });
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch events" },
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
      { error: "Failed to create event" },
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
      { error: "Failed to update event" },
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
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
