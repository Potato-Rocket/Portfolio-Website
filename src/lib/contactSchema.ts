import { z } from "astro/zod";

// Single source of truth for contact-form field bounds + shape, shared by the
// server endpoint (src/pages/api/contact.ts) and the client island
// (src/components/ContactForm.svelte). The server is the authority; the client
// runs the same schema only for immediate feedback. Keep the `maxlength` attrs
// on the inputs in sync with these via CONTACT_LIMITS.
export const CONTACT_LIMITS = {
  name: 100,
  email: 254,
  subject: 200,
  message: 5000,
} as const;

export const ContactSchema = z.object({
  name: z.string().trim().min(1).max(CONTACT_LIMITS.name),
  email: z.email().trim().max(CONTACT_LIMITS.email),
  // Optional: the form offers a subject line, but a blank one falls back to a
  // generated subject server-side so the message is still filed sensibly.
  subject: z.string().trim().max(CONTACT_LIMITS.subject).optional(),
  message: z.string().trim().min(1).max(CONTACT_LIMITS.message),
});

export type ContactInput = z.infer<typeof ContactSchema>;

// Collapse a ZodError into a { field: code } map so both ends render the same
// per-field messages. First issue per field wins.
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fields[key]) fields[key] = issue.code;
  }
  return fields;
}