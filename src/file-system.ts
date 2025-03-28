// @ts-expect-error FIXME:
// It says: Could not find a declaration file for module 'flexsearch'. But after installing @type/flexsearch still doesn't work.
import flexsearch from 'flexsearch'
import fs from 'fs/promises'
import { glob } from 'glob'
import matter from 'gray-matter'
import mime from 'mime'
import path from 'path'
import removeMd from 'remove-markdown'
import { rimraf } from 'rimraf'
import { fileURLToPath } from 'url'
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
  WriteFileArgsSchema
} from './schemas.js'
import { DirectoryNode, Resource } from './types.js'

export async function flattenDirectory(
  directoryPath: string
): Promise<Resource[]> {
  const flattenedFiles: Resource[] = []

  async function traverseDirectory(currentPath: string, relativeDir: string) {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name)
        const relativeName = path.join(relativeDir, entry.name)

        if (entry.isFile()) {
          const fileUrl = new URL(`file://${path.resolve(fullPath)}`).toString()
          const mimeType = mime.getType(fullPath) || 'application/octet-stream'

          flattenedFiles.push({
            uri: fileUrl,
            name: entry.name,
            mimeType
          })
        } else if (entry.isDirectory()) {
          await traverseDirectory(fullPath, relativeName)
        }
      }
    } catch (error) {
      console.error(
        `Error reading directory ${currentPath}:`,
        error instanceof Error ? error.message : error
      )
    }
  }

  const absoluteDirectoryPath = path.resolve(directoryPath)
  await traverseDirectory(
    absoluteDirectoryPath,
    path.basename(absoluteDirectoryPath)
  )

  return flattenedFiles
}

export async function readFileFromUri(fileUri: string) {
  try {
    const fileUrl = new URL(fileUri)
    if (fileUrl.protocol !== 'file:') {
      throw new Error('Invalid URL protocol. Only file:// URLs are supported.')
    }
    const filePath = fileURLToPath(fileUrl)
    const content = await fs.readFile(filePath, 'utf-8')
    return {
      contents: [
        {
          uri: fileUri,
          mimeType: mime.getType(filePath) || 'application/octet-stream',
          text: content
        }
      ]
    }
  } catch (error) {
    console.error(
      `Error reading file ${fileUri}:`,
      error instanceof Error ? error.message : error
    )

    return null
  }
}

export async function getDirectoryTree(
  directoryPath: string
): Promise<DirectoryNode | null> {
  async function traverseDirectory(
    currentPath: string,
    currentName: string
  ): Promise<DirectoryNode | null> {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true })
      const node: DirectoryNode = {
        name: currentName,
        type: 'directory',
        children: []
      }

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name)

        if (entry.isFile()) {
          const fileUrl = new URL(`file://${path.resolve(fullPath)}`).toString()
          const mimeType = mime.getType(fullPath) || 'application/octet-stream'
          node.children.push({
            name: entry.name,
            type: 'file',
            uri: fileUrl,
            mimeType
          })
        } else if (entry.isDirectory()) {
          const childNode = await traverseDirectory(fullPath, entry.name)
          if (childNode) {
            node.children.push(childNode)
          }
        }
      }
      return node
    } catch (error) {
      console.error(
        `Error reading directory ${currentPath}:`,
        error instanceof Error ? error.message : error
      )
      return null
    }
  }

  try {
    const absoluteDirectoryPath = path.resolve(directoryPath)
    const baseName = path.basename(absoluteDirectoryPath)
    const tree = await traverseDirectory(absoluteDirectoryPath, baseName)
    return tree
  } catch (error) {
    console.error(
      `Error processing directory ${directoryPath}:`,
      error instanceof Error ? error.message : error
    )
    return null
  }
}

export async function getFileStats(filePath: string) {
  try {
    const stats = await fs.stat(filePath)
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      permissions: stats.mode.toString(8).slice(-3)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true
    }
  }
}

export async function getAllMarkdownPaths(rootPaths: string[]) {
  const filePaths = (
    await Promise.all(rootPaths.map((rootPath) => glob(`${rootPath}/**/*.md`)))
  ).flat()

  return filePaths
}

export async function readMarkdown(filePath: string) {
  const content = await fs.readFile(filePath, 'utf-8')
  const frontMatter = matter(content)

  return {
    id: filePath,
    title:
      (frontMatter.data.title as string | undefined) ??
      path.basename(filePath, '.md'),
    content: removeMd(content)
  }
}

export async function readAllMarkdowns(filePaths: string[]) {
  const markdowns = await Promise.all(
    filePaths.map((filePath) => readMarkdown(filePath))
  )

  return markdowns
}

export async function readFile(args?: Record<string, unknown>) {
  const parsed = ReadFileArgsSchema.safeParse(args)
  if (!parsed.success) {
    throw new Error(`Invalid arguments for read_file: ${parsed.error}`)
  }

  const content = await fs.readFile(parsed.data.path, 'utf-8')
  return {
    content: [{ type: 'text', text: content }]
  }
}

export async function readMultipleFiles(args?: Record<string, unknown>) {
  const parsed = ReadMultipleFilesArgsSchema.safeParse(args)
  if (!parsed.success) {
    throw new Error(
      `Invalid arguments for read_multiple_files: ${parsed.error}`
    )
  }

  const results = await Promise.all(
    parsed.data.paths.map(async (filePath: string) => {
      const content = await fs.readFile(filePath, 'utf-8')
      return `${filePath}:\n${content}\n`
    })
  )
  return {
    content: [{ type: 'text', text: results.join('\n---\n') }]
  }
}

