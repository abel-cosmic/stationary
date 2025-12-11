import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  initialPrice: z.number().positive("Initial price must be positive"),
  sellingPrice: z.number().positive("Selling price must be positive"),
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
  categoryId: z.number().int().positive().nullable().optional(),
});

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        _count: {
          select: {
            sellHistory: true,
          },
        },
        sellHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        initialPrice: validatedData.initialPrice,
        sellingPrice: validatedData.sellingPrice,
        quantity: validatedData.quantity,
        categoryId: validatedData.categoryId ?? null,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
