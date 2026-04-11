import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin, createUnauthorizedResponse } from "@/lib/middleware";
import { BatchOperations, ServicesDb } from "@/lib/dynamodb";
import { SERVICES_CACHE_TAG } from "@/lib/cached-data";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.success) {
    return createUnauthorizedResponse(auth.error);
  }

  const allServices = await ServicesDb.getAllServices();
  const count = allServices.length;

  await BatchOperations.clearAllServices();

  revalidateTag(SERVICES_CACHE_TAG);
  revalidatePath("/");

  return NextResponse.json({
    success: true,
    data: { deleted: count },
  });
}
