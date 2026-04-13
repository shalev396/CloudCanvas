"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ServiceCard } from "@/components/service-card";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import Image from "next/image";
import { ServicesByCategory } from "@/lib/types";
import { resolveImageUrl } from "@/lib/image-url";

interface ServiceStats {
  total: number;
  available: number;
}

interface CategoryCardProps {
  category: ServicesByCategory;
  onExpand: () => void;
}

function CategoryCard({ category, onExpand }: CategoryCardProps) {
  // Skip rendering if category is invalid or has no services
  if (
    !category ||
    !category.displayName ||
    !category.iconPath ||
    category.services.length === 0
  ) {
    return null;
  }

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.03] bg-card/60 backdrop-blur border-border/50 cursor-pointer h-full"
      onClick={onExpand}
    >
      <CardContent className="p-3 sm:p-6 h-full">
        <div className="flex flex-col items-center text-center h-full">
          {/* Category Icon - Responsive */}
          <div className="relative w-12 h-12 sm:w-24 sm:h-24 flex-shrink-0 mb-2 sm:mb-4">
            <Image
              src={resolveImageUrl(category.iconPath)}
              alt={category.displayName}
              fill
              className="object-contain"
            />
          </div>

          {/* Category Title - Responsive */}
          <div className="flex-1 flex items-center justify-center mb-2 sm:mb-4">
            <h3 className="font-bold text-sm sm:text-lg leading-tight text-center">
              {category.displayName}
            </h3>
          </div>

          {/* Service Count Badge - Responsive */}
          <div className="mt-auto">
            <Badge
              variant="secondary"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1"
            >
              {category.services.length} services
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CategoryRowProps {
  category: ServicesByCategory;
  isExpanded: boolean;
  onToggle: () => void;
  categoryRef: React.RefObject<HTMLDivElement | null>;
}

function CategoryRow({
  category,
  isExpanded,
  onToggle,
  categoryRef,
}: CategoryRowProps) {
  return (
    <div ref={categoryRef} className="space-y-8">
      {/* Category Header - Clickable */}
      <div
        className="flex items-center space-x-4 cursor-pointer hover:bg-accent/30 rounded-lg p-4 -m-4 transition-colors border-b border-border/30 pb-6"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          {isExpanded ? (
            <ChevronDown className="w-6 h-6 text-muted-foreground transition-transform duration-200" />
          ) : (
            <ChevronRight className="w-6 h-6 text-muted-foreground transition-transform duration-200" />
          )}
          <div className="relative w-12 h-12 flex-shrink-0">
            <Image
              src={resolveImageUrl(category.iconPath)}
              alt={category.displayName}
              fill
              className="object-contain"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 flex-1">
          <h2 className="text-xl sm:text-2xl font-semibold">
            {category.displayName}
          </h2>
          <Badge
            variant="secondary"
            className="text-xs sm:text-sm px-2 py-1 sm:px-3 w-fit"
          >
            {category.services.length} services
          </Badge>
        </div>
      </div>

      {/* Services Grid - Collapsible with proper spacing */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? "max-h-none opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pt-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-9 gap-2 sm:gap-3">
            {category.services.map((service) => (
              <React.Fragment key={service.id}>
                {/* Mobile: Small size (33% smaller than medium) */}
                <div className="sm:hidden">
                  <ServiceCard service={service} size="small" />
                </div>
                {/* Desktop: Medium size */}
                <div className="hidden sm:block">
                  <ServiceCard service={service} size="medium" />
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ServicesDashboardProps {
  servicesByCategory: ServicesByCategory[];
  serviceStats: ServiceStats;
}

export function ServicesDashboard({
  servicesByCategory: initialServicesByCategory,
  serviceStats,
}: ServicesDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [servicesByCategory] = useState<ServicesByCategory[]>(
    initialServicesByCategory
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const categoryRefs = useRef<{
    [key: string]: React.RefObject<HTMLDivElement | null>;
  }>(
    Object.fromEntries(
      initialServicesByCategory.map((category) => [
        category.category,
        React.createRef<HTMLDivElement>(),
      ])
    )
  );

  // Monitor expanded categories to switch layout modes
  React.useEffect(() => {
    const hasExpandedCategories = expandedCategories.size > 0;
    const newMode = hasExpandedCategories ? "list" : "grid";

    if (newMode !== layoutMode) {
      setIsTransitioning(true);
      setTimeout(() => {
        setLayoutMode(newMode);
        setIsTransitioning(false);
      }, 150);
    }
  }, [expandedCategories, layoutMode]);

  // Handle category expansion
  const handleCategoryExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);

    if (expandedCategories.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);

      // Scroll to category after layout change with offset for navbar
      setTimeout(() => {
        const categoryRef = categoryRefs.current[categoryId];
        if (categoryRef?.current) {
          const element = categoryRef.current;
          const elementPosition =
            element.getBoundingClientRect().top + window.pageYOffset;
          const navbarHeight = 64; // Approximate navbar height (h-16 = 64px)
          const viewportOffset = window.innerHeight * 0.05; // 5% of viewport height
          const offsetPosition =
            elementPosition - navbarHeight - viewportOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 300);
    }

    setExpandedCategories(newExpanded);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            AWS Services Explorer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Currently supports {serviceStats.available} out of{" "}
            {serviceStats.total} services
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

        {/* Dynamic Layout Container */}
        <div
          className={`transition-opacity duration-300 ${
            isTransitioning ? "opacity-50" : "opacity-100"
          }`}
        >
          {layoutMode === "grid" ? (
            /* Phase 1: Category Cards Grid */
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-6">
              {filteredCategories
                .filter(
                  (category) =>
                    category &&
                    category.services &&
                    category.services.length > 0
                )
                .map((category) => (
                  <CategoryCard
                    key={category.category}
                    category={category}
                    onExpand={() => handleCategoryExpand(category.category)}
                  />
                ))}
            </div>
          ) : (
            /* Phase 2: Category Rows List */
            <div className="space-y-16">
              {filteredCategories.map((category) => (
                <CategoryRow
                  key={category.category}
                  category={category}
                  isExpanded={expandedCategories.has(category.category)}
                  onToggle={() => handleCategoryExpand(category.category)}
                  categoryRef={categoryRefs.current[category.category]}
                />
              ))}
            </div>
          )}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && (
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
