import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sellServiceSchema = z.object({
  amount: z.number().int().positive("Amount must be a positive integer"),
  soldPrice: z.number().positive("Sold price must be positive"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const serviceId = parseInt(id);

    if (isNaN(serviceId)) {
      return NextResponse.json(
        { error: "Invalid service ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = sellServiceSchema.parse(body);
    const { amount, soldPrice } = validatedData;

    // Get the service first
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Calculate new values
    const newTotalSold = service.totalSold + amount;
    const revenueIncrease = soldPrice * amount;
    const newRevenue = service.revenue + revenueIncrease;

    // Update service and create sell history in a transaction
    await prisma.$transaction(async (tx) => {
      // Update service
      await tx.service.update({
        where: { id: serviceId },
        data: {
          totalSold: newTotalSold,
          revenue: newRevenue,
        },
      });

      // Create sell history record (no initialPrice for services)
      await tx.sellHistory.create({
        data: {
          serviceId: serviceId,
          amount: amount,
          soldPrice: soldPrice,
          totalPrice: revenueIncrease,
          initialPrice: null, // Services don't have initial price
        },
      });
    });

    // Fetch the updated service with sell history
    const serviceWithHistory = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        sellHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json(serviceWithHistory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error selling service:", error);
    return NextResponse.json(
      { error: "Failed to sell service" },
      { status: 500 }
    );
  }
}
