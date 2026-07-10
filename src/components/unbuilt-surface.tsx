"use client"

import type { LucideIcon } from "lucide-react"
import { HammerIcon, SparklesIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type UnbuiltSurfaceProps = {
  title: string
  description: string
  statusLabel?: string
  primaryActionLabel?: string
  secondaryHint?: string
  items?: string[]
  icon?: LucideIcon
  embedded?: boolean
}

export function UnbuiltSurface({
  title,
  description,
  statusLabel = "On Building",
  primaryActionLabel,
  secondaryHint,
  items = [],
  icon: Icon = HammerIcon,
  embedded = false,
}: UnbuiltSurfaceProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[32px] bg-background/80 py-0 shadow-sm ring-1 ring-foreground/5",
        embedded ? "min-h-[320px]" : "min-h-[420px]"
      )}
    >
      <CardContent
        className={cn(
          "flex h-full flex-col justify-between gap-6 p-6 sm:p-8",
          embedded ? "" : "lg:p-10"
        )}
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="rounded-full bg-[var(--library-highlight-soft)] px-3 py-1 text-[var(--library-accent)] hover:bg-[var(--library-highlight-soft)]">
              <SparklesIcon className="mr-1 size-3.5" />
              {statusLabel}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full border-border bg-[var(--library-panel-strong)] px-3 py-1 text-[var(--library-ink-soft)]"
            >
              Reusable Placeholder
            </Badge>
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex size-16 items-center justify-center rounded-[22px] bg-[var(--library-panel-strong)] text-[var(--library-accent)] shadow-sm">
              <Icon className="size-7" />
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {title}
              </h3>
              <p className="max-w-2xl text-sm leading-7 text-[var(--library-ink-soft)] sm:text-base">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] bg-[var(--library-panel)] p-5 ring-1 ring-black/5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--library-ink-soft)]">
              What is being prepared
            </p>
            {items.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-[var(--library-ink-soft)]">
                This module is reserved and styled for future rollout without breaking the current navigation experience.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {items.map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] bg-background/85 px-4 py-3 text-sm text-[var(--library-ink-soft)] ring-1 ring-black/5"
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[28px] bg-[var(--library-highlight-soft)] p-5 text-foreground">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--library-accent)]">
              Current state
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--library-ink-soft)]">
              {secondaryHint ??
                "The route and interaction shell are ready. Functional delivery will be connected in a later feature phase."}
            </p>
            {primaryActionLabel ? (
              <Button className="mt-5 rounded-2xl px-5">
                {primaryActionLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
