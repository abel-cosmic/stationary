import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bulkSellItemSchema = z.object({
  productId: z.number().int().positive("Product ID must be a positive integer"),
  amount: z.number().int().positive("Amount must be a positive integer"),
  soldPrice: z.number().positive("Sold price must be positive"),
});

const bulkSellSchema = z.object({
  items: z
    .array(bulkSellItemSchema)
    .min(1, "At least one item is required")
    .max(100, "Maximum 100 items per transaction"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = bulkSellSchema.parse(body);
    const { items } = validatedData;

    // Validate all products exist and have sufficient quantity
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products not found" },
        { status: 404 }
      );
    }

    // Create a map for quick lookup
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate quantities
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 404 }
        );
      }
      if (product.quantity < item.amount) {
        return NextResponse.json(
          {
            error: `Insufficient quantity for product "${product.name}". Available: ${product.quantity}, Requested: ${item.amount}`,
          },
          { status: 400 }
        );
      }
    }

    // Process all items in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      let totalRevenue = 0;
      let totalProfit = 0;
      const sellHistoryItems: Array<{
        productId: number;
        amount: number;
        soldPrice: number;
        totalPrice: number;
        initialPrice: number;
      }> = [];

      // Update products and prepare sell history
      for (const item of items) {
        const product = productMap.get(item.productId)!;
        const newQuantity = product.quantity - item.amount;
        const newTotalSold = product.totalSold + item.amount;
        const revenueIncrease = item.soldPrice * item.amount;
        const newRevenue = product.revenue + revenueIncrease;

        // Calculate profit for this specific sale using the product's current initialPrice
        const saleProfit = revenueIncrease - product.initialPrice * item.amount;
        const newProfit = product.profit + saleProfit;

        // Update product
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: newQuantity,
            totalSold: newTotalSold,
            revenue: newRevenue,
            profit: newProfit,
          },
        });

        // Accumulate totals
        totalRevenue += revenueIncrease;
        totalProfit += saleProfit;

        // Prepare sell history item
        sellHistoryItems.push({
          productId: item.productId,
          amount: item.amount,
          soldPrice: item.soldPrice,
          totalPrice: revenueIncrease,
          initialPrice: product.initialPrice, // Store price at time of sale
        });
      }

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          totalRevenue,
          totalProfit,
        },
      });

      // Create all sell history records linked to transaction
      const createdHistory = await Promise.all(
        sellHistoryItems.map((item) =>
          tx.sellHistory.create({
            data: {
              ...item,
              transactionId: transaction.id,
            },
          })
        )
      );

      return { transaction, sellHistory: createdHistory };
    });

    // Fetch the transaction with all related data
    const transactionWithHistory = await prisma.transaction.findUnique({
      where: { id: result.transaction.id },
      include: {
        sellHistory: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json(transactionWithHistory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error processing bulk sell:", error);
    return NextResponse.json(
      { error: "Failed to process bulk sell" },
      { status: 500 }
    );
  }
}
