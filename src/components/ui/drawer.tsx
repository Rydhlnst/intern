"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

const DrawerContext = React.createContext<{
  direction?: "top" | "bottom" | "left" | "right"
}>({})

function Drawer({
  shouldScaleBackground = true,
  swipeDirection = "down",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
  swipeDirection?: "down" | "up" | "left" | "right"
}) {
  const direction = 
    swipeDirection === "down" ? "bottom" : 
    swipeDirection === "up" ? "top" : 
    swipeDirection; // left, right map directly

  return (
    <DrawerContext.Provider value={{ direction }}>
      <DrawerPrimitive.Root
        shouldScaleBackground={shouldScaleBackground}
        direction={direction}
        {...props}
      />
    </DrawerContext.Provider>
  )
}
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/40 backdrop-blur-sm", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const { direction } = React.useContext(DrawerContext)
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 flex bg-popover text-popover-foreground border shadow-xl outline-none select-text",
          direction === "bottom" && "inset-x-0 bottom-0 max-h-[96%] flex-col rounded-t-[24px] border-t",
          direction === "top" && "inset-x-0 top-0 max-h-[96%] flex-col rounded-b-[24px] border-b",
          direction === "right" && "inset-y-0 right-0 w-[85%] sm:w-[450px] h-full flex-row rounded-l-[24px] border-l",
          direction === "left" && "inset-y-0 left-0 w-[85%] sm:w-[450px] h-full flex-row rounded-r-[24px] border-r",
          className
        )}
        {...props}
      >
        <div className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain rounded-[inherit] select-text",
          direction === "right" || direction === "left" ? "h-full w-full" : ""
        )}>
          {/* Swipe handle for bottom sheet */}
          {direction === "bottom" && (
            <div className="mx-auto mt-4 h-1.5 w-[100px] rounded-full bg-muted cursor-grab active:cursor-grabbing" />
          )}
          {children}
        </div>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
})
DrawerContent.displayName = "DrawerContent"

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex shrink-0 flex-col gap-0.5 p-4 pb-0 text-left md:gap-1.5",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex shrink-0 flex-col gap-2 p-4 pt-0", className)}
      {...props}
    />
  )
}

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    data-slot="drawer-title"
    className={cn(
      "font-heading text-base font-medium text-foreground",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    data-slot="drawer-description"
    className={cn("text-sm text-balance text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
