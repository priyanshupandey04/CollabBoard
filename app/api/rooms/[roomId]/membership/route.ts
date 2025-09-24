import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session: Session | null = await getServerSession(authOptions as any);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { roomId } = params;
    const userId = session.user.id;

    await prisma.roomMember.deleteMany({
      where: { userId, roomId, status: { in: ["PENDING", "REJECTED"] } },
    });

    return NextResponse.json({ message: "Request withdrawn" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
