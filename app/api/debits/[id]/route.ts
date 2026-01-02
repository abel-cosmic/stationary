import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateDebitSchema = z.object({
  customerName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paidAmount: z.number().min(0).optional(),
});

export async function GET(
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

    const debit = await prisma.debit.findUnique({
      where: { id: debitId },
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

    if (!debit) {
      return NextResponse.json({ error: "Debit not found" }, { status: 404 });
    }

    return NextResponse.json(debit);
  } catch (error) {
    console.error("Error fetching debit:", error);
    return NextResponse.json(
      { error: "Failed to fetch debit" },
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
    const debitId = parseInt(id);

    if (isNaN(debitId)) {
      return NextResponse.json(
        { error: "Invalid debit ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateDebitSchema.parse(body);

    // Get current debit to validate paidAmount
    const currentDebit = await prisma.debit.findUnique({
      where: { id: debitId },
    });

    if (!currentDebit) {
      return NextResponse.json({ error: "Debit not found" }, { status: 404 });
    }

    const paidAmount =
      validatedData.paidAmount !== undefined
        ? validatedData.paidAmount
        : currentDebit.paidAmount;

    if (paidAmount > currentDebit.totalAmount) {
      return NextResponse.json(
        { error: "Paid amount cannot exceed total amount" },
        { status: 400 }
      );
    }

    // Calculate status
    let status: "PENDING" | "PARTIAL" | "PAID" = "PENDING";
    let paidAt: Date | null = null;

    if (paidAmount >= currentDebit.totalAmount) {
      status = "PAID";
      paidAt = currentDebit.paidAt || new Date();
    } else if (paidAmount > 0) {
      status = "PARTIAL";
    }

    const debit = await prisma.debit.update({
      where: { id: debitId },
      data: {
        ...(validatedData.customerName !== undefined && {
          customerName: validatedData.customerName,
        }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
        ...(validatedData.paidAmount !== undefined && {
          paidAmount,
          status,
          paidAt,
        }),
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

    console.error("Error updating debit:", error);
    return NextResponse.json(
      { error: "Failed to update debit" },
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
    const debitId = parseInt(id);

    if (isNaN(debitId)) {
      return NextResponse.json(
        { error: "Invalid debit ID" },
        { status: 400 }
      );
    }

    await prisma.debit.delete({
      where: { id: debitId },
    });

    return NextResponse.json({ message: "Debit deleted successfully" });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Debit not found" }, { status: 404 });
    }

    console.error("Error deleting debit:", error);
    return NextResponse.json(
      { error: "Failed to delete debit" },
      { status: 500 }
    );
  }
}

