import db from "@/lib/db";
import { NextResponse } from "next/server";
import * as z from "zod";
import auth from "@/lib/auth";

const TaskPriority = ["Low", "Medium", "High"] as const;
const TaskStatus = ["Todo", "In Progress", "Review", "Done"] as const;

type TaskUpdateData = {
  title: string;
  description?: string;
  priority: (typeof TaskPriority)[number];
  status: (typeof TaskStatus)[number];
  assignedTo?: {
    connect?: { id: string };
    disconnect?: boolean;
  };
};

const taskSchema = z.object({
  title: z.string().min(3, "Task title must have more than 3 characters"),
  description: z.string().optional(),
  priority: z.enum(TaskPriority),
  status: z.enum(TaskStatus),
  assignedToId: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "You are not authorized to perform this action" },
        { status: 403 }
      );
    }

    const task = await db.task.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            members: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "You are not authorized to perform this action" },
        { status: 403 }
      );
    }

    const task = await db.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    const canUpdate =
      session.user.role === "Admin" ||
      session.user.role === "ProjectManager" ||
      session.user.id === task.assignedToId;

    if (!canUpdate) {
      return NextResponse.json(
        { message: "You are not authorized to perform this action" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, priority, status, assignedToId } =
      taskSchema.parse(body);

    // Handle assignedTo relationship
    const updateData: TaskUpdateData = {
      title,
      description,
      priority: priority as (typeof TaskPriority)[number],
      status: status as (typeof TaskStatus)[number],
    };

    if (assignedToId === null) {
      // Remove assignment
      updateData.assignedTo = { disconnect: true };
    } else if (assignedToId) {
      // Update or set assignment
      updateData.assignedTo = { connect: { id: assignedToId } };
    }

    const updatedTask = await db.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        task: updatedTask,
        message: "Task updated successfully",
      },
      { status: 200 }
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    await db.task.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
