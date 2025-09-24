import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const LIVEBLOCKS_SECRET = process.env.LIVEBLOCKS_SECRET!;

export async function POST(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    // 1. Validate session
    const session: Session | null = await getServerSession(authOptions as any);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const roomId = params.roomId;

    // 2. Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // 3. Check membership
    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: { roomId, userId },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this room" },
        { status: 403 }
      );
    }

    // 4. Map role → permissions
    const role = membership.role;
    const rolePermissions: Record<string, any> = {
      OWNER: { read: true, write: true, invite: true },
      ADMIN: { read: true, write: true, invite: true },
      MEMBER: { read: true, write: true },
      VIEWER: { read: true, write: false },
    };

    const permissions = rolePermissions[role] || { read: false, write: false };

    // 5. Mint ephemeral Liveblocks token
    const res = await fetch(
      `https://api.liveblocks.io/v2/rooms/${roomId}/users`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LIVEBLOCKS_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          groupIds: [role], // helps grouping by role
          metadata: { role, permissions },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { error: "Failed to mint token", details: err },
        { status: 500 }
      );
    }

    const token = await res.json();

    // 6. Return to client
    return NextResponse.json({ token, room, role, permissions });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
