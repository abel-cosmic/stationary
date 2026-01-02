import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSupplyExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  supplier: z.string().optional().nullable(),
  quantity: z.number().int().positive().optional().nullable(),
  unitPrice: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const expenses = await prisma.supplyExpense.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching supply expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch supply expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createSupplyExpenseSchema.parse(body);

    const expense = await prisma.supplyExpense.create({
      data: {
        description: validatedData.description,
        amount: validatedData.amount,
        supplier: validatedData.supplier ?? null,
        quantity: validatedData.quantity ?? null,
        unitPrice: validatedData.unitPrice ?? null,
        notes: validatedData.notes ?? null,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating supply expense:", error);
    return NextResponse.json(
      { error: "Failed to create supply expense" },
      { status: 500 }
    );
  }
}
