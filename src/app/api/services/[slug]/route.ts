import { NextRequest, NextResponse } from "next/server";
import { ServicesDb } from "@/lib/dynamodb";
import { requireAdmin, createUnauthorizedResponse } from "@/lib/middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Service slug is required" },
        { status: 400 }
      );
    }

    const service = await ServicesDb.getServiceBySlug(slug);

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Check if user is admin
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }

    const { slug } = await params;
    const updates = await request.json();

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Service slug is required" },
        { status: 400 }
      );
    }

    // First get the service to find its ID
    const service = await ServicesDb.getServiceBySlug(slug);
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    // Update the service
    await ServicesDb.updateService(service.id, updates);

    // Return updated service
    const updatedService = await ServicesDb.getService(service.id);
    return NextResponse.json({ success: true, data: updatedService });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update service" },
      { status: 500 }
    );
  }
}
