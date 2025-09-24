import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session : Session | null= await getServerSession(authOptions as any);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roomId = (await params).roomId;
    const userId = session.user.id;

    // Fetch membership for this user & room
    const membership = await prisma.roomMember.findFirst({
      where: { userId, roomId },
      include: { room: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this room" },
        { status: 404 }
      );
    }

    return NextResponse.json(membership);
  } catch (err) {
    console.error("Error fetching room:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
