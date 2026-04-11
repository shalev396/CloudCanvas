import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import * as fs from "fs/promises";
import * as path from "path";
import JSZip from "jszip";
import { requireAdmin, createUnauthorizedResponse } from "@/lib/middleware";
import { ServicesDb } from "@/lib/dynamodb";
import { SERVICES_CACHE_TAG } from "@/lib/cached-data";
import {
  categoryMapping,
  buildServiceRecord,
} from "@/lib/service-generator";

const PUBLIC_AWS = path.join(process.cwd(), "public", "aws");
const ARCH_SERVICE_DIR = path.join(PUBLIC_AWS, "Architecture-Service");
const CATEGORY_DIR = path.join(PUBLIC_AWS, "Category");
const ARCH_GROUP_DIR = path.join(PUBLIC_AWS, "Architecture-Group");

/**
 * Zip category icon filenames may differ from what the app expects.
 * Map zip filenames -> on-disk filenames the app references in categories.ts.
 */
const categoryIconRenameMap: Record<string, string> = {
  "Arch-Category_Databases_64.svg": "Arch-Category_Database_64.svg",
  "Arch-Category_Security-Identity_64.svg":
    "Arch-Category_Security-Identity-Compliance_64.svg",
  "Arch-Category_Management-Tools_64.svg":
    "Arch-Category_Management-Governance_64.svg",
  "Arch-Category_App-Integration_64.svg":
    "Arch-Category_Application-Integration_64.svg",
};

async function writeIconFile(
  targetDir: string,
  targetFile: string,
  newContent: Buffer
): Promise<"extracted" | "updated" | "skipped"> {
  let existingContent: Buffer | null = null;
  try {
    existingContent = await fs.readFile(targetFile);
  } catch {
    // File doesn't exist yet
  }

  if (existingContent && Buffer.compare(existingContent, newContent) === 0) {
    return "skipped";
  } else if (existingContent) {
    await fs.writeFile(targetFile, newContent);
    return "updated";
  } else {
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetFile, newContent);
    return "extracted";
  }
}

/**
 * Find a top-level folder in the zip matching a keyword, ignoring __MACOSX.
 */
function findZipFolder(
  zip: JSZip,
  keyword: string
): string {
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

  let iconsExtracted = 0;
  let iconsSkipped = 0;
  let iconsUpdated = 0;

  // ── 1. Architecture-Service Icons ─────────────────────────────────────

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

  const svgEntries: {
    zipCategoryFolder: string;
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
    if (!categoryFolder.startsWith("Arch_")) return;
    if (!categoryMapping[categoryFolder]) return;

    svgEntries.push({
      zipCategoryFolder: categoryFolder,
      fileName,
      zipFile: zipEntry,
    });
  });

  const targetServicePaths = new Set<string>();
  const onDiskCategoryFolders = new Set<string>();

  for (const entry of svgEntries) {
    const onDiskFolder = entry.zipCategoryFolder;
    onDiskCategoryFolders.add(onDiskFolder);

    const targetDir = path.join(ARCH_SERVICE_DIR, onDiskFolder);
    const targetFile = path.join(targetDir, entry.fileName);
    targetServicePaths.add(targetFile);

    const newContent = await entry.zipFile.async("nodebuffer");
    const result = await writeIconFile(targetDir, targetFile, newContent);
    if (result === "extracted") iconsExtracted++;
    else if (result === "updated") iconsUpdated++;
    else iconsSkipped++;
  }

  // Orphan cleanup for service icons
  let orphansRemoved = 0;
  for (const categoryFolder of onDiskCategoryFolders) {
    const dirPath = path.join(ARCH_SERVICE_DIR, categoryFolder);
    let existingFiles: string[];
    try {
      existingFiles = await fs.readdir(dirPath);
    } catch {
      continue;
    }
    for (const fileName of existingFiles) {
      if (!fileName.toLowerCase().endsWith(".svg")) continue;
      const fullPath = path.join(dirPath, fileName);
      if (!targetServicePaths.has(fullPath)) {
        await fs.unlink(fullPath);
        orphansRemoved++;
      }
    }
  }

  // ── 2. Category Icons ─────────────────────────────────────────────────

  let categoryIconsExtracted = 0;
  let categoryIconsSkipped = 0;
  let categoryIconsUpdated = 0;

  const catPrefix = findZipFolder(zip, "Category-Icons");

  if (catPrefix) {
    const categoryEntries: { diskName: string; zipFile: JSZip.JSZipObject }[] =
      [];

    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;
      if (relativePath.startsWith("__MACOSX")) return;
      if (!relativePath.startsWith(catPrefix)) return;
      if (!relativePath.toLowerCase().endsWith(".svg")) return;

      const fileName = relativePath.split("/").pop()!;
      if (!fileName.includes("64")) return;
      if (!fileName.startsWith("Arch-Category_")) return;

      const diskName = categoryIconRenameMap[fileName] || fileName;
      categoryEntries.push({ diskName, zipFile: zipEntry });
    });

    for (const entry of categoryEntries) {
      const targetFile = path.join(CATEGORY_DIR, entry.diskName);
      const newContent = await entry.zipFile.async("nodebuffer");
      const result = await writeIconFile(CATEGORY_DIR, targetFile, newContent);
      if (result === "extracted") categoryIconsExtracted++;
      else if (result === "updated") categoryIconsUpdated++;
      else categoryIconsSkipped++;
    }
  }

  // ── 3. Architecture-Group Icons ───────────────────────────────────────

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
      const targetFile = path.join(ARCH_GROUP_DIR, entry.fileName);
      const newContent = await entry.zipFile.async("nodebuffer");
      const result = await writeIconFile(
        ARCH_GROUP_DIR,
        targetFile,
        newContent
      );
      if (result === "extracted") groupIconsExtracted++;
    }
  }

  // ── 4. DB record creation for service icons ───────────────────────────

  const allServices = await ServicesDb.getAllServices();
  const existingIconPaths = new Set(allServices.map((s) => s.iconPath));

  let servicesCreated = 0;
  let servicesSkipped = 0;

  for (const entry of svgEntries) {
    const onDiskFolder = entry.zipCategoryFolder;
    const relativeIconPath = `/aws/Architecture-Service/${onDiskFolder}/${entry.fileName}`;

    if (existingIconPaths.has(relativeIconPath)) {
      servicesSkipped++;
      continue;
    }

    const record = buildServiceRecord(entry.fileName, onDiskFolder);
    if (!record) {
      servicesSkipped++;
      continue;
    }

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
      servicesCreated,
      servicesSkipped,
    },
  });
}
