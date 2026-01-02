import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const payDebitSchema = z.object({
  amount: z.number().positive("Payment amount must be positive"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const debitId = parseInt(id);

    if (isNaN(debitId)) {
      return NextResponse.json(
        { error: "Invalid debit ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = payDebitSchema.parse(body);

    // Get current debit
    const currentDebit = await prisma.debit.findUnique({
      where: { id: debitId },
    });

    if (!currentDebit) {
      return NextResponse.json({ error: "Debit not found" }, { status: 404 });
    }

    const newPaidAmount = currentDebit.paidAmount + validatedData.amount;

    if (newPaidAmount > currentDebit.totalAmount) {
      return NextResponse.json(
        {
          error: `Payment amount would exceed total amount. Maximum payment: ${currentDebit.totalAmount - currentDebit.paidAmount}`,
        },
        { status: 400 }
      );
    }

    // Calculate status
    let status: "PENDING" | "PARTIAL" | "PAID" = "PARTIAL";
    let paidAt: Date | null = currentDebit.paidAt;

    if (newPaidAmount >= currentDebit.totalAmount) {
      status = "PAID";
      paidAt = new Date();
    }

    const debit = await prisma.debit.update({
      where: { id: debitId },
      data: {
        paidAmount: newPaidAmount,
        status,
        paidAt,
      },
      include: {
        debitItems: {
          include: {
            sellHistory: {
              include: {
                product: {
                  include: {
                    category: true,
                  },
                },
                service: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(debit);
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
      return NextResponse.json({ error: "Debit not found" }, { status: 404 });
    }

    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}

