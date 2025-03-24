import { ToolSchema } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

export const ListDirectoryArgsSchema = z.object({
  path: z.string()
})

export const ReadFileArgsSchema = z.object({
  path: z.string()
})

export const WriteFileArgsSchema = z.object({
  path: z.string(),
  content: z.string(),
})

const ToolInputSchema = ToolSchema.shape.inputSchema
export type ToolInput = z.infer<typeof ToolInputSchema>
