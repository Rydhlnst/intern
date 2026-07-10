import { redirect } from "next/navigation"

import { LoginForm } from "@/components/login-form"
import { getSession } from "@/auth/guards"

export default async function LoginPage() {
  const session = await getSession()
  if (session?.user) {
    redirect("/")
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm />
      </div>
    </div>
  )
}
