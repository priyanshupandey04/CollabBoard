// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "./authStuff";

const handler = NextAuth(authOptions as any);

export { handler as GET, handler as POST };
