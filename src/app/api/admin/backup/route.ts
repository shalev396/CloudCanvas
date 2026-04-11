import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createUnauthorizedResponse } from "@/lib/middleware";
import { ServicesDb } from "@/lib/dynamodb";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.success) {
    return createUnauthorizedResponse(auth.error);
  }

  const services = await ServicesDb.getAllServices();

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    services,
  };

  const json = JSON.stringify(backup, null, 2);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="cloudcanvas-backup-${date}.json"`,
    },
  });
}
