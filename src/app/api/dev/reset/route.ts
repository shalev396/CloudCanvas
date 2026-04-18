import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { BatchOperations, CategoriesDb, ServicesDb, UsersDb } from "@/lib/dynamodb";
import { AuthUtils } from "@/lib/auth-server";
import { User } from "@/lib/types";

type ResetBody = {
  scope?: "users" | "all";
  admin?: { email: string; password: string; name?: string };
};

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
