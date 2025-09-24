"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { LiveList } from "@liveblocks/client";

type RoomProps = {
  children: ReactNode;
  roomId: string; // dynamically pass the room ID
};

export function Room({ children, roomId }: RoomProps) {
  return (
    <LiveblocksProvider
      publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!}
      largeMessageStrategy="split" // splits large messages to avoid errors
    >
      <RoomProvider
        id={roomId} // dynamic room ID
        initialStorage={{
          shapes: new LiveList([]), // initialize shapes as an empty LiveList
        }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
