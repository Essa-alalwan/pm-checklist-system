import { z } from 'zod'

// Shared between the manual template create/update routes and the
// docx-upload parse response — both deal in the same measurementField/
// logField shape, so the zod definitions live in one place to avoid drift.

export const measurementFieldSchema = z.object({
  groupLabel: z.string().optional(),
  rowLabel: z.string().optional(),
  columnLabel: z.string().min(1),
  unit: z.string().optional(),
  fieldType: z.enum(['text', 'number']).default('number'),
})

export const logFieldSchema = z.object({
  groupLabel: z.string().min(1),
  columnLabel: z.string().min(1),
  fieldType: z.enum(['text', 'number']),
  unit: z.string().optional(),
})

export const createTemplateSchema = z.object({
  label: z.string().min(1),
  description: z.string().optional(),
  items: z.array(z.string().min(1)).min(1),
  measurementFields: z.array(measurementFieldSchema).optional(),
  logFields: z.array(logFieldSchema).optional(),
})

export const updateTemplateSchema = createTemplateSchema

// The docx-upload parser's response shape — a set of *suggestions* a
// supervisor must explicitly review and accept, never auto-saved. Validated
// server-side as defense-in-depth: classification is the highest-risk piece
// of the parser, so a shape mismatch should surface as a clean 422 rather
// than silently shipping a malformed suggestion to the review UI.
export const detectedItemSchema = z.object({
  text: z.string().min(1),
  source: z.enum(['list', 'table']),
  sourceTableIndex: z.number().optional(),
})

export const detectedTableGroupSchema = z.object({
  sourceTableIndex: z.number(),
  classification: z.enum(['grid', 'log', 'skipped-reference', 'skipped-header', 'ambiguous']),
  groupLabel: z.string(),
  measurementFields: z.array(measurementFieldSchema).optional(),
  logFields: z.array(logFieldSchema).optional(),
  previewRows: z.array(z.array(z.string())),
})

export const parsedChecklistSchema = z.object({
  suggestedLabel: z.string(),
  suggestedDescription: z.string(),
  items: z.array(detectedItemSchema),
  tableGroups: z.array(detectedTableGroupSchema),
})
