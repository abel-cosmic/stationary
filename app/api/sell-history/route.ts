import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const serviceId = searchParams.get("serviceId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit");

    const where: any = {};

    if (productId) {
      const parsedProductId = parseInt(productId);
      if (!isNaN(parsedProductId)) {
        where.productId = parsedProductId;
      }
    }

    if (serviceId) {
      const parsedServiceId = parseInt(serviceId);
      if (!isNaN(parsedServiceId)) {
        where.serviceId = parsedServiceId;
      }
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

    const sellHistory = await prisma.sellHistory.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
      ...(limit && !isNaN(parseInt(limit)) && { take: parseInt(limit) }),
    });

    return NextResponse.json(sellHistory);
  } catch (error) {
    console.error("Error fetching sell history:", error);
    return NextResponse.json(
      { error: "Failed to fetch sell history" },
      { status: 500 }
    );
  }
}

