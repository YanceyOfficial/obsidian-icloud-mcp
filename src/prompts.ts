export const readFilePrompt = (rootPaths: string[]) =>
  `Your task is to read file from ${rootPaths.join(', ')}. ` +
  'Read the complete contents of a file from the file system. ' +
  'Handles various text encodings and provides detailed error messages ' +
  'if the file cannot be read. Use this tool when you need to examine ' +
  'the contents of a single file. Only works within allowed directories.'

export const readMultipleFilesPrompt = () =>
  'Read the contents of multiple files simultaneously. This is more ' +
  'efficient than reading files one by one when you need to analyze ' +
  "or compare multiple files. Each file's content is returned with its " +
  "path as a reference. Failed reads for individual files won't stop " +
  'the entire operation. Only works within allowed directories.'

export const writeFilePrompt = (rootPaths: string[]) =>
  `Your task is to write file to an appropriate path under ${rootPaths.join(', ')}. ` +
  "The path you'll write should follow user's instruction and make sure it hasn't been occupied." +
  'Create a new file or completely overwrite an existing file with new content. ' +
  'Use with caution as it will overwrite existing files without warning. ' +
  'Handles text content with proper encoding. Only works within allowed directories.'

export const editFilePrompt = (rootPaths: string[]) =>
  `Edit a specific file under ${rootPaths.join(', ')}. ` +
  'Display the modified content to the user for review; the original file will only be updated upon user confirmation. ' +
  'Only works within allowed directories.'

export const removeFilePrompt = () => ''

export const removeMultipleFilesPrompt = () => ''

export const createDirectoryPrompt = () =>
  'Create a new directory or ensure a directory exists. Can create multiple ' +
  'nested directories in one operation. If the directory already exists, ' +
  'this operation will succeed silently. Perfect for setting up directory ' +
  'structures for projects or ensuring required paths exist. Only works within allowed directories.'

export const listDirectoryPrompt = (rootPaths: string[]) =>
  `Your task is to list directory under ${rootPaths.join(', ')}. ` +
  'Get a detailed listing of all files and directories in a specified path. ' +
  'Results clearly distinguish between files and directories with [FILE] and [DIR] ' +
  'prefixes. This tool is essential for understanding directory structure and ' +
  'finding specific files within a directory. Only works within allowed directories.'

export const removeDirectoryPrompt = () => ''

export const removeMultipleDirectoryPrompt = () => ''

export const moveFileDirectoryPrompt = () =>
  'Move or rename files and directories. Can move files between directories ' +
  'and rename them in a single operation. If the destination exists, the ' +
  'operation will fail. Works across different directories and can be used ' +
  'for simple renaming within the same directory. Both source and destination must be within allowed directories.'

export const fullTextSearchDirectoryPrompt = () =>
  "Tokenize the user's query and the search engine tool will return relevant contents. " +
  "summarized those contents based on the user's query."
