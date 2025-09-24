// app/api/rooms/join/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

const JoinRoomBody = z.object({
  roomId: z
    .string()
    .trim()
    .min(3, "name must be at least 3 characters")
    .max(30, "name must be 30 characters or less")
    // allow letters, numbers, dash, underscore, dots — adjust as you like
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "name can only contain letters, numbers and underscore."
    )
    .optional(), // user can provide ID
  roomName: z
    .string()
    .trim()
    .min(3, "name must be at least 3 characters")
    .max(30, "name must be 30 characters or less")
    // allow letters, numbers, dash, underscore, dots — adjust as you like
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "name can only contain letters, numbers and underscore."
    )
    .optional(), // or name
});

export async function POST(req: Request) {
  try {
    console.log("[/api/rooms/join] called");
    // 1) Check authentication
    const session: Session | null = await getServerSession(authOptions as any);
    if (!session?.user?.id) {
      console.warn("[/api/rooms/join] unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    console.log("[/api/rooms/join] userId:", userId);

    // 2) Parse & validate request body
    const body = await req.json().catch(() => ({}));
    console.log("[/api/rooms/join] body:", body);
    const parsed = JoinRoomBody.safeParse(body);
    if (!parsed.success) {
      console.warn("[/api/rooms/join] invalid body:", parsed.error.issues);
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 422 }
      );
    }

    const { roomId, roomName } = parsed.data;
    if (!roomId && !roomName) {
      console.warn("[/api/rooms/join] missing roomId and roomName");
      return NextResponse.json(
        { error: "roomId or roomName required" },
        { status: 400 }
      );
    }

    // 3) Find the room (search by id first, then name)
    let room = null;
    if (roomId) {
      room = await prisma.room.findUnique({ where: { id: roomId } });
      console.log("[/api/rooms/join] lookup by id:", roomId, "->", !!room);
    }
    if (!room && roomName) {
      room = await prisma.room.findFirst({ where: { name: roomName } });
      console.log("[/api/rooms/join] lookup by name:", roomName, "->", !!room);
    }

    if (!room) {
      console.warn("[/api/rooms/join] room not found");
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // 4) Check if user is already a member
    const existingMembership = await prisma.roomMember.findFirst({
      where: {
        roomId: room.id,
        userId,
      },
    });
    console.log("[/api/rooms/join] existingMembership:", existingMembership);

    // If there is an existing membership:
    if (existingMembership) {
      // If previously rejected -> re-open as PENDING (this implements re-request)
      if (existingMembership.status === "REJECTED") {
        console.log(
          "[/api/rooms/join] re-opening rejected membership -> PENDING"
        );
        const updated = await prisma.roomMember.update({
          where: { id: existingMembership.id },
          data: { status: "PENDING" },
        });
        return NextResponse.json({ membership: updated }, { status: 200 });
      }

      // Already pending or accepted -> return as-is
      console.log(
        "[/api/rooms/join] returning existing membership (no change)"
      );
      return NextResponse.json(
        { message: "Already a member", membership: existingMembership },
        { status: 200 }
      );
    }

    // 5) Determine status based on visibility
    const status = room.visibility === "PUBLIC" ? "ACCEPTED" : "PENDING";

    // 6) Create membership
    const membership = await prisma.roomMember.create({
      data: {
        room: { connect: { id: room.id } },
        user: { connect: { id: userId } },
        role: "MEMBER",
        status,
      },
    });

    console.log("[/api/rooms/join] created membership:", membership);
    return NextResponse.json({ membership }, { status: 201 });
  } catch (err: any) {
    console.error("[/api/rooms/join] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
