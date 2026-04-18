import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { BatchOperations, CategoriesDb, ServicesDb, UsersDb } from "@/lib/dynamodb";
import { AuthUtils } from "@/lib/auth-server";
import { AwsService, CategoryConfig, User } from "@/lib/types";

type ResetBody = {
  scope?: "users" | "all";
  admin?: { email: string; password: string; name?: string };
  seedTestService?: boolean;
};

// Deterministic test fixture — idempotently upserted when seedTestService=true
// so the Postman suite always has an enabled service to query/update.
const TEST_CATEGORY_ID = "qa-test-category";
const TEST_SERVICE_ID = "qa-test-service";

export async function POST(request: NextRequest) {
  const env = process.env.ENV;
  if (env !== "dev" && env !== "qa") {
    return NextResponse.json(
      { success: false, error: "Reset disabled for this environment" },
      { status: 403 }
    );
  }

  let body: ResetBody = {};
  try {
    body = (await request.json()) as ResetBody;
  } catch {
    // empty body is fine
  }
  const scope = body.scope ?? "users";

  try {
    const deletedUsers = await UsersDb.clearAllUsers();

    let deletedServices = 0;
    let deletedCategories = 0;
    if (scope === "all") {
      deletedServices = (await ServicesDb.getAllServices()).length;
      deletedCategories = (await CategoriesDb.getAllCategories()).length;
      await BatchOperations.clearAllServices();
      await CategoriesDb.clearAllCategories();
    }

    let createdAdmin: { id: string; email: string } | null = null;
    if (body.admin?.email && body.admin?.password) {
      const now = new Date().toISOString();
      const user: User = {
        id: randomUUID(),
        email: body.admin.email,
        name: body.admin.name ?? "QA Test Admin",
        passwordHash: await AuthUtils.hashPassword(body.admin.password),
        isAdmin: true,
        favorites: [],
        createdAt: now,
        updatedAt: now,
      };
      await UsersDb.createUser(user);
      createdAdmin = { id: user.id, email: user.email };
    }

    let seededService: { id: string; category: string } | null = null;
    if (body.seedTestService) {
      const now = new Date().toISOString();
      const category: CategoryConfig = {
        id: TEST_CATEGORY_ID,
        name: TEST_CATEGORY_ID,
        displayName: "QA Test Category",
        iconPath: "",
        description: "Seeded by /api/dev/reset for E2E tests",
        enabled: true,
      };
      const service: AwsService = {
        id: TEST_SERVICE_ID,
        name: "QA Test Service",
        slug: "qa-test-service",
        category: TEST_CATEGORY_ID,
        summary: "Deterministic fixture for Postman/Playwright tests",
        description: "Seeded by /api/dev/reset — do not rely on in prod.",
        markdownContent: "# QA Test Service\n",
        awsDocsUrl: "",
        diagramUrl: "",
        iconPath: "",
        enabled: true,
        createdAt: now,
        updatedAt: now,
      };
      await CategoriesDb.upsertCategory(category);
      await ServicesDb.createService(service);
      seededService = { id: service.id, category: service.category };
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: "dynamodb",
        env,
        scope,
        deletedUsers,
        deletedServices,
        deletedCategories,
        createdAdmin,
        seededService,
        message: `Reset complete (scope=${scope})`,
      },
    });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Reset failed",
      },
      { status: 500 }
    );
  }
}
