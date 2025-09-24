import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    allow?: boolean;
    FULL_ACCESS?: boolean;
  }
  interface Session {
    user: {
      id: string; // 👈 add id
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    password?: string | null; // if you store it in db
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string | null;
    name?: string | null;
    picture?: string | null;
    image?: string | null;
  }
}
