import { NextRequest, NextResponse } from "next/server";
import { ServicesDb, CategoriesDb } from "@/lib/dynamodb";
import { ServicesByCategory } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");

    if (category) {
      // Return services for a specific category
      const services = await ServicesDb.getServicesByCategory(category);
      return NextResponse.json(
        {
          success: true,
          data: services,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
          },
        },
      );
    }

    const [services, categories] = await Promise.all([
      ServicesDb.getServicesForDashboard(),
      CategoriesDb.getAllCategories(),
    ]);

    const servicesByCategory: ServicesByCategory[] = [];

    for (const categoryConfig of categories) {
      const categoryServices = services.filter(
        (service) => service.category === categoryConfig.id,
      );

      if (categoryServices.length > 0) {
        servicesByCategory.push({
          category: categoryConfig.id,
          displayName: categoryConfig.displayName,
          iconPath: categoryConfig.iconPath,
          services: categoryServices.map((service) => ({
            id: service.id!,
            name: service.name!,
            slug: service.slug!,
            category: service.category!,
            summary: service.summary!,
            description: service.summary!, // Use summary for description in dashboard
            markdownContent: service.markdownContent || "",
            awsDocsUrl: service.awsDocsUrl || "",
            diagramUrl: service.diagramUrl || "",
            iconPath: service.iconPath!,
            enabled: service.enabled ?? true, // Default to true for backwards compatibility
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: servicesByCategory,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch services" },
      { status: 500 },
    );
  }
}
