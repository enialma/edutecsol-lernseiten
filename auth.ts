import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "./auth.config";
import { touchLogin, verifyPassword } from "./lib/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Passwort",
      credentials: { email: { label: "E-Mail" }, password: { label: "Passwort", type: "password" } },
      async authorize(c) {
        const email = String(c?.email ?? "");
        const password = String(c?.password ?? "");
        if (!email || !password) return null;
        const u = await verifyPassword(email, password);
        if (!u) return null;
        return { id: String(u.id), email: u.email, name: u.name, role: u.role };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // O365-Login: nur freigeschaltete E-Mail-Adressen dürfen hinein.
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      const email = user.email ?? "";
      const u = await touchLogin(email, user.name ?? null, account?.provider ?? "oauth");
      if (!u) return "/login?error=NotAllowed";
      user.role = u.role;
      user.id = String(u.id);
      return true;
    },
  },
});
