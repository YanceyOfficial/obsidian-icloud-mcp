export interface Resource {
  [x: string]: unknown
  name: string
  uri: string
  description?: string
  mimeType?: string
}

export interface DirectoryNode {
  name: string
  type: 'directory'
  children: (DirectoryNode | FileNode)[]
}

export interface FileNode {
  name: string
  type: 'file'
  uri: string
  mimeType: string
}
