"use client";

import React, { use, useState, useEffect } from "react";
import PageContent from "@/app/components/PageContent";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { LiveList } from "@liveblocks/client";

export default function CanvasPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);

  const [error, setError] = useState<string | null>(null);
  const [authData, setAuthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Liveblocks token and handle errors
  useEffect(() => {
    const fetchAuth = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/liveblocks/token", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId }),
        });

        const json = await res.json();
        if (!res.ok || json.error) {
          setError(json.error || "Failed to authorize with Liveblocks");
        } else {
          setAuthData(json); // contains { token, roomId, membership }
        }
      } catch (e: any) {
        setError(e.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    fetchAuth();
  }, [roomId]);

  // Block two-finger history navigation while PageContent is mounted.
  useEffect(() => {
    if (loading || error) return; // only block when actually connected and showing content

    // 1) Disable overscroll behavior (helps in some browsers to stop swipe nav)
    const doc = document.documentElement;
    const prevOverscroll = doc.style.overscrollBehavior;
    doc.style.overscrollBehavior = "none"; // prevents some swipe/back gestures

    // 2) Add a popstate handler that immediately pushes the state back.
    //    This effectively cancels history navigation (back/forward) while mounted.
    const onPopState = (e: PopStateEvent) => {
      try {
        // Re-push a state so the user stays on the page.
        history.pushState(null, document.title, window.location.href);
      } catch (err) {
        // ignore
      }
    };

    // Ensure there's a stable state in history to intercept
    try {
      history.pushState(null, document.title, window.location.href);
    } catch (err) {
      // ignore
    }
    window.addEventListener("popstate", onPopState);

    // 3) Add a wheel listener to prevent horizontal wheel swipes from triggering nav
    //    (This helps for two-finger horizontal swipes on some laptops)
    const onWheel = (e: WheelEvent) => {
      // If horizontal motion is significant compared to vertical motion, prevent it.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 20) {
        e.preventDefault();
      }
    };
    // passive: false so we can call preventDefault
    window.addEventListener("wheel", onWheel, { passive: false } as AddEventListenerOptions);

    // 4) Touchstart/touchmove fallback for touch devices
    let touchStartX = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) touchStartX = e.touches[0].clientX;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches || !e.touches[0]) return;
      const dx = e.touches[0].clientX - touchStartX;
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs((e.touches[0].clientY || 0) - 0)) {
        e.preventDefault();
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true } as AddEventListenerOptions);
    window.addEventListener("touchmove", onTouchMove, { passive: false } as AddEventListenerOptions);

    return () => {
      // Cleanup: restore overscroll and remove listeners
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("wheel", onWheel as EventListener);
      window.removeEventListener("touchstart", onTouchStart as EventListener);
      window.removeEventListener("touchmove", onTouchMove as EventListener);
      doc.style.overscrollBehavior = prevOverscroll || "";

      // Try to remove the extra history entry we pushed earlier by going back once.
      // This is best-effort — if the user navigated while the page was open this might not be safe,
      // so we guard with a try/catch and don't force navigation.
      try {
        history.back();
      } catch (err) {
        // ignore
      }
    };
  }, [loading, error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-medium">
        Connecting…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-700 p-6">
        <h1 className="text-2xl font-bold mb-4">🚫 Cannot enter room</h1>
        <p className="text-lg">{error}</p>
        <p className="mt-4 text-sm text-gray-600">
          Please contact the room owner or check your permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="p-0">

    <LiveblocksProvider
      authEndpoint={() => authData} // directly pass token JSON
      largeMessageStrategy="split"
    >
      <RoomProvider id={roomId} initialStorage={{ shapes: new LiveList([]) }}>
        <ClientSideSuspense
          fallback={
            <div className="flex items-center justify-center h-screen text-lg font-medium">
              Loading canvas…
            </div>
          }
        >
          <PageContent roomId={roomId} />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
      </div>
  );
}
