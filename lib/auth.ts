import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getDb } from "./mongodb";
import type { UserDoc } from "./types";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) return null;

        const startedAt = performance.now();
        let dbReadyMs: number | undefined;
        let userLookupMs: number | undefined;
        let passwordCheckMs: number | undefined;
        let stage = "database_connect";

        try {
          const dbStartedAt = performance.now();
          const db = await getDb();
          dbReadyMs = performance.now() - dbStartedAt;

          stage = "user_lookup";
          const lookupStartedAt = performance.now();
          const user = await db
            .collection<UserDoc>("users")
            .findOne({ username: credentials.username.trim().toLowerCase() });
          userLookupMs = performance.now() - lookupStartedAt;

          if (!user) return null;

          stage = "password_check";
          const passwordStartedAt = performance.now();
          const passwordValid = await bcrypt.compare(credentials.password, user.passwordHash);
          passwordCheckMs = performance.now() - passwordStartedAt;
          if (!passwordValid) return null;

          stage = "complete";
          return {
            id: user._id.toString(),
            name: user.name,
            username: user.username,
            role: user.role
          };
        } finally {
          // Separate database and password timings without logging user identity or credentials.
          console.info("auth.credentials.timing", {
            stage,
            dbReadyMs: dbReadyMs === undefined ? undefined : Math.round(dbReadyMs),
            userLookupMs: userLookupMs === undefined ? undefined : Math.round(userLookupMs),
            passwordCheckMs: passwordCheckMs === undefined ? undefined : Math.round(passwordCheckMs),
            totalMs: Math.round(performance.now() - startedAt)
          });
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        name: token.name ?? token.username,
        username: token.username,
        role: token.role
      };
      return session;
    }
  }
};
