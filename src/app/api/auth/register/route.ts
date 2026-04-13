import { NextRequest, NextResponse } from "next/server";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { UsersDb, TABLES } from "@/lib/dynamodb";
import { AuthUtils } from "@/lib/auth-server";
import { REGISTRATION_ENABLED } from "@/lib/feature-flags";
import { RegisterRequest, AuthResponse, User } from "@/lib/types";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION! })
);

export async function POST(request: NextRequest) {
  if (!REGISTRATION_ENABLED) {
    return NextResponse.json(
      { success: false, error: "Registration is disabled" },
      { status: 403 }
    );
  }

  try {
    const body: RegisterRequest = await request.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { success: false, error: "Email, name, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await UsersDb.getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    // First user in the system becomes admin.
    const anyUser = await docClient.send(
      new ScanCommand({ TableName: TABLES.USERS, Limit: 1 })
    );
    const isFirstUser = (anyUser.Items?.length ?? 0) === 0;

    const now = new Date().toISOString();
    const user: User = {
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash: await AuthUtils.hashPassword(password),
      isAdmin: isFirstUser,
      favorites: [],
      createdAt: now,
      updatedAt: now,
    };

    await UsersDb.createUser(user);

    const token = AuthUtils.generateToken(user);
    const response: AuthResponse = {
      token,
      user: AuthUtils.sanitizeUser(user),
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
