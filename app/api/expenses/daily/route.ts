import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createDailyExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  expenseDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) {
        where.expenseDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.expenseDate.lte = new Date(endDate);
      }
    }

    const expenses = await prisma.dailyExpense.findMany({
      where,
      orderBy: {
        expenseDate: "desc",
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching daily expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createDailyExpenseSchema.parse(body);

    const expense = await prisma.dailyExpense.create({
      data: {
        description: validatedData.description,
        amount: validatedData.amount,
        category: validatedData.category ?? null,
        notes: validatedData.notes ?? null,
        expenseDate: validatedData.expenseDate
          ? new Date(validatedData.expenseDate)
          : new Date(),
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

    console.error("Error creating daily expense:", error);
    return NextResponse.json(
      { error: "Failed to create daily expense" },
      { status: 500 }
    );
  }
}
