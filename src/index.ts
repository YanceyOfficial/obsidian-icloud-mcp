#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from './constants.js'
import {
  createDirectory,
  editFile,
  flattenDirectory,
  fullTextSearch,
  listDirectory,
  moveFile,
  readFile,
  readFileFromUri,
  readMultipleFiles,
  removeDirectory,
  removeFile,
  removeMultipleDirectory,
  removeMultipleFiles,
  writeFile
} from './file-system.js'
import {
  createDirectoryPrompt,
  editFilePrompt,
  fullTextSearchDirectoryPrompt,
  listDirectoryPrompt,
  moveFileDirectoryPrompt,
  readFilePrompt,
  readMultipleFilesPrompt,
  removeDirectoryPrompt,
  removeFilePrompt,
  removeMultipleDirectoryPrompt,
  removeMultipleFilesPrompt,
  writeFilePrompt
} from './prompts.js'
import {
  CreateDirectoryArgsSchema,
  EditFileArgsSchema,
  FullTextSearchArgsSchema,
  ListDirectoryArgsSchema,
  MoveFileArgsSchema,
  ReadFileArgsSchema,
  ReadMultipleFilesArgsSchema,
  RemoveDirectoryArgsSchema,
  RemoveFileArgsSchema,
  RemoveMultipleDirectoryArgsSchema,
  RemoveMultipleFilesArgsSchema,
  ToolInput,
  WriteFileArgsSchema
} from './schemas.js'

const server = new Server(
  {
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    }
  }
)

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error(
    `Usage: ${MCP_SERVER_NAME} <obsidian-directory> [additional-directories...]`
  )
  process.exit(1)
}

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const resources = (
    await Promise.all(args.map((arg) => flattenDirectory(arg)))
  ).flat()
  return {
    resources
  }
})

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const content = await readFileFromUri(request.params.uri)

  if (content === null) throw new Error('Error reading file from URL')
  return content
})

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'read_file',
        description: readFilePrompt(args),
        inputSchema: zodToJsonSchema(ReadFileArgsSchema) as ToolInput
      },
      {
        name: 'read_multiple_files',
        description: readMultipleFilesPrompt(),
        inputSchema: zodToJsonSchema(ReadMultipleFilesArgsSchema) as ToolInput
      },
      {
        name: 'write_file',
        description: writeFilePrompt(args),
        inputSchema: zodToJsonSchema(WriteFileArgsSchema) as ToolInput
      },
      {
        name: 'edit_file',
        description: editFilePrompt(args),
        inputSchema: zodToJsonSchema(EditFileArgsSchema) as ToolInput
      },
      {
        name: 'remove_file',
        description: removeFilePrompt(),
        inputSchema: zodToJsonSchema(RemoveFileArgsSchema) as ToolInput
      },
      {
        name: 'remove_multiple_files',
        description: removeMultipleFilesPrompt(),
        inputSchema: zodToJsonSchema(RemoveMultipleFilesArgsSchema) as ToolInput
      },
      {
        name: 'create_directory',
        description: createDirectoryPrompt(),
        inputSchema: zodToJsonSchema(CreateDirectoryArgsSchema) as ToolInput
      },
      {
        name: 'list_directory',
        description: listDirectoryPrompt(args),
        inputSchema: zodToJsonSchema(ListDirectoryArgsSchema) as ToolInput
      },
      {
        name: 'remove_directory',
        description: removeDirectoryPrompt(),
        inputSchema: zodToJsonSchema(RemoveDirectoryArgsSchema) as ToolInput
      },
      {
        name: 'remove_multiple_directory',
        description: removeMultipleDirectoryPrompt(),
        inputSchema: zodToJsonSchema(
          RemoveMultipleDirectoryArgsSchema
        ) as ToolInput
      },
      {
        name: 'move_file',
        description: moveFileDirectoryPrompt(),
        inputSchema: zodToJsonSchema(MoveFileArgsSchema) as ToolInput
      },
      {
        name: 'full_text_search',
        description: fullTextSearchDirectoryPrompt(),
        inputSchema: zodToJsonSchema(FullTextSearchArgsSchema) as ToolInput
      }
    ]
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params

    switch (name) {
      case 'read_file': {
        return readFile(args)
      }

      case 'read_multiple_files': {
        return readMultipleFiles(args)
      }

      case 'write_file': {
        return writeFile(args)
      }

      case 'edit_file': {
        return editFile(args)
      }

      case 'remove_file': {
        return removeFile(args)
      }

      case 'remove_multiple_files': {
        return removeMultipleFiles(args)
      }

      case 'create_directory': {
        return createDirectory(args)
      }

      case 'list_directory': {
        return listDirectory(args)
      }

      case 'remove_directory': {
        return removeDirectory(args)
      }

      case 'remove_multiple_directory': {
        return removeMultipleDirectory(args)
      }

      case 'move_file': {
        return moveFile(args)
      }

      case 'full_text_search': {
        return fullTextSearch(args)
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
