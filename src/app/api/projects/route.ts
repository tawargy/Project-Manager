import db from "@/lib/db";
import { NextResponse } from "next/server";
import * as z from "zod";
import auth from "@/lib/auth";

const projectSchema = z.object({
  name: z.string().min(3, "Project name must have more than 3 characters"),
  status: z.string(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid end date",
  }),
  progress: z.number().min(0).max(100),
  budget: z.number().min(0),
  memberIds: z.array(z.string()),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "You are not authorized to perform this action" },
        { status: 403 }
      );
    }
    const projects = await db.project.findMany({
      include: {
        members: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            assignedTo: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      // include: {
      //   members: true,
      //   tasks: true,
      // },
    });
    return NextResponse.json({ projects });
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
    console.log("bbbbbb", body, db);

    const { name, status, startDate, endDate, progress, budget, memberIds } =
      projectSchema.parse(body);

    const newProject = await db.project.create({
      data: {
        name,
        status,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        progress,
        budget,
        members: {
          connect: memberIds.map((id: string) => ({ id })),
        },
      },
    });

    return NextResponse.json(
      {
        project: newProject,
        message: "Project created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
