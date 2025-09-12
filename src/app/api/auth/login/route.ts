import { NextRequest, NextResponse } from "next/server";
import { UsersDb } from "@/lib/dynamodb";
import { AuthUtils } from "@/lib/auth-server";
import { LoginRequest, AuthResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await UsersDb.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await AuthUtils.comparePassword(
      password,
      user.passwordHash
    );
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = AuthUtils.generateToken(user);

    // Return success response with token and user data
    const response: AuthResponse = {
      token,
      user: AuthUtils.sanitizeUser(user),
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
