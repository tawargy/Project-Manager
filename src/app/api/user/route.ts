import db from "@/lib/db";
import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import * as z from "zod";
import auth from "@/lib/auth";

const userSchema = z.object({
  username: z.string().min(3, "Username must have than 3 characters").max(10),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must have than 6 characters"),
});

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "Admin") {
      return NextResponse.json(
        { message: "You are not authorized to perform this action" },
        { status: 403 },
      );
    }
    const users = await db.user.findMany();
    return NextResponse.json({ users: users });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, username, password } = userSchema.parse(body);
    console.log(email, password, username);

    const existingUserByEmail = await db.user.findUnique({
      where: { email: email },
    });
    if (existingUserByEmail) {
      return NextResponse.json(
        { user: null, message: "User with this email already exists" },
        { status: 409 },
      );
    }

    const existingUserByUsername = await db.user.findUnique({
      where: { username: username },
    });
    if (existingUserByUsername) {
      return NextResponse.json(
        { user: null, message: "User with this username already exists" },
        { status: 409 },
      );
    }
    const hashPassord = await hash(password, 10);
    const newUser = await db.user.create({
      data: {
        username,
        email,
        password: hashPassord,
      },
    });
    const { password: newUserPassword, ...rest } = newUser;
    return NextResponse.json(
      {
        user: rest,
        message: "user created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { message: "An unknown error occurred" },
      { status: 500 },
    );
  }
}
