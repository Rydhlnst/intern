"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

type BackButtonProps = {
  label?: string
  className?: string
}

export function BackButton({ label = "Back", className }: BackButtonProps) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors",
        className
      )}
    >
      <ChevronLeft className="size-4" />
      {label}
    </button>
  )
}
