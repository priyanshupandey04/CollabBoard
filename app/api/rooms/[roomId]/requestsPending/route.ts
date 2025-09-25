import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/authStuff";

export async function GET(
  req: Request,
  { params }:{ params: Promise<{ roomId: string }> }
) {
  const roomId = (await params).roomId;
  try {
    const session : Session | null = await getServerSession(authOptions as any);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // get room
    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // get current user id from email (safe)
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // if owner -> return all members grouped by status; else return only accepted members
    let members;
    if (room.ownerId === currentUser.id) {
      members = await prisma.roomMember.findMany({
        where: { roomId },
        select: {
          id: true,
          userId: true,
          status: true,
          role: true,
          joinedAt: true,
          invitedBy: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: "desc" },
      });
    } else {
      members = await prisma.roomMember.findMany({
        where: { roomId, status: "ACCEPTED" },
        select: {
          id: true,
          userId: true,
          status: true,
          role: true,
          joinedAt: true,
          invitedBy: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: "desc" },
      });
    }

    const formatted = members.map((r) => ({
      id: r.id,
      userId: r.userId,
      status: r.status,
      email: r.user?.email,
      userName: r.user?.name ?? r.user?.email ?? "Unknown",
      role: r.role,
      requestedAt: r.joinedAt ? r.joinedAt.toISOString() : null,
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
