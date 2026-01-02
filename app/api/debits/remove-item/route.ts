import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const removeItemSchema = z.object({
  sellHistoryId: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = removeItemSchema.parse(body);

    // Find the debit item
    const debitItem = await prisma.debitItem.findUnique({
      where: {
        sellHistoryId: validatedData.sellHistoryId,
      },
      include: {
        debit: true,
      },
    });

    if (!debitItem) {
      return NextResponse.json(
        { error: "Debit item not found" },
        { status: 404 }
      );
    }

    const debitId = debitItem.debitId;
    const debitAmount = debitItem.amount;

    // Remove the debit item and update the debit in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the debit item
      await tx.debitItem.delete({
        where: {
          sellHistoryId: validatedData.sellHistoryId,
        },
      });

      // Get updated debit items
      const remainingItems = await tx.debitItem.findMany({
        where: { debitId },
      });

      // Recalculate debit totals
      const newTotalAmount = remainingItems.reduce(
        (sum, item) => sum + item.amount,
        0
      );

      const currentDebit = await tx.debit.findUnique({
        where: { id: debitId },
      });

      if (!currentDebit) {
        throw new Error("Debit not found");
      }

      // Adjust paid amount if necessary
      let newPaidAmount = currentDebit.paidAmount;
      if (newPaidAmount > newTotalAmount) {
        newPaidAmount = newTotalAmount;
      }

      // Recalculate status
      let status: "PENDING" | "PARTIAL" | "PAID" = "PENDING";
      let paidAt: Date | null = currentDebit.paidAt;

      if (newPaidAmount >= newTotalAmount && newTotalAmount > 0) {
        status = "PAID";
        paidAt = paidAt || new Date();
      } else if (newPaidAmount > 0) {
        status = "PARTIAL";
      } else {
        paidAt = null;
      }

      // Update or delete the debit
      if (remainingItems.length === 0) {
        // Delete debit if no items left
        await tx.debit.delete({
          where: { id: debitId },
        });
      } else {
        // Update debit totals
        await tx.debit.update({
          where: { id: debitId },
          data: {
            totalAmount: newTotalAmount,
            paidAmount: newPaidAmount,
            status,
            paidAt,
          },
        });
      }
    });

    return NextResponse.json({
      message: "Sell history removed from debit successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error removing item from debit:", error);
    return NextResponse.json(
      { error: "Failed to remove item from debit" },
      { status: 500 }
    );
  }
}

