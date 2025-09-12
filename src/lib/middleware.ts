import { NextRequest, NextResponse } from "next/server";
import { AuthUtils } from "./auth-server";
import { UsersDb } from "./dynamodb";
import { JwtPayload, User } from "./types";

export interface AuthenticatedRequest extends NextRequest {
  user?: Omit<User, "passwordHash">;
  userPayload?: JwtPayload;
}

// Middleware to authenticate requests
export async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean;
  user?: Omit<User, "passwordHash">;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = AuthUtils.extractTokenFromHeaders(authHeader || "");

    if (!token) {
      return { success: false, error: "No authentication token provided" };
    }

    const payload = AuthUtils.verifyToken(token);
    if (!payload) {
      return { success: false, error: "Invalid or expired token" };
    }

    // Get fresh user data from database
    const user = await UsersDb.getUser(payload.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, user: AuthUtils.sanitizeUser(user) };
  } catch (error) {
    console.error("Authentication error:", error);
    return { success: false, error: "Authentication failed" };
  }
}

// Middleware to check if user is admin
export async function requireAdmin(request: NextRequest): Promise<{
  success: boolean;
  user?: Omit<User, "passwordHash">;
  error?: string;
}> {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.user) {
    return authResult;
  }

  if (!authResult.user.isAdmin) {
    return { success: false, error: "Admin access required" };
  }

  return authResult;
}

// Create error responses for authentication failures
export function createAuthErrorResponse(error: string, status = 401) {
  return NextResponse.json({ success: false, error }, { status });
}

// Create unauthorized response
export function createUnauthorizedResponse(message = "Unauthorized") {
  return createAuthErrorResponse(message, 401);
}

// Create forbidden response
export function createForbiddenResponse(message = "Forbidden") {
  return createAuthErrorResponse(message, 403);
}
