import { z } from "zod";

/**
 * Standard return shape for server actions used by forms.
 * Permission failures throw (caught by the framework / error boundary);
 * validation and business-rule failures are returned as `ok: false`.
 */
export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export function actionError(
  error: string,
  fieldErrors?: FieldErrors
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

export function actionOk<T>(data?: T): ActionResult<T> {
  return { ok: true, data };
}

/**
 * Convert a FormData or plain object into a validated payload.
 * Returns either the parsed data or an ActionResult carrying field errors.
 */
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: FormData | Record<string, unknown>
):
  | { success: true; data: z.infer<S> }
  | { success: false; result: ActionResult<never> } {
  const raw =
    input instanceof FormData ? Object.fromEntries(input.entries()) : input;

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      success: false,
      result: actionError("Validation failed", flat.fieldErrors),
    };
  }
  return { success: true, data: parsed.data };
}

/**
 * Postgres unique-violation detection so actions can return a friendly
 * message instead of leaking a driver error.
 */
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}
