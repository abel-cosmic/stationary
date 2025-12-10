import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sellProductSchema = z.object({
  amount: z.number().int().positive("Amount must be a positive integer"),
  soldPrice: z.number().positive("Sold price must be positive"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = sellProductSchema.parse(body);
    const { amount, soldPrice } = validatedData;

    // Get the product first to check quantity
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.quantity < amount) {
      return NextResponse.json(
        { error: "Insufficient quantity available" },
        { status: 400 }
      );
    }

    // Calculate new values using the provided soldPrice
    const newQuantity = product.quantity - amount;
    const newTotalSold = product.totalSold + amount;
    const revenueIncrease = soldPrice * amount;
    const newRevenue = product.revenue + revenueIncrease;
    const newProfit = newRevenue - product.initialPrice * newTotalSold;

    // Update product and create sell history in a transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(async (tx: any) => {
      // Update product
      await tx.product.update({
        where: { id: productId },
        data: {
          quantity: newQuantity,
          totalSold: newTotalSold,
          revenue: newRevenue,
          profit: newProfit,
        },
      });

      // Create sell history record
      await tx.sellHistory.create({
        data: {
          productId: productId,
          amount: amount,
          soldPrice: soldPrice,
          totalPrice: revenueIncrease,
        },
      });
    });

    // Fetch the updated product with sell history
    const productWithHistory = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        sellHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json(productWithHistory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error selling product:", error);
    return NextResponse.json(
      { error: "Failed to sell product" },
      { status: 500 }
    );
  }
}
