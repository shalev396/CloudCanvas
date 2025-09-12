"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginDialog } from "@/components/login-dialog";
import { CLOUD_PROVIDERS } from "@/lib/categories";
import { ChevronDown, Cloud, LogIn, LogOut, User, Shield } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function Navbar() {
  const [selectedProvider, setSelectedProvider] = useState("aws");
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const currentProvider = CLOUD_PROVIDERS.find(
    (provider) => provider.id === selectedProvider
  );

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Cloud className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Cloud Canvas
            </span>
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                  <span className="text-xs font-bold">
                    {currentProvider?.displayName
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
                  </span>
                </div>
                <span>{currentProvider?.displayName}</span>
                {currentProvider?.enabled && (
                  <Badge variant="default" className="text-xs px-1.5 py-0">
                    Active
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {CLOUD_PROVIDERS.map((provider) => (
                <DropdownMenuItem
                  key={provider.id}
                  disabled={!provider.enabled}
                  onClick={() =>
                    provider.enabled && setSelectedProvider(provider.id)
                  }
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-muted rounded flex items-center justify-center">
                        <span className="text-xs font-bold">
                          {provider.displayName
                            .split(" ")
                            .map((word) => word[0])
                            .join("")}
                        </span>
                      </div>
                      <span>{provider.displayName}</span>
                    </div>
                    {provider.enabled ? (
                      selectedProvider === provider.id && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Soon
                      </Badge>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Side - Auth + Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Authentication */}
          {isLoading ? (
            // Loading state
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated && user ? (
            // Authenticated user
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user.email} />
                    <AvatarFallback className="text-xs">
                      {getUserInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.email}</p>
                    <div className="flex items-center gap-1">
                      {user.isAdmin && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-1.5 py-0"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        <User className="h-3 w-3 mr-1" />
                        User
                      </Badge>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Not authenticated - Login button
            <Button
              onClick={() => setShowLoginDialog(true)}
              variant="default"
              size="sm"
              className="gap-2"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          )}

          <ThemeToggle />
        </div>
      </div>

      {/* Login Dialog */}
      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </header>
  );
}
