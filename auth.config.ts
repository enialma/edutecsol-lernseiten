// Edge-tauglicher Teil der Auth-Konfiguration (wird auch in der Middleware geladen).
import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

export default {
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER ?? "https://login.microsoftonline.com/common/v2.0",
    }),
  ],
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  callbacks: {
    authorized({ auth, request }) {
      const p = request.nextUrl.pathname;
      const loggedIn = !!auth?.user;
      if (p.startsWith("/admin")) return loggedIn && auth?.user?.role === "admin";
      if (p.startsWith("/app")) return loggedIn;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.uid = user.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = (token.role as "user" | "admin") ?? "user";
      session.user.id = String(token.uid ?? "");
      return session;
    },
  },
} satisfies NextAuthConfig;
