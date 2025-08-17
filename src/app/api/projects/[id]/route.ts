import db from "@/lib/db";
import { NextResponse } from "next/server";
import * as z from "zod";
import auth from "@/lib/auth";

const projectSchema = z.object({
  name: z
    .string()
    .min(3, "Project name must have more than 3 characters")
    .optional(),
  status: z.string().optional(),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid start date",
    })
    .optional(),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid end date",
    })
    .optional(),
  progress: z.number().min(0).max(100).optional(),
  budget: z.number().min(0).optional(),
  memberIds: z
    .preprocess(
      (val) => (Array.isArray(val) ? val.map((v) => String(v)) : []),
      z.array(z.string().nonempty("Member ID cannot be empty")),
    )
    .default([]),
});

export async function GET(request: any, context: any) {
  try {
    const params = await (context.params || context.params);
    const id = params.id;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "You are not authorized to perform this action" },
        { status: 403 },
      );
    }

    const project = await db.project.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
        tasks: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function PUT(request: any, context: any) {
  try {
    const params = await (context.params || context.params);
    const id = params.id;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "You must be logged in to perform this action" },
        { status: 401 },
      );
    }

    if (
      session.user.role !== "Admin" &&
      session.user.role !== "ProjectManager"
    ) {
      return NextResponse.json(
        { message: "Only Admins and Project Managers can update projects" },
        { status: 403 },
      );
    }

    const body = await request.json();
    console.log("Received update body:", body);

    const currentProject = await db.project.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!currentProject) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    const validatedData = projectSchema.parse(body);

    const updateData: any = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;
    if (validatedData.startDate !== undefined)
      updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate !== undefined)
      updateData.endDate = new Date(validatedData.endDate);
    if (validatedData.progress !== undefined)
      updateData.progress = validatedData.progress;
    if (validatedData.budget !== undefined)
      updateData.budget = validatedData.budget;

    if (validatedData.memberIds && validatedData.memberIds.length > 0) {
      updateData.members = {
        set: validatedData.memberIds.map((id) => ({ id: String(id) })),
      };
    }

    const updatedProject = await db.project.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      {
        project: updatedProject,
        message: "Project updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: any, context: any) {
  try {
    const params = await (context.params || context.params);
    const id = params.id;

    const session = await auth();
    if (session?.user?.role !== "Admin") {
      return NextResponse.json(
        { message: "You are not authorized to perform this action" },
        { status: 403 },
      );
    }

    await db.project.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
