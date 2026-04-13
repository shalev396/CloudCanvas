import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin, createUnauthorizedResponse } from "@/lib/middleware";
import { ServicesDb } from "@/lib/dynamodb";
import { SERVICES_CACHE_TAG } from "@/lib/cached-data";
import { AwsService } from "@/lib/types";

const CONTENT_KEYS: (keyof AwsService)[] = [
  "name",
  "slug",
  "summary",
  "description",
  "markdownContent",
  "enabled",
  "awsDocsUrl",
  "diagramUrl",
];

type MatchStrategy =
  | "iconPath"
  | "iconFilename"
  | "slug"
  | "name"
  | "nameLoose";

function normalizeIconPath(p: string | undefined): string {
  if (!p) return "";
  if (p.startsWith("/aws/") && !p.startsWith("/images/aws/")) {
    return "/images/aws/" + p.slice("/aws/".length);
  }
  return p;
}

function iconFilename(p: string | undefined): string {
  if (!p) return "";
  return p.split("/").pop() ?? "";
}

function looseName(n: string | undefined): string {
  return (n ?? "")
    .toLowerCase()
    .replace(/\baws\b/g, "")
    .replace(/\bamazon\b/g, "")
    .replace(/[^a-z0-9]/g, "");
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
      { status: 400 },
    );
  }

  if (!body.services || !Array.isArray(body.services)) {
    return NextResponse.json(
      { success: false, error: "Missing or invalid 'services' array" },
      { status: 400 },
    );
  }

  const backupServices = body.services.map((s) => ({
    ...s,
    iconPath: normalizeIconPath(s.iconPath),
  }));

  const currentServices = await ServicesDb.getAllServices();

  // Build lookup indices on the current DB.
  const byIconPath = new Map<string, AwsService>();
  const byIconFilename = new Map<string, AwsService>();
  const bySlug = new Map<string, AwsService>();
  const byName = new Map<string, AwsService>();
  const byLooseName = new Map<string, AwsService>();

  for (const s of currentServices) {
    if (s.iconPath) byIconPath.set(s.iconPath, s);
    const fn = iconFilename(s.iconPath);
    if (fn) byIconFilename.set(fn, s);
    if (s.slug) bySlug.set(s.slug.toLowerCase(), s);
    if (s.name) byName.set(s.name.toLowerCase(), s);
    const ln = looseName(s.name);
    if (ln) byLooseName.set(ln, s);
  }

  const usedIds = new Set<string>();
  const matches: {
    backup: AwsService;
    existing: AwsService;
    strategy: MatchStrategy;
  }[] = [];
  const unmatched: { name: string; iconPath: string; slug: string }[] = [];

  for (const backup of backupServices) {
    const candidates: [MatchStrategy, AwsService | undefined][] = [
      ["iconPath", byIconPath.get(backup.iconPath)],
      ["iconFilename", byIconFilename.get(iconFilename(backup.iconPath))],
      ["slug", backup.slug ? bySlug.get(backup.slug.toLowerCase()) : undefined],
      ["name", backup.name ? byName.get(backup.name.toLowerCase()) : undefined],
      ["nameLoose", byLooseName.get(looseName(backup.name))],
    ];

    let picked: { strategy: MatchStrategy; existing: AwsService } | null = null;
    for (const [strategy, existing] of candidates) {
      if (existing && !usedIds.has(existing.id)) {
        picked = { strategy, existing };
        break;
      }
    }

    if (!picked) {
      unmatched.push({
        name: backup.name,
        iconPath: backup.iconPath,
        slug: backup.slug,
      });
      continue;
    }

    usedIds.add(picked.existing.id);
    matches.push({ backup, existing: picked.existing, strategy: picked.strategy });
  }

  let updated = 0;
  let unchanged = 0;
  const matchedByStrategy: Record<MatchStrategy, number> = {
    iconPath: 0,
    iconFilename: 0,
    slug: 0,
    name: 0,
    nameLoose: 0,
  };

  for (const { backup, existing, strategy } of matches) {
    matchedByStrategy[strategy]++;

    const updates: Partial<AwsService> = {};
    let changed = false;
    for (const k of CONTENT_KEYS) {
      const backupVal = backup[k];
      if (backupVal === undefined) continue;
      if (existing[k] !== backupVal) {
        // @ts-expect-error — indexed copy across matching keys
        updates[k] = backupVal;
        changed = true;
      }
    }

    if (!changed) {
      unchanged++;
      continue;
    }

    await ServicesDb.updateService(existing.id, updates);
    updated++;
  }

  revalidateTag(SERVICES_CACHE_TAG);
  revalidatePath("/");

  return NextResponse.json({
    success: true,
    data: {
      backupCount: backupServices.length,
      currentCount: currentServices.length,
      updated,
      unchanged,
      unmatchedCount: unmatched.length,
      unmatched,
      matchedByStrategy,
    },
  });
}
