import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      username: string;
      role: "admin" | "member";
    };
  }

  interface User {
    id: string;
    username: string;
    role: "admin" | "member";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: "admin" | "member";
  }
}
