import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ServicesDb } from "@/lib/dynamodb";
import { requireAdmin, createUnauthorizedResponse } from "@/lib/middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Service ID is required" },
        { status: 400 }
      );
    }

    const service = await ServicesDb.getService(id);

    if (!service) {
      return NextResponse.json(
        { success: false, error: `Service not found with ID: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error("Error fetching service by ID:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is admin
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }

    const { id } = await params;
    const updates = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Service ID is required" },
        { status: 400 }
      );
    }

    // Verify service exists
    const existingService = await ServicesDb.getService(id);
    if (!existingService) {
      return NextResponse.json(
        { success: false, error: `Service not found with ID: ${id}` },
        { status: 404 }
      );
    }

    // Update the service
    await ServicesDb.updateService(id, updates);

    // Return updated service
    const updatedService = await ServicesDb.getService(id);

    // Revalidate the service page cache to show updated data immediately
    if (updatedService) {
      revalidatePath(`/${updatedService.category}/${updatedService.slug}`);
      revalidatePath("/"); // Also revalidate the dashboard
    }

    return NextResponse.json({ success: true, data: updatedService });
  } catch (error) {
    console.error("Error updating service by ID:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update service" },
      { status: 500 }
    );
  }
}
