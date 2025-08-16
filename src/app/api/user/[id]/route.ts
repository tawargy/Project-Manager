import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { role } = body;

    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }

    if (role === undefined) {
      return NextResponse.json({ message: "Missing role" }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: { role },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("[USER_PATCH] Error updating user:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Internal Server Error", error: error.message },
        { status: 500 },
      );
    }
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }

    await db.user.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("[USER_DELETE] Error deleting user:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Internal Server Error", error: error.message },
        { status: 500 },
      );
    }
  }
}
