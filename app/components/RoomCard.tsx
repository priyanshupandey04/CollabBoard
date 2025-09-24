// app/dashboard/RoomCard.tsx
"use client";

import { useRouter } from "next/navigation";

type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
type MembershipStatus = "ACCEPTED" | "PENDING" | "REJECTED";

type RoomCardProps = {
  roomName: string;
  roomId: string;
  visibility: "PUBLIC" | "PRIVATE";
  role: Role;
  status: MembershipStatus;
};

export default function RoomCard({
  roomName,
  roomId,
  visibility,
  role,
  status,
}: RoomCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/rooms/${roomId}`);
  };

  const statusColor =
    status === "ACCEPTED"
      ? "green"
      : status === "PENDING"
      ? "yellow"
      : "red";

  return (
    <div
      onClick={handleClick}
      className="border p-4 rounded cursor-pointer hover:bg-gray-100 transition"
    >
      <h3 className="font-bold text-lg mb-1">{roomName}</h3>
      <p className="text-sm text-gray-600 mb-1">ID: {roomId}</p>
      <p className="text-sm mb-1">
        Role: <span className="font-semibold">{role}</span>
      </p>
      <p className="text-sm mb-1">
        Status:{" "}
        <span className={`font-semibold text-${statusColor}-500`}>
          {status}
        </span>
      </p>
      <p className="text-sm">Visibility: {visibility}</p>
    </div>
  );
}
