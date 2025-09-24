// app/api/rooms/getId/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { roomInput } = await req.json();
    if (!roomInput) return NextResponse.json({ error: "Missing roomInput" }, { status: 400 });
    console.log("[getId] roomInput:", roomInput);
    // If input already looks like CUID , return directly
    if (roomInput.startsWith("cmf")) return NextResponse.json({ roomId: roomInput });

    const room = await prisma.room.findFirst({
      where: { name: roomInput },
      select: { id: true },
    });
    console.log("[getId] room:", room);
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    
    return NextResponse.json({ roomId: room.id });
  } catch (err: any) {
    console.error("[getId] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
