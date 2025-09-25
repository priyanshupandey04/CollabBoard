// app/api/rooms/my-rooms/route.ts
import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/authStuff";

export async function GET(req: Request) {
  try {
    const session : Session | null = await getServerSession(authOptions as any);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch rooms where user is owner or has membership
    const memberships = await prisma.roomMember.findMany({
      where: { userId },
      include: { room: true },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json(memberships, { status: 200 });
  } catch (err) {
    console.error("Error fetching rooms:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
