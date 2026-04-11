import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin, createUnauthorizedResponse } from "@/lib/middleware";
import { ServicesDb } from "@/lib/dynamodb";
import { SERVICES_CACHE_TAG } from "@/lib/cached-data";
import { AwsService } from "@/lib/types";

function servicesAreEqual(a: AwsService, b: AwsService): boolean {
  const keys: (keyof AwsService)[] = [
    "name",
    "slug",
    "category",
    "summary",
    "description",
    "markdownContent",
    "iconPath",
    "enabled",
    "awsDocsUrl",
    "diagramUrl",
  ];
  return keys.every((k) => a[k] === b[k]);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.success) {
    return createUnauthorizedResponse(auth.error);
  }

  let body: { version?: number; services?: AwsService[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.services || !Array.isArray(body.services)) {
    return NextResponse.json(
      { success: false, error: "Missing or invalid 'services' array" },
      { status: 400 }
    );
  }

  const backupServices = body.services;
  const currentServices = await ServicesDb.getAllServices();

  const currentMap = new Map(currentServices.map((s) => [s.id, s]));
  const backupMap = new Map(backupServices.map((s) => [s.id, s]));

  let created = 0;
  let updated = 0;
  let deleted = 0;
  let skipped = 0;

  for (const service of backupServices) {
    const existing = currentMap.get(service.id);
    if (!existing) {
      await ServicesDb.createService(service);
      created++;
    } else if (!servicesAreEqual(existing, service)) {
      const { id, ...updates } = service;
      await ServicesDb.updateService(id, updates);
      updated++;
    } else {
      skipped++;
    }
  }

  for (const existing of currentServices) {
    if (!backupMap.has(existing.id)) {
      await ServicesDb.deleteService(existing.id);
      deleted++;
    }
  }

  revalidateTag(SERVICES_CACHE_TAG);
  revalidatePath("/");

  return NextResponse.json({
    success: true,
    data: { created, updated, deleted, skipped },
  });
}