export async function writeFile(args?: Record<string, unknown>) {
  const parsed = WriteFileArgsSchema.safeParse(args)
  if (!parsed.success) {
    throw new Error(`Invalid arguments for write_file: ${parsed.error}`)
  }

  await fs.writeFile(parsed.data.path, parsed.data.content, 'utf-8')
  return {
    content: [
      { type: 'text', text: `Successfully wrote to ${parsed.data.path}` }
    ]
  }
}

export async function editFile(args?: Record<string, unknown>) {
  const parsed = EditFileArgsSchema.safeParse(args)
  if (!parsed.success) {
    throw new Error(`Invalid arguments for edit_file: ${parsed.error}`)
  }

  if (!parsed.data.dryRun) {
    await fs.writeFile(parsed.data.path, parsed.data.newText)
  }

  return {
    content: [{ type: 'text', text: parsed.data.newText }]
  }
}

export async function removeFile(args?: Record<string, unknown>) {
  const parsed = RemoveFileArgsSchema.safeParse(args)
  if (!parsed.success) {
    throw new Error(`Invalid arguments for remove_file: ${parsed.error}`)
  }
  const result = await fs.unlink(parsed.data.path)
  return {
    content: [{ type: 'text', text: result }]
  }
}

export async function removeMultipleFiles(args?: Record<string, unknown>) {
  const parsed = RemoveMultipleFilesArgsSchema.safeParse(args)
  if (!parsed.success) {
    throw new Error(
      `Invalid arguments for remove_multiple_files: ${parsed.error}`
    )
  }
  const result = await Promise.all(
    parsed.data.paths.map((path) => fs.unlink(path))
  )

  return {
    content: [{ type: 'text', text: result }]
  }
}

export async function createDirectory(args?: Record<string, unknown>) {
  const parsed = CreateDirectoryArgsSchema.safeParse(args)
  if (!parsed.success) {
    throw new Error(`Invalid arguments for create_directory: ${parsed.error}`)
  }
  await fs.mkdir(parsed.data.path, { recursive: true })
  return {
    content: [
      {
        type: 'text',
        text: `Successfully created directory ${parsed.data.path}`
      }
    ]
  }
}

export async function listDirectory(args?: Record<string, unknown>) {
  const parsed = ListDirectoryArgsSchema.safeParse(args)
  if (!parsed.success) {
    throw new Error(`Invalid arguments for list_directory: ${parsed.error}`)
  }
  const entries = await fs.readdir(parsed.data.path, {
    withFileTypes: true
  })
  const formatted = entries
    .map((entry) => `${entry.isDirectory() ? '[DIR]' : '[FILE]'} ${entry.name}`)
    .join('\n')
  return {
    content: [{ type: 'text', text: formatted }]
  }
}

export async function removeDirectory(args?: Record<string, unknown>) {
  const parsed = RemoveDirectoryArgsSchema.safeParse(args)
  if (!parsed.success) {
    throw new Error(`Invalid arguments for remove_directory: ${parsed.error}`)
  }
  const result = await rimraf(parsed.data.path)
  return {
    content: [{ type: 'text', text: result }]
  }
}

export async function removeMultipleDirectory(args?: Record<string, unknown>) {
  const parsed = RemoveMultipleDirectoryArgsSchema.safeParse(args)
  if (!parsed.success) {
    throw new Error(`Invalid arguments for edit_file: ${parsed.error}`)
  }
  const result = await Promise.all(
    parsed.data.paths.map((path) => rimraf(path))
  )

  return {
    content: [{ type: 'text', text: result }]
  }
}

export async function moveFile(args?: Record<string, unknown>) {
  const parsed = MoveFileArgsSchema.safeParse(args)
  if (!parsed.success) {
    throw new Error(`Invalid arguments for move_file: ${parsed.error}`)
  }
  await fs.rename(parsed.data.source, parsed.data.destination)
  return {
    content: [
      {
        type: 'text',
        text: `Successfully moved ${parsed.data.source} to ${parsed.data.destination}`
      }
    ]
  }
}

// TODO: Build index phrase should be mounted on service start, rather than a single request.
export async function fullTextSearch(args?: Record<string, unknown>) {
  const parsed = FullTextSearchArgsSchema.safeParse(args)
  if (!parsed.success) {
    throw new Error(`Invalid arguments for full_text_search: ${parsed.error}`)
  }

  const filePaths = await getAllMarkdownPaths(process.argv.slice(2))
  const documents = await readAllMarkdowns(filePaths)

  const index = new flexsearch.Document({
    document: {
      id: 'id',
      store: true,
      index: [
        {
          field: 'title',
          tokenize: 'forward',
          encoder: flexsearch.Charset.LatinBalance
        },
        {
          field: 'content',
          tokenize: 'forward',
          encoder: flexsearch.Charset.LatinBalance
        }
      ]
    }
  })

  documents.forEach((file) => {
    index.add(file)
  })

  const searchedIds = index.search(parsed.data.query, { limit: 5 })
  const filteredDocuments = documents
    .filter(({ id }) => searchedIds[0].result.includes(id))
    .map((document) => document.content)
  return {
    content: [
      {
        type: 'text',
        text:
          filteredDocuments.length > 0
            ? filteredDocuments.join('\n---\n')
            : 'No matches found'
      }
    ]
  }
}
