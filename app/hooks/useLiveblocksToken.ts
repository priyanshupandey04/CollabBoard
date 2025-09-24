import { useState, useEffect } from "react";

export function useLiveblocksToken(roomId: string) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const fetchToken = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/liveblocks/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId }),
        });

        if (!res.ok) throw new Error("Failed to fetch Liveblocks token");
        const data = await res.json();
        setToken(data.token); // <-- token is a string
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [roomId]);

  return { token, loading, error };
}
