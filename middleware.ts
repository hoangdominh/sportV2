export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/events/:path*", "/transactions/:path*", "/users/:path*"]
};
