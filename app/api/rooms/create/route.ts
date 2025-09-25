// app/api/rooms/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession, Session } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/authStuff";

const CreateRoomBody = z.object({
  name: z
    .string()
    .trim()
    .min(3, "name must be at least 3 characters")
    .max(30, "name must be 30 characters or less")
    // allow letters, numbers, dash, underscore, dots — adjust as you like
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "name can only contain letters, numbers and underscore."
    ),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

export async function POST(req: Request) {
  try {
    // 1) Ensure authenticated
    const session: Session | null = await getServerSession(authOptions as any);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const ownerId = session.user.id;

    // 2) Parse + validate body
    const body = await req.json().catch(() => ({}));
    const parsed = CreateRoomBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error:parsed.error.issues[0].message },
        { status: 422 }
      );
    }

    const { name, visibility } = parsed.data;

    // Normalize unique key (optional): use lowercase for uniqueness consistency
    const normalizedName = name.toLowerCase();

    // 3) Check if room name exists (unique constraint)
    const existing = await prisma.room.findUnique({
      where: { name: normalizedName },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Room name already exists" },
        { status: 409 }
      );
    }

    // 4) Create room and membership inside transaction
    const [room, membership] = await prisma.$transaction([
      prisma.room.create({
        data: {
          name: normalizedName,
          visibility,
          ownerId,
        },
      }),
      prisma.roomMember.create({
        data: {
          room: { connect: { name: normalizedName } }, // connect by unique name
          user: { connect: { id: ownerId } },
          role: "OWNER",
          status: "ACCEPTED",
        },
      }),
    ]);

    // 5) Return created room + membership
    return NextResponse.json({ room, membership }, { status: 201 });
  } catch (err: any) {
    // handle unique constraint race (if any)
    if (err?.code === "P2002" && err?.meta?.target?.includes("name")) {
      return NextResponse.json(
        { error: "Room name already exists" },
        { status: 409 }
      );
    }

    console.error("Error creating room:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
