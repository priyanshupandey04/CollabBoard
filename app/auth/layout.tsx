import { getServerSession, Session } from "next-auth";
import React from "react";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

const layout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const session: Session | null = await getServerSession(authOptions as any);
  if (session) {
    return redirect("/dashboard");
  } else return <>{children}</>;
};

export default layout;
