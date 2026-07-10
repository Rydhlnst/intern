import "server-only"

import type {
  EmailMessage,
  EmailSendResult,
  EmailTemplateKey,
  EmailTriggerSource,
} from "@/lib/email/types"

export const emailTriggerInventory: Record<
  EmailTemplateKey,
  { triggerSource: EmailTriggerSource; description: string }
> = {
  auth_welcome: {
    triggerSource: "auth",
    description: "Reserved for reader/admin welcome messaging after account creation.",
  },
  auth_verification: {
    triggerSource: "auth",
    description: "Reserved for email verification readiness and auth lifecycle flows.",
  },
  auth_password_reset: {
    triggerSource: "auth",
    description: "Reserved for password reset delivery hooks.",
  },
  reader_overdue_reminder: {
    triggerSource: "reader",
    description: "Reserved for overdue-loan reminders and future circulation alerts.",
  },
  reader_waitlist_ready: {
    triggerSource: "reader",
    description: "Reserved for waitlist or reservation-ready notifications if later added.",
  },
  system_announcement: {
    triggerSource: "system",
    description: "Reserved for operational and platform-wide announcements.",
  },
}

export interface EmailService {
  plan(message: EmailMessage): Promise<EmailSendResult>
}

class PlannedEmailService implements EmailService {
  async plan(message: EmailMessage): Promise<EmailSendResult> {
    void message

    return {
      ok: true,
      status: "planned",
    }
  }
}

export const emailService: EmailService = new PlannedEmailService()

