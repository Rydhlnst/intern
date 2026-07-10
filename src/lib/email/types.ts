export type EmailTemplateKey =
  | "auth_welcome"
  | "auth_verification"
  | "auth_password_reset"
  | "reader_overdue_reminder"
  | "reader_waitlist_ready"
  | "system_announcement"

export type EmailTriggerSource = "auth" | "reader" | "admin" | "system"

export type EmailPayload = Record<string, unknown>

export type EmailRecipient = {
  email: string
  name?: string
  userId?: string | null
}

export type EmailMessage = {
  recipient: EmailRecipient
  templateKey: EmailTemplateKey
  subject: string
  payload: EmailPayload
  triggerSource: EmailTriggerSource
}

export type EmailSendResult =
  | {
      ok: true
      status: "planned" | "queued" | "sent"
      eventId?: number
    }
  | {
      ok: false
      status: "failed" | "skipped"
      reason: string
      eventId?: number
    }
