"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Heart, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AwsService, ServicesByCategory } from "@/lib/types";

// Fetch services from API
async function fetchServices(): Promise<ServicesByCategory[]> {
  try {
    const response = await fetch("/api/services", {
      cache: "no-store", // Ensure we get fresh data
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || "Failed to fetch services");
    }
  } catch (error) {
    console.error("Error fetching services:", error);
    // Return empty array as fallback
    return [];
  }
}

interface ServiceCardProps {
  service: AwsService;
  favorites: string[];
  onToggleFavorite: (serviceId: string) => void;
}

function ServiceCard({
  service,
  favorites,
  onToggleFavorite,
}: ServiceCardProps) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200 hover:scale-[1.02] bg-card/50 backdrop-blur border-border/50">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          {/* Service Icon */}
          <div className="relative w-12 h-12 flex-shrink-0">
            <Image
              src={service.iconPath}
              alt={service.name}
              fill
              className="object-contain"
            />
          </div>

          {/* Service Info */}
          <div className="space-y-2 min-h-[80px] flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                {service.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {service.summary}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center space-x-2 w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFavorite(service.id)}
              className="h-8 px-2"
            >
              <Heart
                className={`h-4 w-4 ${
                  favorites.includes(service.id)
                    ? "fill-current text-red-500"
                    : "text-muted-foreground hover:text-red-500"
                }`}
              />
            </Button>
            <Button variant="ghost" size="sm" asChild className="h-8 px-2">
              <Link href={`/${service.category}/${service.slug}`}>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CategoryRowProps {
  category: ServicesByCategory;
  favorites: string[];
  onToggleFavorite: (serviceId: string) => void;
}

function CategoryRow({
  category,
  favorites,
  onToggleFavorite,
}: CategoryRowProps) {
  return (
    <div className="space-y-4">
      {/* Category Header */}
      <div className="flex items-center space-x-3">
        <div className="relative w-8 h-8 flex-shrink-0">
          <Image
            src={category.iconPath}
            alt={category.displayName}
            fill
            className="object-contain"
          />
        </div>
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold">{category.displayName}</h2>
          <Badge variant="secondary" className="text-xs">
            {category.services.length} services
          </Badge>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
        {category.services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
}

export function ServicesDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [servicesByCategory, setServicesByCategory] = useState<
    ServicesByCategory[]
  >([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch services from API
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const services = await fetchServices();
        setServicesByCategory(services);
      } catch (error) {
        console.error("Failed to load services:", error);
        setServicesByCategory([]);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  // Filter categories based on search term
  const filteredCategories = servicesByCategory
    .map((category) => ({
      ...category,
      services: category.services.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.category.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((category) => category.services.length > 0)
    .sort((a, b) => a.displayName.localeCompare(b.displayName)); // Sort alphabetically

  const toggleFavorite = (serviceId: string) => {
    setFavorites((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Get favorite services for the favorites row (if user has favorites)
  const allServices = servicesByCategory.flatMap((cat) => cat.services);
  const favoriteServices = allServices.filter((service) =>
    favorites.includes(service.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading AWS services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            AWS Services Explorer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover and learn about AWS services organized by categories
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Favorites Row (Only show if user has favorites) */}
        {favoriteServices.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Heart className="w-8 h-8 text-red-500 fill-current" />
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold">Your Favorites</h2>
                <Badge variant="secondary" className="text-xs">
                  {favoriteServices.length} services
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
              {favoriteServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        )}

        {/* Category Rows */}
        <div className="space-y-12">
          {filteredCategories.map((category) => (
            <CategoryRow
              key={category.category}
              category={category}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No services found matching &quot;{searchTerm}&quot;
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
