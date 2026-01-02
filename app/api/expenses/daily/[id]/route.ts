import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateDailyExpenseSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  category: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  expenseDate: z.string().datetime().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expenseId = parseInt(id);

    if (isNaN(expenseId)) {
      return NextResponse.json(
        { error: "Invalid expense ID" },
        { status: 400 }
      );
    }

    const expense = await prisma.dailyExpense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Daily expense not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error fetching daily expense:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily expense" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expenseId = parseInt(id);

    if (isNaN(expenseId)) {
      return NextResponse.json(
        { error: "Invalid expense ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateDailyExpenseSchema.parse(body);

    const expense = await prisma.dailyExpense.update({
      where: { id: expenseId },
      data: {
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
        ...(validatedData.amount !== undefined && {
          amount: validatedData.amount,
        }),
        ...(validatedData.category !== undefined && {
          category: validatedData.category,
        }),
        ...(validatedData.notes !== undefined && {
          notes: validatedData.notes,
        }),
        ...(validatedData.expenseDate !== undefined && {
          expenseDate: new Date(validatedData.expenseDate),
        }),
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Daily expense not found" },
        { status: 404 }
      );
    }

    console.error("Error updating daily expense:", error);
    return NextResponse.json(
      { error: "Failed to update daily expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expenseId = parseInt(id);

    if (isNaN(expenseId)) {
      return NextResponse.json(
        { error: "Invalid expense ID" },
        { status: 400 }
      );
    }

    await prisma.dailyExpense.delete({
      where: { id: expenseId },
    });

    return NextResponse.json({ message: "Daily expense deleted successfully" });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Daily expense not found" },
        { status: 404 }
      );
    }

    console.error("Error deleting daily expense:", error);
    return NextResponse.json(
      { error: "Failed to delete daily expense" },
      { status: 500 }
    );
  }
}
