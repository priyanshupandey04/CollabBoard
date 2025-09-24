"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-red-500">
      <h2>Something went wrong!</h2>
      <pre>{error.message}</pre>
      <button
        className="mt-4 px-4 py-2 border rounded bg-white text-black"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
