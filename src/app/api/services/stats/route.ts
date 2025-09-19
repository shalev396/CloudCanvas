import { NextResponse } from "next/server";
import { ServicesDb } from "@/lib/dynamodb";

export async function GET() {
  try {
    // Get all services (including disabled ones)
    const allServices = await ServicesDb.getAllServicesForAdmin();

    // Count total services
    const totalServices = allServices.length;

    // Count enabled/available services
    const availableServices = allServices.filter(
      (service) => service.enabled === true
    ).length;

    return NextResponse.json(
      {
        success: true,
        data: {
          total: totalServices,
          available: availableServices,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching service stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch service statistics" },
      { status: 500 }
    );
  }
}
