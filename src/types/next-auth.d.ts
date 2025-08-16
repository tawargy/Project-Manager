import NextAuth, { DefaultUser, DefaultSession } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username: string;
      role: string | null;
      email: string;
    };
  }

  interface User extends DefaultUser {
    role: string | null;
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string | null;
    username: string;
  }
}
