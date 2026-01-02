import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSellHistorySchema = z.object({
  amount: z.number().int().positive().optional(),
  soldPrice: z.number().positive().optional(),
  createdAt: z.string().datetime().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sellHistoryId = parseInt(id);

    if (isNaN(sellHistoryId)) {
      return NextResponse.json(
        { error: "Invalid sell history ID" },
        { status: 400 }
      );
    }

    const sellHistory = await prisma.sellHistory.findUnique({
      where: { id: sellHistoryId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        service: true,
        transaction: true,
        debitItem: {
          include: {
            debit: true,
          },
        },
      },
    });

    if (!sellHistory) {
      return NextResponse.json(
        { error: "Sell history not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(sellHistory);
  } catch (error) {
    console.error("Error fetching sell history:", error);
    return NextResponse.json(
      { error: "Failed to fetch sell history" },
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
    const sellHistoryId = parseInt(id);

    if (isNaN(sellHistoryId)) {
      return NextResponse.json(
        { error: "Invalid sell history ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateSellHistorySchema.parse(body);

    // Get current sell history entry
    const currentSellHistory = await prisma.sellHistory.findUnique({
      where: { id: sellHistoryId },
      include: {
        product: true,
        service: true,
      },
    });

    if (!currentSellHistory) {
      return NextResponse.json(
        { error: "Sell history not found" },
        { status: 404 }
      );
    }

    // Calculate new values
    const newAmount = validatedData.amount ?? currentSellHistory.amount;
    const newSoldPrice =
      validatedData.soldPrice ?? currentSellHistory.soldPrice;
    const newTotalPrice = newAmount * newSoldPrice;
    const newCreatedAt = validatedData.createdAt
      ? new Date(validatedData.createdAt)
      : currentSellHistory.createdAt;

    // Update in transaction to handle product/service updates
    const result = await prisma.$transaction(async (tx) => {
      // Update sell history
      const updatedSellHistory = await tx.sellHistory.update({
        where: { id: sellHistoryId },
        data: {
          amount: newAmount,
          soldPrice: newSoldPrice,
          totalPrice: newTotalPrice,
          createdAt: newCreatedAt,
        },
      });

      // If it's a product sale, update product quantities and totals
      if (currentSellHistory.productId && currentSellHistory.product) {
        const product = currentSellHistory.product;
        const oldAmount = currentSellHistory.amount;
        const oldTotalPrice = currentSellHistory.totalPrice;
        const oldInitialPrice =
          currentSellHistory.initialPrice ?? product.initialPrice;

        // Calculate differences
        const quantityDiff = oldAmount - newAmount;
        const totalSoldDiff = oldAmount - newAmount;
        const revenueDiff = oldTotalPrice - newTotalPrice;
        const profitDiff =
          oldTotalPrice -
          oldInitialPrice * oldAmount -
          (newTotalPrice - oldInitialPrice * newAmount);

        await tx.product.update({
          where: { id: product.id },
          data: {
            quantity: product.quantity + quantityDiff,
            totalSold: product.totalSold - totalSoldDiff,
            revenue: product.revenue - revenueDiff,
            profit: product.profit - profitDiff,
          },
        });
      }

      // If it's a service sale, update service totals
      if (currentSellHistory.serviceId && currentSellHistory.service) {
        const service = currentSellHistory.service;
        const oldAmount = currentSellHistory.amount;
        const oldTotalPrice = currentSellHistory.totalPrice;

        const totalSoldDiff = oldAmount - newAmount;
        const revenueDiff = oldTotalPrice - newTotalPrice;

        await tx.service.update({
          where: { id: service.id },
          data: {
            totalSold: service.totalSold - totalSoldDiff,
            revenue: service.revenue - revenueDiff,
          },
        });
      }

      // Update transaction totals if this sale is part of a transaction
      if (currentSellHistory.transactionId) {
        const transaction = await tx.transaction.findUnique({
          where: { id: currentSellHistory.transactionId },
          include: {
            sellHistory: true,
          },
        });

        if (transaction) {
          const oldTotalPrice = currentSellHistory.totalPrice;
          const revenueDiff = oldTotalPrice - newTotalPrice;

          // Recalculate transaction totals
          const allSellHistory = transaction.sellHistory;
          const totalRevenue = allSellHistory.reduce(
            (sum, sh) =>
              sum + (sh.id === sellHistoryId ? newTotalPrice : sh.totalPrice),
            0
          );

          // Calculate total profit
          let totalProfit = 0;
          for (const sh of allSellHistory) {
            if (sh.id === sellHistoryId) {
              if (sh.productId) {
                const initialPrice =
                  sh.initialPrice ??
                  currentSellHistory.product?.initialPrice ??
                  0;
                totalProfit += newTotalPrice - initialPrice * newAmount;
              } else if (sh.serviceId) {
                totalProfit += newTotalPrice; // Services have no cost
              }
            } else {
              if (sh.productId) {
                const initialPrice = sh.initialPrice ?? 0;
                totalProfit += sh.totalPrice - initialPrice * sh.amount;
              } else if (sh.serviceId) {
                totalProfit += sh.totalPrice;
              }
            }
          }

          await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              totalRevenue,
              totalProfit,
            },
          });
        }
      }

      return updatedSellHistory;
    });

    // Fetch updated sell history with relations
    const updatedWithRelations = await prisma.sellHistory.findUnique({
      where: { id: sellHistoryId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        service: true,
        transaction: true,
        debitItem: {
          include: {
            debit: true,
          },
        },
      },
    });

    return NextResponse.json(updatedWithRelations);
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
        { error: "Sell history not found" },
        { status: 404 }
      );
    }

    console.error("Error updating sell history:", error);
    return NextResponse.json(
      { error: "Failed to update sell history" },
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
    const sellHistoryId = parseInt(id);

    if (isNaN(sellHistoryId)) {
      return NextResponse.json(
        { error: "Invalid sell history ID" },
        { status: 400 }
      );
    }

    // Get sell history entry before deletion
    const sellHistory = await prisma.sellHistory.findUnique({
      where: { id: sellHistoryId },
      include: {
        product: true,
        service: true,
        transaction: true,
        debitItem: true,
      },
    });

    if (!sellHistory) {
      return NextResponse.json(
        { error: "Sell history not found" },
        { status: 404 }
      );
    }

    // Check if it's part of a debit
    if (sellHistory.debitItem) {
      return NextResponse.json(
        {
          error:
            "Cannot delete sell history entry that is part of a debit. Please remove it from the debit first.",
        },
        { status: 400 }
      );
    }

    // Delete in transaction to handle rollbacks
    await prisma.$transaction(async (tx) => {
      // Rollback product/service quantities and totals
      if (sellHistory.productId && sellHistory.product) {
        const product = sellHistory.product;
        const initialPrice = sellHistory.initialPrice ?? product.initialPrice;
        const cost = initialPrice * sellHistory.amount;
        const profit = sellHistory.totalPrice - cost;

        await tx.product.update({
          where: { id: product.id },
          data: {
            quantity: product.quantity + sellHistory.amount,
            totalSold: product.totalSold - sellHistory.amount,
            revenue: product.revenue - sellHistory.totalPrice,
            profit: product.profit - profit,
          },
        });
      }

      if (sellHistory.serviceId && sellHistory.service) {
        const service = sellHistory.service;

        await tx.service.update({
          where: { id: service.id },
          data: {
            totalSold: service.totalSold - sellHistory.amount,
            revenue: service.revenue - sellHistory.totalPrice,
          },
        });
      }

      // Update transaction totals if this sale is part of a transaction
      if (sellHistory.transactionId) {
        const transaction = await tx.transaction.findUnique({
          where: { id: sellHistory.transactionId },
          include: {
            sellHistory: true,
          },
        });

        if (transaction) {
          const remainingHistory = transaction.sellHistory.filter(
            (sh) => sh.id !== sellHistoryId
          );

          if (remainingHistory.length === 0) {
            // Delete transaction if no more sales
            await tx.transaction.delete({
              where: { id: transaction.id },
            });
          } else {
            // Recalculate transaction totals
            const totalRevenue = remainingHistory.reduce(
              (sum, sh) => sum + sh.totalPrice,
              0
            );

            let totalProfit = 0;
            for (const sh of remainingHistory) {
              if (sh.productId) {
                const initialPrice = sh.initialPrice ?? 0;
                totalProfit += sh.totalPrice - initialPrice * sh.amount;
              } else if (sh.serviceId) {
                totalProfit += sh.totalPrice; // Services have no cost
              }
            }

            await tx.transaction.update({
              where: { id: transaction.id },
              data: {
                totalRevenue,
                totalProfit,
              },
            });
          }
        }
      }

      // Delete the sell history entry
      await tx.sellHistory.delete({
        where: { id: sellHistoryId },
      });
    });

    return NextResponse.json({ message: "Sell history deleted successfully" });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Sell history not found" },
        { status: 404 }
      );
    }

    console.error("Error deleting sell history:", error);
    return NextResponse.json(
      { error: "Failed to delete sell history" },
      { status: 500 }
    );
  }
}
