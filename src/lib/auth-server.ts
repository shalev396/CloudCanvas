import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User, JwtPayload } from "./types";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

// Type assertion to help TypeScript understand that JWT_SECRET is not undefined after the check
const JWT_SECRET_SAFE = JWT_SECRET as string;

// Server-side JWT token management
export class AuthUtils {
  static generateToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    return jwt.sign(payload, JWT_SECRET_SAFE, { expiresIn: "7d" });
  }

  static verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET_SAFE) as JwtPayload;
    } catch {
      return null;
    }
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Extract token from Authorization header
  static extractTokenFromHeaders(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Create sanitized user object (without password hash)
  static sanitizeUser(user: User): Omit<User, "passwordHash"> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
