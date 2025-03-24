#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import { readdir, readFile, writeFile } from 'fs/promises'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { flattenDirectory, readFileFromUri } from './file-system.js'
import {
  ListDirectoryArgsSchema,
  ReadFileArgsSchema,
  ToolInput,
  WriteFileArgsSchema
} from './schemas.js'

// Create server instance
const server = new Server(
  {
    name: 'obsidian-icloud-mcp',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    }
  }
)

// Command line argument parsing
const args = process.argv.slice(2)
if (args.length === 0) {
  console.error(
    'Usage: obsidian-icloud-mcp <allowed-directory> [additional-directories...]'
  )
  process.exit(1)
}

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const resources = await flattenDirectory(args[0])
  return {
    resources
  }
})

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const content = await readFileFromUri(request.params.uri)

  if (content === null) throw new Error('Error reading file from URL')
  return content
})

server.setRequestHandler(ListToolsRequestSchema, async (request) => {
  return {
    tools: [
      {
        name: 'read_file',
        description:
          `Your task is to read file from ${args[0]}` +
          'Read the complete contents of a file from the file system. ' +
          'Handles various text encodings and provides detailed error messages ' +
          'if the file cannot be read. Use this tool when you need to examine ' +
          'the contents of a single file. Only works within allowed directories.' +
          'Make sure to use `ListResourcesRequestSchema` to get whole resources that you can access before',
        inputSchema: zodToJsonSchema(ReadFileArgsSchema) as ToolInput
      },
      {
        name: 'list_directory',
        description:
          `Your task is to list directory from ${args[0]}` +
          'Get a detailed listing of all files and directories in a specified path. ' +
          'Results clearly distinguish between files and directories with [FILE] and [DIR] ' +
          'prefixes. This tool is essential for understanding directory structure and ' +
          'finding specific files within a directory. Only works within allowed directories.' +
          'Make sure to use `ListResourcesRequestSchema` to get whole resources that you can access before',
        inputSchema: zodToJsonSchema(ListDirectoryArgsSchema) as ToolInput
      },
      {
        name: 'write_file',
        description:
          `Your task is to write file to an appropriate path under ${args[0]}` +
          "The path you'll write should follow user's instruction and make sure it hasn't been occupied." +
          'Create a new file or completely overwrite an existing file with new content. ' +
          'Use with caution as it will overwrite existing files without warning. ' +
          'Handles text content with proper encoding. Only works within allowed directories.',
        inputSchema: zodToJsonSchema(WriteFileArgsSchema) as ToolInput
      }
    ]
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params

    switch (name) {
      case 'read_file': {
        const parsed = ReadFileArgsSchema.safeParse(args)
        if (!parsed.success) {
          throw new Error(`Invalid arguments for read_file: ${parsed.error}`)
        }

        const content = await readFile(parsed.data.path, 'utf-8')
        return {
          content: [{ type: 'text', text: content }]
        }
      }

      case 'list_directory': {
        const parsed = ListDirectoryArgsSchema.safeParse(args)
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for list_directory: ${parsed.error}`
          )
        }
        const entries = await readdir(parsed.data.path, { withFileTypes: true })
        const formatted = entries
          .map(
            (entry) =>
              `${entry.isDirectory() ? '[DIR]' : '[FILE]'} ${entry.name}`
          )
          .join('\n')
        return {
          content: [{ type: 'text', text: formatted }]
        }
      }

      case 'write_file': {
        const parsed = WriteFileArgsSchema.safeParse(args)
        if (!parsed.success) {
          throw new Error(`Invalid arguments for write_file: ${parsed.error}`)
        }
        await writeFile(parsed.data.path, parsed.data.content, 'utf-8')
        return {
          content: [
            { type: 'text', text: `Successfully wrote to ${parsed.data.path}` }
          ]
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true
    }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  console.error('Fatal error in main():', error)
  process.exit(1)
})
