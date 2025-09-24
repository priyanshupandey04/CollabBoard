// middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*", // protect dashboard and subroutes
    "/rooms/:path*",      // protect your whiteboard rooms
  ],
};
