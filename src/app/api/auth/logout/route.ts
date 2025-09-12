import { NextResponse } from "next/server";

export async function POST() {
  // Since we're using JWT tokens stored on the client side,
  // logout is handled client-side by removing the token.
  // This endpoint exists for consistency and future server-side session management.

  return NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
}
