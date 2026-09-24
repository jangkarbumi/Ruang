import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Augment NextAuth types untuk menyisipkan `role` ke session.
 * Implementasi penuh dilakukan di fase Auth (fase berikutnya).
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string; // TODO: ganti dengan enum Role dari Prisma setelah fase Auth
    } & DefaultSession["user"];
  }

  interface User {
    role?: string; // TODO: ganti dengan enum Role dari Prisma setelah fase Auth
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TODO (fase Auth): Implementasikan verifikasi credentials
        // 1. Query user dari database berdasarkan credentials.email
        // 2. Verifikasi password dengan bcrypt.compare()
        // 3. Cek accountStatus === "ACTIVE"
        // 4. Return user object jika valid, null jika tidak
        console.log("authorize() called with email:", credentials?.email);
        return null;
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      // TODO (fase Auth): Sisipkan role ke JWT token saat login
      if (user) {
        token.id = user.id;
        token.role = user.role; // TODO: pastikan user.role diisi dari DB
      }
      return token;
    },

    async session({ session, token }) {
      // TODO (fase Auth): Transfer role dari token ke session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  // TODO (fase Auth): Tambahkan pages custom login jika diperlukan
  // pages: {
  //   signIn: "/login",
  // },
});
