// app/api/rooms/my-rooms/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);

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
