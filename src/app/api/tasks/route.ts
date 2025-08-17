import db from "@/lib/db";
import { NextResponse } from "next/server";
import * as z from "zod";
import auth from "@/lib/auth";

const taskSchema = z.object({
  title: z.string().min(3, "Task title must have more than 3 characters"),
  description: z.string().optional(),
  priority: z.string(),
  status: z.string(),
  assignedToId: z.string().optional(),
  projectId: z.string(),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "You are not authorized to perform this action" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { message: "Project ID is required" },
        { status: 400 }
      );
    }

    const tasks = await db.task.findMany({
      where: {
        projectId,
      },
      include: {
        assignedTo: true,
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (
      session?.user?.role !== "Admin" &&
      session?.user?.role !== "ProjectManager"
    ) {
      return NextResponse.json(
        { message: "You are not authorized to perform this action" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, priority, status, assignedToId, projectId } =
      taskSchema.parse(body);

    const newTask = await db.task.create({
      data: {
        title,
        description,
        priority,
        status,
        assignedToId,
        projectId,
      },
    });

    return NextResponse.json(
      {
        task: newTask,
        message: "Task created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
