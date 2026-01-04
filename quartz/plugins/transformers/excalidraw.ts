import { QuartzTransformerPlugin } from "../types"
import { Root as MdastRoot } from "mdast"
import { visit } from "unist-util-visit"
import path from "path"
import fs from "fs"

export const Excalidraw: QuartzTransformerPlugin = () => {
  return {
    name: "Excalidraw",
    markdownPlugins() {
      return [
        () => {
          return (tree: MdastRoot, file) => {
            const contentDir = path.resolve(file.cwd, "content")

            // Look for text nodes containing ![[*.excalidraw]] pattern
            visit(tree, "text", (node: any, index, parent) => {
              const text = node.value as string
              const wikilinkRegex = /!\[\[([^\]]+\.excalidraw)(?:\|[^\]]+)?\]\]/g

              let match
              while ((match = wikilinkRegex.exec(text)) !== null) {
                const excalidrawPath = match[1]

                // Normalize path - replace spaces with hyphens
                const normalizedPath = excalidrawPath.replace(/ /g, "-")

                // Construct .excalidraw.md file path
                const excalidrawMdPath = `${normalizedPath}.md`

                // Resolve full file system path
                const excalidrawFullPath = path.resolve(
                  contentDir,
                  excalidrawMdPath.replace(/\//g, path.sep),
                )

                if (fs.existsSync(excalidrawFullPath)) {
                  try {
                    // Read the .excalidraw.md file
                    const content = fs.readFileSync(excalidrawFullPath, "utf-8")

                    // Extract compressed-json data
                    const compressedJsonRegex = /```compressed-json\s+([\s\S]+?)\s+```/
                    const jsonMatch = content.match(compressedJsonRegex)

                    if (jsonMatch && jsonMatch[1]) {
                      const compressedData = jsonMatch[1].trim()

                      // Extract embedded files
                      const embeddedFilesRegex = /^([a-f0-9]+):\s*\[\[([^\]]+)\]\]/gm
                      const embeddedFiles: Record<
                        string,
                        { mimeType: string; id: string; dataURL: string; created: number }
                      > = {}
                      let fileMatch

                      while ((fileMatch = embeddedFilesRegex.exec(content)) !== null) {
                        const fileId = fileMatch[1]
                        const fileName = fileMatch[2]

                        // Try to find the image file in content directory
                        const imagePath = path.resolve(contentDir, fileName)
                        if (fs.existsSync(imagePath)) {
                          try {
                            // Store URL reference instead of base64 data
                            const ext = path.extname(fileName).toLowerCase()
                            let mimeType = "image/png"

                            if (ext === ".jpg" || ext === ".jpeg") {
                              mimeType = "image/jpeg"
                            } else if (ext === ".gif") {
                              mimeType = "image/gif"
                            } else if (ext === ".svg") {
                              mimeType = "image/svg+xml"
                            } else if (ext === ".webp") {
                              mimeType = "image/webp"
                            }

                            // Store relative URL instead of base64 data
                            // This will be fetched at runtime by the client
                            embeddedFiles[fileId] = {
                              mimeType,
                              id: fileId,
                              dataURL: `/${fileName}`, // URL reference only
                              created: Date.now(),
                            }
                          } catch (imgError) {
                            console.warn(`Failed to read image file: ${imagePath}`, imgError)
                          }
                        }
                      }

                      // Create a code block node with excalidraw-data class
                      // Embed files data directly in the value with a separator
                      const embeddedFilesJson = JSON.stringify(embeddedFiles)
                      const valueWithFiles = `${compressedData}|||EMBEDDED_FILES|||${embeddedFilesJson}`

                      const codeNode = {
                        type: "code",
                        lang: "excalidraw-data",
                        value: valueWithFiles,
                        meta: null,
                      }

                      if (parent && index !== undefined) {
                        // Replace the text node with code node
                        parent.children[index] = codeNode as any
                      }
                    }
                  } catch (error) {
                    console.error(`Failed to read Excalidraw file: ${excalidrawFullPath}`, error)
                  }
                }
              }
            })
          }
        },
      ]
    },
    htmlPlugins() {
      return []
    },
  }
}
