import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createDebitSchema = z.object({
  customerName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  debitItems: z
    .array(
      z.object({
        sellHistoryId: z.number().int().positive(),
        amount: z.number().positive(),
      })
    )
    .min(1, "At least one debit item is required"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (status && ["PENDING", "PARTIAL", "PAID"].includes(status)) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const debits = await prisma.debit.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(debits);
  } catch (error) {
    console.error("Error fetching debits:", error);
    return NextResponse.json(
      { error: "Failed to fetch debits" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createDebitSchema.parse(body);

    // Validate all sell history entries exist and calculate total
    const sellHistoryIds = validatedData.debitItems.map(
      (item) => item.sellHistoryId
    );
    const sellHistoryEntries = await prisma.sellHistory.findMany({
      where: {
        id: { in: sellHistoryIds },
      },
      include: {
        debitItem: true,
      },
    });

    if (sellHistoryEntries.length !== sellHistoryIds.length) {
      return NextResponse.json(
        { error: "One or more sell history entries not found" },
        { status: 404 }
      );
    }

    // Check if any sell history entry is already part of a debit
    const alreadyInDebit = sellHistoryEntries.find((entry) => entry.debitItem);
    if (alreadyInDebit) {
      return NextResponse.json(
        {
          error: `Sell history entry ${alreadyInDebit.id} is already part of a debit`,
        },
        { status: 400 }
      );
    }

    // Validate amounts don't exceed sell history total prices
    for (const item of validatedData.debitItems) {
      const sellHistory = sellHistoryEntries.find(
        (sh) => sh.id === item.sellHistoryId
      );
      if (!sellHistory) continue;

      if (item.amount > sellHistory.totalPrice) {
        return NextResponse.json(
          {
            error: `Amount for sell history ${item.sellHistoryId} exceeds total price of ${sellHistory.totalPrice}`,
          },
          { status: 400 }
        );
      }
    }

    // Calculate total amount
    const totalAmount = validatedData.debitItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    // Create debit with items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const debit = await tx.debit.create({
        data: {
          totalAmount,
          paidAmount: 0,
          status: "PENDING",
          customerName: validatedData.customerName ?? null,
          notes: validatedData.notes ?? null,
        },
      });

      await Promise.all(
        validatedData.debitItems.map((item) =>
          tx.debitItem.create({
            data: {
              debitId: debit.id,
              sellHistoryId: item.sellHistoryId,
              amount: item.amount,
            },
          })
        )
      );

      return debit;
    });

    // Fetch the complete debit with relations
    const debitWithRelations = await prisma.debit.findUnique({
      where: { id: result.id },
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

    return NextResponse.json(debitWithRelations, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating debit:", error);
    return NextResponse.json(
      { error: "Failed to create debit" },
      { status: 500 }
    );
  }
}
