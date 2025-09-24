"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function SignOutButton() {
  const[isDisabled, setIsDisabled] = useState(false);
  return (
    <button
      onClick={() => {
        setIsDisabled(true);
        signOut({ callbackUrl: "/auth/signin" });
      }}
      disabled={isDisabled}
      className={`bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-2 rounded-md transition-colors duration-300  ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {isDisabled ? "Signing out..." : "Sign out"}
    </button>
  );
}
