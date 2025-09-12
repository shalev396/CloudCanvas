// Database Types
export interface AwsService {
  id: string; // Unique ID (category-serviceName)
  name: string; // Display name
  slug: string; // URL friendly name
  category: string; // Category name
  summary: string; // Short description
  description: string; // Detailed description
  htmlContent?: string; // Rich HTML content for the service page
  iconPath: string; // Path to SVG icon
  enabled: boolean; // Whether the service is enabled/visible
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface User {
  id: string; // Unique user ID
  email: string;
  name: string;
  passwordHash: string; // Hashed password
  isAdmin: boolean;
  favorites: string[]; // Array of service IDs
  createdAt: string;
  updatedAt: string;
}

// Frontend Types
export interface CategoryConfig {
  id: string;
  name: string;
  displayName: string;
  iconPath: string;
  description: string;
  enabled: boolean;
}

export interface CloudProvider {
  id: string;
  name: string;
  displayName: string;
  iconPath?: string;
  enabled: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ServicesByCategory {
  category: string;
  displayName: string;
  iconPath: string;
  services: AwsService[];
}

// Auth Types
export interface JwtPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  // Standard JWT claims
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, "passwordHash">;
}
