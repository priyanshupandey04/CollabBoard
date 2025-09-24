"use client";

import React, { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import SignOutButton from "./signout-btn";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Moon, Sun } from "lucide-react";

type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
type MembershipStatus = "ACCEPTED" | "PENDING" | "REJECTED";

type Room = {
  id: string;
  name: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  ownerId: string;
};

type RoomMember = {
  id: string;
  roomId: string;
  userId: string;
  role: Role;
  status: MembershipStatus;
  joinedAt: string;
  invitedBy: string | null;
  room: Room;
};

export default function DashboardPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomMember[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { setTheme, theme } = useTheme();
  const [isCreatingOrJoining, setIsCreatingOrJoining] = useState(false);
  const [isGoToRoom, setIsGoToRoom] = useState<String | null>(null);

  // Filters
  const [filterRole, setFilterRole] = useState<"" | Role>("");
  const [filterStatus, setFilterStatus] = useState<"" | MembershipStatus>("");
  const [filterVisibility, setFilterVisibility] = useState<
    "" | "PUBLIC" | "PRIVATE"
  >("");

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rooms/my-rooms");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data: RoomMember[] = await res.json();
      setRooms(data);
      setFilteredRooms(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    let filtered = [...rooms];
    if (filterRole) filtered = filtered.filter((r) => r.role === filterRole);
    if (filterStatus)
      filtered = filtered.filter((r) => r.status === filterStatus);
    if (filterVisibility)
      filtered = filtered.filter((r) => r.room.visibility === filterVisibility);
    setFilteredRooms(filtered);
  }, [filterRole, filterStatus, filterVisibility, rooms]);

  if (loading)
    return (
      <p className="p-6 text-gray-700 dark:text-gray-300">Loading rooms...</p>
    );
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <main className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 md:mb-0 text-gray-900 dark:text-gray-100 font-poppins">
          Dashboard
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setIsCreatingOrJoining(true);
              redirect("/rooms");
            }}
            disabled={isCreatingOrJoining}
            className={`bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-md transition-colors duration-300  ${
              isCreatingOrJoining
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            }`}
          >
            {isCreatingOrJoining
              ? "Creating or joining..."
              : "Create / Join Rooms"}
          </button>
          <SignOutButton />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          className="border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as "" | Role)}
        >
          <option value="">All Roles</option>
          <option value="OWNER">Owner</option>
          <option value="ADMIN">Admin</option>
          <option value="MEMBER">Member</option>
          <option value="VIEWER">Viewer</option>
        </select>

        <select
          className="border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as "" | MembershipStatus)
          }
        >
          <option value="">All Status</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select
          className="border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          value={filterVisibility}
          onChange={(e) =>
            setFilterVisibility(e.target.value as "" | "PUBLIC" | "PRIVATE")
          }
        >
          <option value="">All Visibility</option>
          <option value="PUBLIC">Public</option>
          <option value="PRIVATE">Private</option>
        </select>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-300">
          No rooms found with selected filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((member) => {
            let statusColor = "text-gray-700 dark:text-gray-300";
            if (member.status === "ACCEPTED")
              statusColor = "text-green-600 dark:text-green-400";
            else if (member.status === "PENDING")
              statusColor = "text-orange-500 dark:text-orange-400";
            else if (member.status === "REJECTED")
              statusColor = "text-red-600 dark:text-red-400";

            return (
              <motion.div
                key={member.id}
                className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md flex flex-col justify-between"
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0px 10px 25px rgba(0,0,0,0.15)",
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 font-poppins">
                    {member.room.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Role: <span className="font-medium">{member.role}</span>
                  </p>
                  <p className={`font-semibold ${statusColor} mb-2`}>
                    Status: {member.status}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Visibility: {member.room.visibility}
                  </p>
                </div>

                <button
                  disabled={isGoToRoom !== null}
                  onClick={() => {
                    setIsGoToRoom(member.room.id);
                    router.push(`/rooms/${member.room.id}`);
                  }}
                  className={`mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-full transition-colors duration-300 ${
                    isGoToRoom !== member.room.id && isGoToRoom !== null
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                >
                  {isGoToRoom === member.room.id
                    ? "Going to room..."
                    : "Go to Room"}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </main>
  );
}
