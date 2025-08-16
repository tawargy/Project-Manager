import { authOptions } from "@/lib/auth/authOptions";
import { getServerSession } from "next-auth";

async function auth() {
  const session = await getServerSession(authOptions);
  return session;
}
export default auth;
