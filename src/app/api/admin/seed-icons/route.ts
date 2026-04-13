import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import JSZip from "jszip";
import { requireAdmin, createUnauthorizedResponse } from "@/lib/middleware";
import { ServicesDb, CategoriesDb } from "@/lib/dynamodb";
import { SERVICES_CACHE_TAG } from "@/lib/cached-data";
import {
  extractCategoryIdFromFolder,
  extractCategoryIdFromIconFile,
  deriveCategoryDisplayName,
  deriveCategoryDescription,
  buildServiceRecord,
} from "@/lib/service-generator";
import {
  uploadIcon,
  getIconContent,
  listIcons,
  deleteIcon,
} from "@/lib/s3";

async function uploadIconToS3(
  s3Key: string,
  newContent: Buffer
): Promise<"extracted" | "updated" | "skipped"> {
  const existing = await getIconContent(s3Key);

  if (existing && Buffer.compare(existing, newContent) === 0) {
    return "skipped";
  } else if (existing) {
    await uploadIcon(s3Key, newContent);
    return "updated";
  } else {
    await uploadIcon(s3Key, newContent);
    return "extracted";
  }
}

/**
 * Find a top-level folder in the zip matching a keyword, ignoring __MACOSX.
 */
function findZipFolder(zip: JSZip, keyword: string): string {
  for (const filePath of Object.keys(zip.files)) {
    if (filePath.startsWith("__MACOSX")) continue;
    if (filePath.includes(keyword)) {
      return filePath.split("/")[0] + "/";
    }
  }
  return "";
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.success) {
    return createUnauthorizedResponse(auth.error);
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json(
      { success: false, error: "No file uploaded" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const zip = await JSZip.loadAsync(buffer);

  // ── 1. Discover categories from Category-Icons in the zip ────────────

  const discoveredCategories = new Map<
    string,
    { iconFileName: string; s3IconPath: string }
  >();

  let categoryIconsExtracted = 0;
  let categoryIconsSkipped = 0;
  let categoryIconsUpdated = 0;

  const catPrefix = findZipFolder(zip, "Category-Icons");

  if (catPrefix) {
    const categoryEntries: {
      categoryId: string;
      fileName: string;
      zipFile: JSZip.JSZipObject;
    }[] = [];

    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;
      if (relativePath.startsWith("__MACOSX")) return;
      if (!relativePath.startsWith(catPrefix)) return;
      if (!relativePath.toLowerCase().endsWith(".svg")) return;

      const fileName = relativePath.split("/").pop()!;
      if (!fileName.includes("64")) return;
      if (!fileName.startsWith("Arch-Category_")) return;

      const categoryId = extractCategoryIdFromIconFile(fileName);
      if (!categoryId) return;

      categoryEntries.push({ categoryId, fileName, zipFile: zipEntry });
    });

    for (const entry of categoryEntries) {
      const s3Key = `images/aws/Category/${entry.fileName}`;
      const newContent = await entry.zipFile.async("nodebuffer");
      const result = await uploadIconToS3(s3Key, newContent);
      if (result === "extracted") categoryIconsExtracted++;
      else if (result === "updated") categoryIconsUpdated++;
      else categoryIconsSkipped++;

      discoveredCategories.set(entry.categoryId, {
        iconFileName: entry.fileName,
        s3IconPath: `/images/aws/Category/${entry.fileName}`,
      });
    }
  }

  // ── 2. Upsert category records in DynamoDB ──────────────────────────

  let categoriesUpserted = 0;

  for (const [categoryId, info] of discoveredCategories) {
    const displayName = deriveCategoryDisplayName(categoryId);
    const description = deriveCategoryDescription(displayName);

    await CategoriesDb.upsertCategory({
      id: categoryId,
      name: categoryId,
      displayName,
      description,
      iconPath: info.s3IconPath,
      enabled: true,
    });
    categoriesUpserted++;
  }

  // ── 3. Architecture-Service Icons ─────────────────────────────────────

  const archPrefix = findZipFolder(zip, "Architecture-Service-Icons");
  if (!archPrefix) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Could not find Architecture-Service-Icons folder inside the zip",
      },
      { status: 400 }
    );
  }

  let iconsExtracted = 0;
  let iconsSkipped = 0;
  let iconsUpdated = 0;

  const svgEntries: {
    zipCategoryFolder: string;
    categoryId: string;
    fileName: string;
    zipFile: JSZip.JSZipObject;
  }[] = [];

  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;
    if (relativePath.startsWith("__MACOSX")) return;
    if (!relativePath.startsWith(archPrefix)) return;
    if (!relativePath.toLowerCase().endsWith(".svg")) return;

    const afterPrefix = relativePath.slice(archPrefix.length);
    const segments = afterPrefix.split("/");
    if (segments.length !== 3) return;

    const [categoryFolder, sizeFolder, fileName] = segments;
    if (sizeFolder !== "64") return;

    const categoryId = extractCategoryIdFromFolder(categoryFolder);
    if (!categoryId) return;
    if (!discoveredCategories.has(categoryId)) return;

    svgEntries.push({
      zipCategoryFolder: categoryFolder,
      categoryId,
      fileName,
      zipFile: zipEntry,
    });
  });

  const targetServiceKeys = new Set<string>();
  const onDiskCategoryFolders = new Set<string>();

  for (const entry of svgEntries) {
    const folder = entry.zipCategoryFolder;
    onDiskCategoryFolders.add(folder);

    const s3Key = `images/aws/Architecture-Service/${folder}/${entry.fileName}`;
    targetServiceKeys.add(s3Key);

    const newContent = await entry.zipFile.async("nodebuffer");
    const result = await uploadIconToS3(s3Key, newContent);
    if (result === "extracted") iconsExtracted++;
    else if (result === "updated") iconsUpdated++;
    else iconsSkipped++;
  }

  // Orphan cleanup for service icons
  let orphansRemoved = 0;
  for (const categoryFolder of onDiskCategoryFolders) {
    const prefix = `images/aws/Architecture-Service/${categoryFolder}/`;
    const existingKeys = await listIcons(prefix);
    for (const key of existingKeys) {
      if (!targetServiceKeys.has(key)) {
        await deleteIcon(key);
        orphansRemoved++;
      }
    }
  }

  // ── 4. Architecture-Group Icons ───────────────────────────────────────

  let groupIconsExtracted = 0;

  const archGroupPrefix = findZipFolder(zip, "Architecture-Group");

  if (archGroupPrefix) {
    const groupEntries: { fileName: string; zipFile: JSZip.JSZipObject }[] = [];

    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;
      if (relativePath.startsWith("__MACOSX")) return;
      if (!relativePath.startsWith(archGroupPrefix)) return;
      if (!relativePath.toLowerCase().endsWith(".svg")) return;

      const fileName = relativePath.split("/").pop()!;
      groupEntries.push({ fileName, zipFile: zipEntry });
    });

    for (const entry of groupEntries) {
      const s3Key = `images/aws/Architecture-Group/${entry.fileName}`;
      const newContent = await entry.zipFile.async("nodebuffer");
      const result = await uploadIconToS3(s3Key, newContent);
      if (result === "extracted") groupIconsExtracted++;
    }
  }

  // ── 5. DB record creation for service icons ───────────────────────────

  const allServices = await ServicesDb.getAllServices();
  const targetIconPaths = new Set(
    svgEntries.map(
      (e) =>
        `/images/aws/Architecture-Service/${e.zipCategoryFolder}/${e.fileName}`
    )
  );

  let staleServicesDeleted = 0;
  for (const svc of allServices) {
    if (!targetIconPaths.has(svc.iconPath)) {
      await ServicesDb.deleteService(svc.id);
      staleServicesDeleted++;
    }
  }

  const remainingServices = allServices.filter((s) =>
    targetIconPaths.has(s.iconPath)
  );
  const existingIconPaths = new Set(remainingServices.map((s) => s.iconPath));

  let servicesCreated = 0;
  let servicesSkipped = 0;

  for (const entry of svgEntries) {
    const folder = entry.zipCategoryFolder;
    const iconPath = `/images/aws/Architecture-Service/${folder}/${entry.fileName}`;

    if (existingIconPaths.has(iconPath)) {
      servicesSkipped++;
      continue;
    }

    const record = buildServiceRecord(
      entry.fileName,
      folder,
      entry.categoryId
    );
    await ServicesDb.createService(record);
    servicesCreated++;
  }

  revalidateTag(SERVICES_CACHE_TAG);
  revalidatePath("/");

  return NextResponse.json({
    success: true,
    data: {
      iconsExtracted,
      iconsSkipped,
      iconsUpdated,
      orphansRemoved,
      categoryIconsExtracted,
      categoryIconsSkipped,
      categoryIconsUpdated,
      groupIconsExtracted,
      categoriesUpserted,
      servicesCreated,
      servicesSkipped,
      staleServicesDeleted,
    },
  });
}
