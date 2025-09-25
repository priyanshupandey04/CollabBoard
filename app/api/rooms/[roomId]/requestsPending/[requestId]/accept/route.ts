// app/api/rooms/[roomId]/requestsPending/[requestId]/accept/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/authStuff";
import { Session } from "next-auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string; requestId: string }> }
) {
  const { roomId, requestId } = (await params);
  console.log("[accept] start", { roomId, requestId });

  try {
    const session : Session | null = await getServerSession(authOptions as any);
    console.log("[accept] session:", !!session, session?.user?.email);

    if (!session?.user?.email) {
      console.warn("[accept] Unauthorized - no session/email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // fetch room to verify owner
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    console.log("[accept] fetched room:", room);

    if (!room) {
      console.warn("[accept] Room not found:", roomId);
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // find current user id by email
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    console.log("[accept] currentUser:", currentUser);

    if (!currentUser) {
      console.warn("[accept] Current user record not found for email:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // only owner can accept
    if (room.ownerId !== currentUser.id) {
      console.warn("[accept] Forbidden - not owner. ownerId:", room.ownerId, "currentUserId:", currentUser.id);
      return NextResponse.json({ error: "Forbidden: only owner can accept requests" }, { status: 403 });
    }

    // fetch the membership row to ensure it exists and belongs to this room and is PENDING
    const membership = await prisma.roomMember.findUnique({ where: { id: requestId } });
    console.log("[accept] membership lookup:", membership);

    if (!membership || membership.roomId !== roomId) {
      console.warn("[accept] membership not found or mismatch");
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (membership.status !== "PENDING") {
      console.warn("[accept] membership not in PENDING state:", membership.status);
      return NextResponse.json({ error: "Request is not pending" }, { status: 400 });
    }

    // update status to ACCEPTED
    const updated = await prisma.roomMember.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    console.log("[accept] updated membership:", updated);

    // Return updated membership (so client can update UI)
    return NextResponse.json({ success: true, membership: updated }, { status: 200 });
  } catch (err: any) {
    console.error("[accept] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}