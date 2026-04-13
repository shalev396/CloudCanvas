import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin, createUnauthorizedResponse } from "@/lib/middleware";
import { BatchOperations, CategoriesDb, ServicesDb } from "@/lib/dynamodb";
import { SERVICES_CACHE_TAG } from "@/lib/cached-data";
import { deleteAllObjects } from "@/lib/s3";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.success) {
    return createUnauthorizedResponse(auth.error);
  }

  const [allServices, allCategories] = await Promise.all([
    ServicesDb.getAllServices(),
    CategoriesDb.getAllCategories(),
  ]);
  const servicesDeleted = allServices.length;
  const categoriesDeleted = allCategories.length;

  await Promise.all([
    BatchOperations.clearAllServices(),
    CategoriesDb.clearAllCategories(),
  ]);

  const s3ObjectsDeleted = await deleteAllObjects("images/");

  revalidateTag(SERVICES_CACHE_TAG);
  revalidatePath("/");

  return NextResponse.json({
    success: true,
    data: {
      deleted: servicesDeleted,
      servicesDeleted,
      categoriesDeleted,
      s3ObjectsDeleted,
    },
  });
}
