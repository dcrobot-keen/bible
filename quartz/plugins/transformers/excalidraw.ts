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

                      // Create a code block node with excalidraw-data class
                      const codeNode = {
                        type: "code",
                        lang: "excalidraw-data",
                        value: compressedData,
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
