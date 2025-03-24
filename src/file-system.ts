import { readdir, readFile } from 'fs/promises'
import mime from 'mime'
import path from 'path'
import { fileURLToPath } from 'url'

interface FileInfo {
  uri: string
  name: string
  mimeType: string
}

export async function flattenDirectory(
  directoryPath: string
): Promise<FileInfo[]> {
  const flattenedFiles: FileInfo[] = []

  async function traverseDirectory(currentPath: string, relativeDir: string) {
    try {
      const entries = await readdir(currentPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name)
        const relativeName = path.join(relativeDir, entry.name)

        if (entry.isFile()) {
          const fileUrl = new URL(`file://${path.resolve(fullPath)}`).toString()
          const mimeType = mime.getType(fullPath) || 'application/octet-stream'

          flattenedFiles.push({
            uri: fileUrl,
            name: relativeName,
            mimeType
          })
        } else if (entry.isDirectory()) {
          await traverseDirectory(fullPath, relativeName)
        }
      }
    } catch (error: any) {
      console.error(`Error reading directory ${currentPath}:`, error.message)
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
    const content = await readFile(filePath, 'utf-8')
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
    return null
  }
}
