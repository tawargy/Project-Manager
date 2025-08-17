import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Return user data from session
    return NextResponse.json({
      user: {
        id: session.user.id,
        username: session.user.username,
        email: session.user.email,
        role: session.user.role,
      },
    });
  } catch (error) {
    console.error("[USER_GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
