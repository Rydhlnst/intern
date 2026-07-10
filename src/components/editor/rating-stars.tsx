"use client";

import * as React from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = { sm: "size-4", md: "size-5", lg: "size-6" } as const;

export function RatingStars({
  value,
  onChange,
  readOnly,
  size = "md",
  className,
}: Props) {
  const [hover, setHover] = React.useState<number | null>(null);
  const active = hover ?? value;
  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={readOnly ? "img" : "radiogroup"}
      aria-label={`Rating ${value} of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role={readOnly ? undefined : "radio"}
          aria-checked={!readOnly && value === n}
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(null)}
          className={cn(
            "rounded outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            !readOnly && "cursor-pointer",
            readOnly && "cursor-default"
          )}
        >
          <Star
            className={cn(
              sizeMap[size],
              n <= active
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}
