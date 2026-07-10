import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "The Books",
    template: "%s | The Books",
  },
  description: "Library management system with separate public and dashboard flows.",
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return children
}
