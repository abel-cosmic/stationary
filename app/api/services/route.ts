import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createServiceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  defaultPrice: z.number().positive("Default price must be positive"),
  description: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      include: {
        _count: {
          select: {
            sellHistory: true,
          },
        },
        sellHistory: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10, // Get recent 10 sales
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createServiceSchema.parse(body);

    const service = await prisma.service.create({
      data: {
        name: validatedData.name,
        defaultPrice: validatedData.defaultPrice,
        description: validatedData.description ?? null,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    // Handle unique constraint violation
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        { error: "Service with this name already exists" },
        { status: 409 }
      );
    }

    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
