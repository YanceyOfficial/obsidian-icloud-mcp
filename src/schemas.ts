import { ToolSchema } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

export const ReadFileArgsSchema = z.object({
  path: z.string()
})

export const ReadMultipleFilesArgsSchema = z.object({
  paths: z.array(z.string())
})

export const WriteFileArgsSchema = z.object({
  path: z.string(),
  content: z.string()
})

export const RemoveFileArgsSchema = z.object({
  path: z.string()
})

export const RemoveMultipleFilesArgsSchema = z.object({
  paths: z.array(z.string())
})

export const EditFileArgsSchema = z.object({
  path: z.string(),
  newText: z.string(),
  dryRun: z
    .boolean()
    .default(false)
    .describe('Preview changes before real editing.')
})

export const ListDirectoryArgsSchema = z.object({
  path: z.string()
})

export const CreateDirectoryArgsSchema = z.object({
  path: z.string()
})

export const RemoveDirectoryArgsSchema = z.object({
  path: z.string()
})

export const RemoveMultipleDirectoryArgsSchema = z.object({
  paths: z.array(z.string())
})

export const MoveFileArgsSchema = z.object({
  source: z.string(),
  destination: z.string()
})

export const FullTextSearchArgsSchema = z.object({
  query: z.string()
})

export type ToolInput = z.infer<typeof ToolSchema.shape.inputSchema>
