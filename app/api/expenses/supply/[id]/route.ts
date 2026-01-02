import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSupplyExpenseSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  supplier: z.string().optional().nullable(),
  quantity: z.number().int().positive().optional().nullable(),
  unitPrice: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
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

    const expense = await prisma.supplyExpense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Supply expense not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error fetching supply expense:", error);
    return NextResponse.json(
      { error: "Failed to fetch supply expense" },
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
    const validatedData = updateSupplyExpenseSchema.parse(body);

    const expense = await prisma.supplyExpense.update({
      where: { id: expenseId },
      data: {
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
        ...(validatedData.amount !== undefined && {
          amount: validatedData.amount,
        }),
        ...(validatedData.supplier !== undefined && {
          supplier: validatedData.supplier,
        }),
        ...(validatedData.quantity !== undefined && {
          quantity: validatedData.quantity,
        }),
        ...(validatedData.unitPrice !== undefined && {
          unitPrice: validatedData.unitPrice,
        }),
        ...(validatedData.notes !== undefined && {
          notes: validatedData.notes,
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
        { error: "Supply expense not found" },
        { status: 404 }
      );
    }

    console.error("Error updating supply expense:", error);
    return NextResponse.json(
      { error: "Failed to update supply expense" },
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

    await prisma.supplyExpense.delete({
      where: { id: expenseId },
    });

    return NextResponse.json({
      message: "Supply expense deleted successfully",
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Supply expense not found" },
        { status: 404 }
      );
    }

    console.error("Error deleting supply expense:", error);
    return NextResponse.json(
      { error: "Failed to delete supply expense" },
      { status: 500 }
    );
  }
}
