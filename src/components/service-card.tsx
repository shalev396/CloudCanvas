"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { AwsService } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: AwsService;
  size?: "mobile" | "tiny" | "small" | "medium" | "large";
  showCategory?: boolean;
  className?: string;
}

const ServiceCardComponent = ({
  service,
  size = "medium",
  showCategory = false,
  className,
}: ServiceCardProps) => {
  const isDisabled = !(service.enabled ?? true); // Default to enabled if null/undefined

  const sizeConfig = {
    mobile: {
      iconSize: "w-8 h-8",
      titleClass: "text-[10px] font-medium leading-[1.1]",
      cardPadding: "p-1.5",
      fixedHeight: "h-[85px]",
      textHeight: "h-7",
    },
    tiny: {
      iconSize: "w-6 h-6",
      titleClass: "text-[9px] font-medium leading-[1.1]",
      cardPadding: "p-1",
      fixedHeight: "h-[70px]",
      textHeight: "h-6",
    },
    small: {
      iconSize: "w-10 h-10",
      titleClass: "text-xs font-medium leading-[1.1]",
      cardPadding: "p-2",
      fixedHeight: "h-[100px]",
      textHeight: "h-8",
    },
    medium: {
      iconSize: "w-14 h-14",
      titleClass: "text-sm font-medium leading-[1.1]",
      cardPadding: "p-2.5",
      fixedHeight: "h-[130px]",
      textHeight: "h-9",
    },
    large: {
      iconSize: "w-16 h-16",
      titleClass: "text-base font-semibold leading-[1.1]",
      cardPadding: "p-3",
      fixedHeight: "h-[160px]",
      textHeight: "h-10",
    },
  };

  const config = sizeConfig[size];

  const ServiceCardContent = () => (
    <Card
      className={cn(
        "group transition-all duration-300 bg-card/60 backdrop-blur border-border/50",
        config.fixedHeight,
        !isDisabled && "hover:shadow-lg hover:scale-[1.03] cursor-pointer",
        isDisabled && "opacity-50 cursor-not-allowed bg-muted/30",
        className
      )}
    >
      <CardContent className={cn("h-full", config.cardPadding)}>
        <div className="flex flex-col items-center justify-center h-full gap-1">
          {/* Service Icon */}
          <div className={cn("relative flex-shrink-0", config.iconSize)}>
            <Image
              src={service.iconPath}
              alt={service.name}
              fill
              className={cn("object-contain", isDisabled && "grayscale")}
            />
          </div>

          {/* Service Title - Fixed Height Container */}
          <div
            className={cn(
              "flex items-center justify-center text-center w-full",
              config.textHeight
            )}
          >
            <h3
              className={cn(
                "line-clamp-3 overflow-hidden w-full",
                config.titleClass,
                isDisabled && "text-muted-foreground"
              )}
            >
              {service.name}
            </h3>
          </div>

          {/* Badges (if needed) */}
          {(showCategory || isDisabled) && (
            <div className="flex flex-col items-center gap-0.5 mt-auto">
              {showCategory && (
                <Badge
                  variant={isDisabled ? "outline" : "secondary"}
                  className="text-[8px] px-1 py-0"
                >
                  {service.category}
                </Badge>
              )}
              {isDisabled && (
                <Badge
                  variant="outline"
                  className="text-[8px] px-1 py-0 bg-muted"
                >
                  Disabled
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // If disabled, return the card without Link wrapper
  if (isDisabled) {
    return <ServiceCardContent />;
  }

  // If enabled, wrap with Link
  return (
    <Link href={`/${service.category}/${service.slug}`} className="block">
      <ServiceCardContent />
    </Link>
  );
};

// Export with React.memo to prevent unnecessary re-renders
export const ServiceCard = React.memo(ServiceCardComponent);
