// app/api/liveblocks/token/route.ts
import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Liveblocks } from "@liveblocks/node";
import prisma from "@/lib/prisma";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

function jsonError(message: string, status = 403) {
  console.log("[jsonError]", status, message);
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  try {
    console.log("=== /api/liveblocks/token POST called ===");

    const reqBody = await req.json().catch(() => ({}));
    const roomInput = reqBody?.roomId || reqBody?.roomName;
    console.log("Request body:", reqBody);

    if (!roomInput) return jsonError("Missing roomId or roomName", 400);

    // NextAuth session
    const session :Session | null= await getServerSession(authOptions as any);
    if (!session?.user?.id) return jsonError("Unauthorized: no session user id", 401);

    const userId = session.user.id;
    const userName = session.user.name ?? undefined;
    const userEmail = session.user.email ?? undefined;
    console.log("User ID:", userId, "Name:", userName, "Email:", userEmail);

    // ---- Find Room in DB ----
    let room = await prisma.room.findUnique({
      where: { id: roomInput },
    });
    let correctId = roomInput;

    if (!room) {
      console.log(`Room with id '${roomInput}' not found. Trying lookup by name...`);
      room = await prisma.room.findUnique({
        where: { name: roomInput },
      });
      if (!room) return jsonError("Room not found", 404);
      correctId = room.id;
    }
    console.log("Room found:", room);

    // ---- Authorization Check ----
    if (room.visibility === "PUBLIC") {
      console.log("Room is PUBLIC - token will be generated");
    } else {
      console.log("Room is PRIVATE - checking if user can join");

      const isOwner = room.ownerId === userId;
      console.log("Is user owner?", isOwner);

      const membership = await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId: correctId, userId } },
        select: { status: true },
      });
      const accepted = membership?.status === "ACCEPTED";
      console.log("Membership record:", membership, "Accepted?", accepted);

      if (!accepted && !isOwner) return jsonError("You are not allowed to join this room", 403);

      console.log("User is allowed to join PRIVATE room");
    }
    console.log("Room is OK to join");
    // ---- Prepare Liveblocks session ----
    const sessionInstance = liveblocks.prepareSession(userId, {
      userInfo: { name: userName, email: userEmail },
    });
    sessionInstance.allow(correctId, sessionInstance.FULL_ACCESS);

    console.log("Authorizing with Liveblocks...");
    const { status, body } = await sessionInstance.authorize();
    console.log("Liveblocks response status:", status);
    console.log("Liveblocks response body:", body);

    return new Response(body, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[/api/liveblocks/token] error:", err);
    return jsonError("Internal Server Error", 500);
  }
}
