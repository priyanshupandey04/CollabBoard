"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
type MembershipStatus = "ACCEPTED" | "PENDING" | "REJECTED";

type RoomData = {
  id: string;
  name: string;
  visibility: "PUBLIC" | "PRIVATE";
  role: Role;
  status: MembershipStatus;
};

type PendingRequestRaw = any;
type Member = {
  id: string;
  userId?: string;
  userName: string;
  userEmail?: string | null;
  role?: Role | string;
  requestedAt: string | null;
  status: MembershipStatus;
};

export default function RoomPage() {
  const router = useRouter();
  const { roomId } = useParams();

  const [room, setRoom] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState<String | null>(null);

  // members holds ALL members returned from backend (owner: all statuses; non-owner: accepted only)
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState("");

  // membership info for current user if returned by API
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [membershipStatus, setMembershipStatus] =
    useState<MembershipStatus | null>(null);
  const [isClickedAccept, setIsClickedAccept] = useState<String | null>(null);
  const [isClickedReject, setIsClickedReject] = useState<String | null>(null);

  // per-action loading flags
  const [reRequestLoading, setReRequestLoading] = useState(false);
  const [acceptRejectLoading, setAcceptRejectLoading] = useState<{
    [k: string]: boolean;
  }>({});

  // owner filter: "ALL" | status
  const [filter, setFilter] = useState<"ALL" | MembershipStatus>("ALL");

  useEffect(() => {
    if (!roomId) return;

    setLoading(true);
    setError("");
    setMembers([]);
    setRoom(null);
    setMembershipId(null);
    setMembershipStatus(null);

    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`, { cache: "no-store" });
        const raw = await res.text();

        if (!res.ok) {
          try {
            const parsedErr = raw ? JSON.parse(raw) : null;
            setError(
              parsedErr?.error ?? `Failed to fetch room (${res.status})`
            );
          } catch {
            setError(`Failed to fetch room (${res.status})`);
          }
          setRoom(null);
          return;
        }

        const data = raw ? JSON.parse(raw) : null;

        let normalized: RoomData | null = null;
        let foundMembershipId: string | null = null;
        let foundMembershipStatus: MembershipStatus | null = null;

        if (data?.room && typeof data.room === "object") {
          normalized = {
            id: data.room.id,
            name: data.room.name,
            visibility: data.room.visibility ?? "PUBLIC",
            role: (data.role as Role) ?? "MEMBER",
            status: (data.status as MembershipStatus) ?? "ACCEPTED",
          };
          if (data.membership) {
            foundMembershipId = data.membership.id ?? null;
            foundMembershipStatus = data.membership.status ?? null;
          }
        } else if (data?.room && data.room.id) {
          normalized = {
            id: data.room.id,
            name: data.room.name,
            visibility: data.room.visibility ?? "PUBLIC",
            role: (data.role as Role) ?? "MEMBER",
            status: (data.status as MembershipStatus) ?? "ACCEPTED",
          };
          if (data.id) {
            foundMembershipId = data.id ?? null;
            foundMembershipStatus = data.status ?? null;
          }
        } else if (data?.id && data?.name) {
          normalized = {
            id: data.id,
            name: data.name,
            visibility: data.visibility ?? "PUBLIC",
            role: (data.role as Role) ?? "MEMBER",
            status: (data.status as MembershipStatus) ?? "ACCEPTED",
          };
        } else if (Array.isArray(data)) {
          normalized = null;
        } else {
          normalized = null;
        }

        setRoom(normalized);
        setMembershipId(foundMembershipId);
        setMembershipStatus(foundMembershipStatus);

        // fetch members (owner: all statuses, other: accepted only) using same endpoint
        if (normalized?.id) {
          await fetchMembers(normalized.id);
        } else {
          await fetchMembers(roomId as string);
        }
      } catch (err: any) {
        setError(err?.message ?? "Failed to fetch room");
        setRoom(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchMembers = async (rid: string) => {
      setLoadingMembers(true);
      try {
        const res = await fetch(`/api/rooms/${rid}/requestsPending`, {
          cache: "no-store",
        });
        const raw = await res.text();

        if (!res.ok) {
          try {
            const parsed = raw ? JSON.parse(raw) : null;
            setError(
              parsed?.error ?? `Failed to fetch members (${res.status})`
            );
          } catch {
            setError(`Failed to fetch members (${res.status})`);
          }
          setMembers([]);
          return;
        }

        const data = raw ? JSON.parse(raw) : null;
        let arr: PendingRequestRaw[] = [];
        if (Array.isArray(data)) arr = data;
        else if (data && Array.isArray(data.members)) arr = data.members;
        else arr = [];

        const normalized = arr.map((it: any) => {
          const userName =
            it.userName ?? it.user?.name ?? it.user?.email ?? "Unknown";
          const userEmail = it.user?.email ?? it.email ?? null;
          return {
            id: String(it.id),
            userId: it.user?.id ?? it.userId ?? undefined,
            userName,
            userEmail,
            role: it.role,
            requestedAt: it.requestedAt ?? it.joinedAt ?? null,
            status: (it.status as MembershipStatus) ?? "PENDING",
          } as Member;
        });

        setMembers(normalized);
      } catch (err: any) {
        setError(err?.message ?? "Failed to fetch members");
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Accept & Reject — update the member status locally so owner sees change (instead of removing immediately)
  const handleOwnerAccept = async (reqId: string) => {
    setAcceptRejectLoading((s) => ({ ...s, [reqId]: true }));
    try {
      const res = await fetch(
        `/api/rooms/${roomId}/requestsPending/${reqId}/accept`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.error ?? `Accept failed (${res.status})`);
        return;
      }
      // update local members list: mark as ACCEPTED
      setMembers((prev) =>
        prev.map((m) => (m.id === reqId ? { ...m, status: "ACCEPTED" } : m))
      );
    } catch {
      alert("Network error while accepting request");
    } finally {
      setAcceptRejectLoading((s) => ({ ...s, [reqId]: false }));
      setIsClickedAccept(null);
    }
  };

  const handleOwnerReject = async (reqId: string) => {
    setAcceptRejectLoading((s) => ({ ...s, [reqId]: true }));
    try {
      const res = await fetch(
        `/api/rooms/${roomId}/requestsPending/${reqId}/reject`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.error ?? `Reject failed (${res.status})`);
        return;
      }
      // update local members list: mark as REJECTED
      setMembers((prev) =>
        prev.map((m) => (m.id === reqId ? { ...m, status: "REJECTED" } : m))
      );
    } catch {
      alert("Network error while rejecting request");
    } finally {
      setAcceptRejectLoading((s) => ({ ...s, [reqId]: false }));
      setIsClickedReject(null);
    }
  };

  // Re-request for non-owner user
  const handleReRequest = async (roomIdentifier: {
    roomId?: string;
    roomName?: string;
  }) => {
    setReRequestLoading(true);
    try {
      const res = await fetch(`/api/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(roomIdentifier),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.error ?? `Re-request failed (${res.status})`);
        return;
      }

      const membership = json.membership ?? json;
      const status = membership?.status;
      const mid = membership?.id ?? membership?.membership?.id ?? null;
      if (mid) setMembershipId(mid);
      if (status) setMembershipStatus(status);

      if (status === "PENDING") {
        alert("Request re-sent; pending approval");
        router.refresh();
      } else if (status === "ACCEPTED") {
        alert("You are now a member; redirecting to canvas");
        const rid = membership.roomId ?? membership.room?.id ?? room?.id;
        if (rid) router.push(`/rooms/canvas/${rid}`);
      } else {
        alert("Request processed; check dashboard");
        router.refresh();
      }
    } catch {
      alert("Network error during re-request");
    } finally {
      setReRequestLoading(false);
    }
  };

  // helpers: formatting + avatar + badge
  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      const parts = d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return parts.replace(/AM|PM/g, (m) => m.toLowerCase());
    } catch {
      return String(iso);
    }
  };

  const Avatar = ({ name }: { name: string }) => {
    const char = (name || "?").trim().charAt(0).toUpperCase();
    return (
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-amber-400 flex items-center justify-center text-white text-2xl font-semibold shadow-xl ring-1 ring-white/10 dark:ring-black/30">
        {char}
      </div>
    );
  };

  const statusBadge = (s: MembershipStatus) => {
    if (s === "ACCEPTED")
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-600 text-white dark:bg-emerald-500">
          Accepted
        </span>
      );
    if (s === "PENDING")
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-600 text-white dark:bg-yellow-500">
          Pending
        </span>
      );
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white dark:bg-red-500">
        Rejected
      </span>
    );
  };

  // small reusable member card — used both for owner list and non-owner list
  const MemberCard = ({
    member,
    showActions,
  }: {
    member: Member;
    showActions: boolean;
  }) => (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="p-4 md:p-6 rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-50 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
    >
      <div className="flex items-start gap-4">
        <Avatar name={member.userName} />
        <div>
          {/* status badge on top */}
          <div className="mb-2">{statusBadge(member.status)}</div>

          <div className="text-lg font-semibold tracking-wide text-gray-900 dark:text-white">
            {member.userName}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {member.userEmail ?? "—"}
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <div className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
              Role:{" "}
              <span className="font-medium ml-1">
                {member.role ?? "MEMBER"}
              </span>
            </div>
            <div className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
              Joined/Requested:{" "}
              <span className="font-medium ml-1">
                {formatDateTime(member.requestedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 flex gap-3">
        {showActions && member.status === "PENDING" ? (
          <>
            <button
              onClick={() => {
                setIsClickedAccept(member.id);
                handleOwnerAccept(member.id);
              }}
              disabled={!!acceptRejectLoading[member.id]}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white shadow-md ${
                acceptRejectLoading[member.id]
                  ? "bg-emerald-300 cursor-not-allowed dark:bg-emerald-600/40"
                  : "bg-emerald-600 hover:scale-[1.02]"
              }`}
            >
              {isClickedAccept === member.id ? (
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeOpacity="0.2"
                    strokeWidth="4"
                  />
                  <path
                    d="M22 12a10 10 0 00-10-10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              ) : null}
              {isClickedAccept === member.id ? "Accepting…" : "Accept"}
            </button>

            <button
              onClick={() => {
                setIsClickedReject(member.id);
                handleOwnerReject(member.id);
              }}
              disabled={!!acceptRejectLoading[member.id]}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white shadow-md ${
                acceptRejectLoading[member.id]
                  ? "bg-red-300 cursor-not-allowed dark:bg-red-600/40"
                  : "bg-red-600 hover:scale-[1.02]"
              }`}
            >
              {isClickedReject === member.id? (
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeOpacity="0.2"
                    strokeWidth="4"
                  />
                  <path
                    d="M22 12a10 10 0 00-10-10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              ) : null}
              {isClickedReject === member.id ? "Rejecting…" : "Reject"}
            </button>
          </>
        ) : null}
      </div>
    </motion.li>
  );

  // Loading & error UI
  if (loading)
    return (
      <div className="p-6">
        <div className="h-8 w-1/3 bg-gray-200 rounded-md animate-pulse mb-4 dark:bg-gray-700" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-inner animate-pulse dark:from-gray-800 dark:to-gray-850" />
          <div className="h-32 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-inner animate-pulse dark:from-gray-800 dark:to-gray-850" />
        </div>
      </div>
    );

  if (error)
    return <p className="p-6 text-red-500 dark:text-red-300">Error: {error}</p>;

  if (!room)
    return (
      <p className="p-6 text-gray-500 dark:text-gray-400">
        Room data not available
      </p>
    );

  // derive visible members according to filter & ownership
  const isOwner = room.role === "OWNER";
  const visibleMembers = (() => {
    if (isOwner) {
      if (filter === "ALL") return members;
      return members.filter((m) => m.status === filter);
    }
    return members.filter((m) => m.status === "ACCEPTED");
  })();

  // personal membership cards (top) are preserved from your original design
  const AcceptedCard = ({ room }: { room: RoomData }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-6 p-6 rounded-2xl bg-emerald-100  border border-emerald-100 backdrop-blur-md shadow-2xl dark:from-gray-800 dark:to-gray-850 dark:border-gray-700 dark:bg-gradient-to-r"
    >
      <h3 className="font-semibold text-emerald-800 text-lg tracking-wide dark:text-emerald-300">
        You're in 🎉
      </h3>
      <p className="text-emerald-700 mt-1 dark:text-emerald-200">
        You have access to this room.
      </p>
      <div className="mt-4">
        <button
          onClick={() => {
            setIsLoading("Entering canvas…");
            router.push(`/rooms/canvas/${room.id}`);
          }}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg hover:scale-[1.01] transition-transform dark:bg-emerald-500"
        >
          {isLoading || "Enter Canvas"}
        </button>
      </div>
    </motion.div>
  );

  const PendingCard = ({ room }: { room: RoomData }) => {
    const isPending = membershipStatus === "PENDING";
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 p-6 rounded-2xl bg-yellow-100 border border-yellow-100 backdrop-blur-sm shadow-2xl dark:from-gray-900 dark:to-gray-800 dark:border-gray-800 dark:bg-gradient-to-br"
      >
        <h3 className="font-semibold text-yellow-800 text-lg tracking-wide dark:text-yellow-300">
          Request Pending ⏳
        </h3>
        <p className="text-yellow-700 mt-1 dark:text-yellow-200">
          Your request is awaiting owner approval.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => handleReRequest({ roomId: room.id })}
            disabled={isPending || reRequestLoading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl shadow-md ${
              isPending || reRequestLoading
                ? "bg-yellow-300 text-yellow-900 opacity-70 cursor-not-allowed dark:bg-yellow-800/40"
                : "bg-yellow-600 text-white hover:scale-[1.01]"
            }`}
          >
            {reRequestLoading ? (
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeOpacity="0.2"
                  strokeWidth="4"
                />
                <path
                  d="M22 12a10 10 0 00-10-10"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            ) : null}
            {reRequestLoading ? "Requesting…" : "Re-request"}
          </button>
        </div>
      </motion.div>
    );
  };

  const RejectedCard = ({ room }: { room: RoomData }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 backdrop-blur-sm shadow-2xl dark:from-gray-900 dark:to-gray-800 dark:border-gray-800"
    >
      <h3 className="font-semibold text-red-800 text-lg tracking-wide dark:text-red-300">
        Request Rejected ❌
      </h3>
      <p className="text-red-700 mt-1 dark:text-red-200">
        The owner rejected your request to join this room.
      </p>
      <div className="mt-4">
        <button
          onClick={() => handleReRequest({ roomId: room.id })}
          disabled={reRequestLoading}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl shadow-md ${
            reRequestLoading
              ? "bg-red-300 text-red-900 opacity-70 cursor-not-allowed dark:bg-red-800/40"
              : "bg-red-600 text-white hover:scale-[1.01]"
          }`}
        >
          {reRequestLoading ? (
            <svg
              className="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeOpacity="0.2"
                strokeWidth="4"
              />
              <path
                d="M22 12a10 10 0 00-10-10"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          ) : null}
          {reRequestLoading ? "Requesting…" : "Re-request"}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="p-6 font-sans text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950 min-h-screen transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-2 tracking-tight">
          {room.name}
        </h1>

        <div className="flex flex-wrap gap-4 items-center text-sm text-gray-600 mb-4 dark:text-gray-300">
          <div className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
            Role:{" "}
            <span className="font-medium text-gray-800 dark:text-gray-100 ml-2">
              {room.role}
            </span>
          </div>
          <div className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
            Status:{" "}
            <span className="font-medium text-gray-800 dark:text-gray-100 ml-2">
              {room.status}
            </span>
          </div>
          <div className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
            Visibility:{" "}
            <span className="font-medium text-gray-800 dark:text-gray-100 ml-2">
              {room.visibility}
            </span>
          </div>
        </div>

        {/* personal membership card for the current user */}
        {membershipStatus === "ACCEPTED" || room.status === "ACCEPTED" ? (
          <AcceptedCard room={room} />
        ) : null}

        {membershipStatus === "PENDING" || room.status === "PENDING" ? (
          <PendingCard room={room} />
        ) : null}

        {membershipStatus === "REJECTED" ||
        (room.status === "REJECTED" && membershipStatus !== "PENDING") ? (
          <RejectedCard room={room} />
        ) : null}

        {/* Members section: owners see filters + all statuses; non-owners see accepted only */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Members</h2>

            {isOwner && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFilter("ALL")}
                  className={`px-3 py-1 rounded-md ${
                    filter === "ALL"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("PENDING")}
                  className={`px-3 py-1 rounded-md ${
                    filter === "PENDING"
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter("ACCEPTED")}
                  className={`px-3 py-1 rounded-md ${
                    filter === "ACCEPTED"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  Accepted
                </button>
                <button
                  onClick={() => setFilter("REJECTED")}
                  className={`px-3 py-1 rounded-md ${
                    filter === "REJECTED"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  Rejected
                </button>
              </div>
            )}
          </div>

          {loadingMembers ? (
            <p className="text-gray-600 dark:text-gray-300">Loading members…</p>
          ) : visibleMembers.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white/60 border border-gray-100 shadow-lg dark:bg-gray-900/60 dark:border-gray-800">
              No members found.
            </div>
          ) : (
            <ul className="space-y-4">
              <AnimatePresence>
                {visibleMembers.map((m) => (
                  <MemberCard key={m.id} member={m} showActions={isOwner} />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
