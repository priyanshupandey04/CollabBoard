// app/api/rooms/[roomId]/requestsPending/[requestId]/reject/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { roomId: string; requestId: string } }
) {
  const { roomId, requestId } = params;
  console.log("[reject] start", { roomId, requestId });

  try {
    const session = await getServerSession(authOptions as any);
    console.log("[reject] session:", !!session, session?.user?.email);

    if (!session?.user?.email) {
      console.warn("[reject] Unauthorized - no session/email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    console.log("[reject] room:", room);

    if (!room) {
      console.warn("[reject] Room not found:", roomId);
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    console.log("[reject] currentUser:", currentUser);

    if (!currentUser) {
      console.warn("[reject] Current user record not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (room.ownerId !== currentUser.id) {
      console.warn("[reject] Forbidden - not owner. ownerId:", room.ownerId, "currentUserId:", currentUser.id);
      return NextResponse.json({ error: "Forbidden: only owner can reject requests" }, { status: 403 });
    }

    const membership = await prisma.roomMember.findUnique({ where: { id: requestId } });
    console.log("[reject] membership lookup:", membership);

    if (!membership || membership.roomId !== roomId) {
      console.warn("[reject] membership not found or mismatch");
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (membership.status !== "PENDING") {
      console.warn("[reject] membership not in PENDING state:", membership.status);
      return NextResponse.json({ error: "Request is not pending" }, { status: 400 });
    }

    const updated = await prisma.roomMember.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    console.log("[reject] updated membership (REJECTED):", updated);

    return NextResponse.json({ success: true, membership: updated }, { status: 200 });
  } catch (err: any) {
    console.error("[reject] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
