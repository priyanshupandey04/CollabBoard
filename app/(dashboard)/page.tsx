"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RoomMember = {
  id: string;
  role: "OWNER" | "MEMBER";
  status: "ACCEPTED" | "PENDING" | "REJECTED";
  room: {
    id: string;
    name: string;
    visibility: "PUBLIC" | "PRIVATE";
    ownerId: string;
  };
};

export default function DashboardPage() {
  const [rooms, setRooms] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/rooms/dashboard");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch rooms");
        setRooms(data.rooms);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (loading) return <p className="p-6">Loading rooms...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (rooms.length === 0) return <p className="p-6">No rooms yet.</p>;

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((rm) => (
        <div
          key={rm.id}
          className="border rounded p-4 cursor-pointer hover:shadow-lg transition"
          onClick={() => router.push(`/rooms/${rm.room.id}`)}
        >
          <h3 className="text-lg font-bold">{rm.room.name}</h3>
          <p>
            <strong>Role:</strong> {rm.role}
          </p>
          <p>
            <strong>Status:</strong> {rm.status}
          </p>
          <p>
            <strong>Visibility:</strong> {rm.room.visibility}
          </p>
          {rm.status === "PENDING" && rm.role !== "OWNER" && (
            <p className="text-yellow-600 mt-1">Waiting for approval</p>
          )}
          {rm.status === "REJECTED" && rm.role !== "OWNER" && (
            <p className="text-red-600 mt-1">Request rejected</p>
          )}
        </div>
      ))}
    </div>
  );
}
