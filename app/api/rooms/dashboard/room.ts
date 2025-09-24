import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session: Session | null = await getServerSession(authOptions as any);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Fetch all rooms where user is a member or owner
    const rooms = await prisma.roomMember.findMany({
      where: { userId },
      include: {
        room: true, // include room details
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    // Return data
    return NextResponse.json({ rooms }, { status: 200 });
  } catch (err) {
    console.error("Error fetching dashboard rooms:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
