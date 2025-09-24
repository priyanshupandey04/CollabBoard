// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // use JWT sessions (no DB session rows)
    maxAge: Number(process.env.NEXTAUTH_JWT_MAX_AGE ?? 60 * 15), // seconds
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET,
    maxAge: Number(process.env.NEXTAUTH_JWT_MAX_AGE ?? 60 * 15),
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // no user or no password set (e.g., OAuth-only account)
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        // return minimal user object (this becomes `user` in JWT callback)
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      // On initial sign in, add fields from `user` into token
      if (user) {
        token.id = user.id ?? token.sub;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      // Optionally include roles or room info by fetching from DB if needed:
      // if (!token.roles) { const dbUser = await prisma.user.findUnique(...); token.roles = ... }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      // Expose token fields to client session
      if (token) {
        session.user = {
          id: token.id as string,
          name: (token.name as string) ?? null,
          email: (token.email as string) ?? null,
          image: (token.picture as string) ?? (token.image as string) ?? null,
        };
      }
      return session;
    },
  },
  pages: {
    signOut: "/auth/signout",
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions as any);
export { handler as GET, handler as POST };


// so needed things in heirarchy
// 1.session strategy 
            // 1.1 jwt strategy (majority of the time)
            // 1.2 database strategy
// 2. jwt 
            // 2.1 jwt secret
            // 2.2 jwt max age
// 3. providers [
            // 3.1 credentials provider
                // 3.1.1 name
                // 3.1.2 credentials{
                    // 3.1.2.1 email
                    // 3.1.2.2 password
                // }
                // 3.1.3 async authorize(credentials) [which is called when user clicks sign in and returns a user object or null]

// ]

// 4. callbacks [
            // 4.1 async jwt({ token, user, account }} 
                    // modify token by adding fields from user
            // 4.2 async session({ session, token }}
                    // modify session by adding fields from token
// ]


// 5. pages [ (it is an array that contains the routes for the app )
            // 5.1 signIn
            // 5.2 signOut
// ]

// 6. secret(nextauth secret)

// last const handler = NextAuth(authOptions as any);
// export { handler as GET, handler as POST };
