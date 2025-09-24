"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

type MembershipState = "ACCEPTED" | "PENDING" | null;

export default function RoomsPage() {
  const router = useRouter();

  // Create room states
  const [roomName, setRoomName] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [roomCreated, setRoomCreated] = useState<String | null>(null);

  // Join room states
  const [joinRoomInput, setJoinRoomInput] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [membershipStatus, setMembershipStatus] =
    useState<MembershipState>(null);

  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [createError, setcreateError] = useState("");

  // ----------------------------
  // Create Room
  // ----------------------------
  const handleCreateRoom = async () => {
    if (!roomName) return toast("Enter room name");
    setLoadingCreate(true);
    setcreateError("");
    setRoomCreated(null);
    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roomName, visibility }),
      });
      const data = await res.json().catch(() => ({ error: "invalid json" }));
      if (!res.ok)
        throw new Error(data.error || `Create failed (${res.status})`);
      console.log("[/api/rooms/create] response:", data);
      toast(`Room created: ${roomName} (${visibility})`);
      setRoomCreated(data.room.id);
    } catch (err: any) {
      setcreateError(err.message || "Create room failed");
    } finally {
      setLoadingCreate(false);
    }
  };

  // ----------------------------
  // Join Room
  // ----------------------------
  const handleJoinRoom = async () => {
    if (!joinRoomInput) return toast("Enter room name or ID");
    setLoadingJoin(true);
    setJoinError("");
    setMembershipStatus(null);
    try {
      let resolvedCuid: string | null = null;

      // Resolve human-friendly name -> CUID
      try {
        const idRes = await fetch("/api/rooms/getId", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomInput: joinRoomInput }),
          credentials: "include",
        });
        const idJson = await idRes
          .json()
          .catch(() => ({ error: "invalid json" }));
        if (idRes.ok && idJson?.roomId) resolvedCuid = idJson.roomId;
      } catch {}

      const joinPayload: Record<string, string> = resolvedCuid
        ? { roomId: resolvedCuid }
        : { roomName: joinRoomInput };
      const joinRes = await fetch("/api/rooms/join", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinPayload),
      });

      const joinJson = await joinRes
        .json()
        .catch(() => ({ error: "invalid json" }));
      if (!joinRes.ok) {
        setJoinError(joinJson?.error || `Join failed (${joinRes.status})`);
        return;
      }

      const membership = joinJson.membership ?? joinJson;
      const status = membership?.status as string | undefined;
      const roomIdFromResp =
        membership?.roomId || membership?.room?.id || resolvedCuid;

      if (status === "ACCEPTED") {
        setMembershipStatus("ACCEPTED");
        if (roomIdFromResp) setJoinRoomId(roomIdFromResp);
        toast("You can now enter the canvas!");
        return;
      }
      if (status === "PENDING") {
        setMembershipStatus("PENDING");
        if (roomIdFromResp) setJoinRoomId(roomIdFromResp);
        toast("Request sent! Waiting for owner approval.");
        return;
      }

      if (joinJson?.message && joinJson?.membership) {
        const mem = joinJson.membership;
        if (mem.status === "ACCEPTED") {
          setMembershipStatus("ACCEPTED");
          setJoinRoomId(mem.roomId || mem.room?.id || resolvedCuid || "");
          toast("You can now enter the canvas!");
          return;
        }
        if (mem.status === "PENDING") {
          setMembershipStatus("PENDING");
          setJoinRoomId(mem.roomId || mem.room?.id || resolvedCuid || "");
          toast("Request pending");
          return;
        }
      }

      setJoinError("Unexpected response from server. Check console.");
    } catch (err: any) {
      setJoinError(err.message || "Failed to join room");
      setMembershipStatus(null);
    } finally {
      setLoadingJoin(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-inter">
      {/* Create Room */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center p-6 m-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md"
        whileHover={{
          scale: 1.02,
          boxShadow: "0px 10px 25px rgba(0,0,0,0.15)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100 font-poppins">
          Create a Room
        </h2>
        <input
          type="text"
          placeholder="Room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="border p-3 rounded w-64 mb-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={visibility}
          onChange={(e) =>
            setVisibility(e.target.value as "PUBLIC" | "PRIVATE")
          }
          className="border p-3 rounded w-64 mb-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="PUBLIC">Public</option>
          <option value="PRIVATE">Private</option>
        </select>
        <button
          onClick={handleCreateRoom}
          disabled={loadingCreate}
          className={`w-64 py-3 rounded-full text-white font-semibold transition-all duration-300 my-2 ${
            loadingCreate
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loadingCreate ? "Creating..." : "Create Room"}
        </button>
        {roomCreated !== null && (
          <>
            <p></p>
            <button
              className="w-64 py-3 rounded-full bg-green-500 hover:bg-green-700 text-white font-semibold transition-all duration-300 my-3.5"
              onClick={() => router.push(`/rooms/${roomCreated}`)}
            >
              Enter room now
            </button>
          </>
        )}

        {createError && (
          <p className="text-red-500 mt-2 font-medium">{createError}</p>
        )}
      </motion.div>

      {/* Join Room */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center p-6 m-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md"
        whileHover={{
          scale: 1.02,
          boxShadow: "0px 10px 25px rgba(0,0,0,0.15)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100 font-poppins">
          Join a Room
        </h2>
        <input
          type="text"
          placeholder="Enter room name or ID"
          value={joinRoomInput}
          onChange={(e) => setJoinRoomInput(e.target.value)}
          className="border p-3 rounded w-64 mb-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleJoinRoom}
          disabled={loadingJoin}
          className={`w-64 py-3 rounded-full text-white font-semibold transition-all duration-300 mb-3 ${
            loadingJoin
              ? "bg-green-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loadingJoin ? "Joining..." : "Join Room"}
        </button>

        {membershipStatus === "ACCEPTED" && joinRoomId && (
          <button
            onClick={() => router.push(`/rooms/canvas/${joinRoomId}`)}
            className="w-64 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300"
          >
            Enter Canvas
          </button>
        )}
        {membershipStatus === "PENDING" && (
          <p className="text-yellow-500 mt-2 font-medium">
            Waiting for owner approval...
          </p>
        )}
        {joinError && (
          <p className="text-red-500 mt-2 font-medium">{joinError}</p>
        )}
      </motion.div>
    </div>
  );
}
