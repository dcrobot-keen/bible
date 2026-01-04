import { QuartzTransformerPlugin } from "../types"
import { Root as MdastRoot } from "mdast"
import { visit } from "unist-util-visit"
import path from "path"
import fs from "fs"
import { pathToRoot, joinSegments } from "../../util/path"

export const Excalidraw: QuartzTransformerPlugin = () => {
  return {
    name: "Excalidraw",
    markdownPlugins() {
      return [
        () => {
          return (tree: MdastRoot, file) => {
            const contentDir = path.resolve(file.cwd, "content")
            // Calculate base directory for relative paths
            const slug = file.data.slug || ""
            const baseDir = pathToRoot(slug)

            let firstExcalidrawImage: string | null = null

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

                            // Create relative URL using pathToRoot to work on GitHub Pages
                            const relativeUrl = joinSegments(baseDir, fileName)

                            embeddedFiles[fileId] = {
                              mimeType,
                              id: fileId,
                              dataURL: relativeUrl, // Relative URL for GitHub Pages compatibility
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

                      // Set first excalidraw as social image if not already set
                      if (!firstExcalidrawImage) {
                        // Try to find PNG or SVG export of this excalidraw file
                        // excalidrawMdPath is like "Excalidraw/Drawing-2026-01-03-13.02.00.excalidraw.md"
                        // baseName should be "Drawing-2026-01-03-13.02.00.excalidraw"
                        const baseName = path.basename(excalidrawMdPath, ".md")
                        const dirName = path.dirname(excalidrawFullPath)

                        console.log(`Looking for exports of: ${excalidrawFullPath}`)
                        console.log(`  Base name: ${baseName}`)
                        console.log(`  Directory: ${dirName}`)

                        const pngPath = path.join(dirName, `${baseName}.png`)
                        const svgLightPath = path.join(dirName, `${baseName}.light.svg`)
                        const svgPath = path.join(dirName, `${baseName}.svg`)

                        if (fs.existsSync(pngPath)) {
                          // PNG exists, use it as social image
                          const relativePngPath = path
                            .relative(contentDir, pngPath)
                            .replace(/\\/g, "/")
                          firstExcalidrawImage = relativePngPath
                          console.log(`Using PNG for OG image: ${relativePngPath}`)
                        } else if (fs.existsSync(svgLightPath)) {
                          // SVG light theme exists, prefer it
                          const relativeSvgPath = path
                            .relative(contentDir, svgLightPath)
                            .replace(/\\/g, "/")
                          firstExcalidrawImage = relativeSvgPath
                          console.log(`Using light SVG for OG image: ${relativeSvgPath}`)
                        } else if (fs.existsSync(svgPath)) {
                          // SVG exists, use it as social image
                          const relativeSvgPath = path
                            .relative(contentDir, svgPath)
                            .replace(/\\/g, "/")
                          firstExcalidrawImage = relativeSvgPath
                          console.log(`Using SVG for OG image: ${relativeSvgPath}`)
                        } else {
                          // No image found
                          console.log(
                            `No PNG/SVG found for ${excalidrawPath}. Export from Obsidian Excalidraw plugin to use as OG image.`,
                          )
                          firstExcalidrawImage = `__EXCALIDRAW__:${excalidrawPath}`
                        }
                      }
                    }
                  } catch (error) {
                    console.error(`Failed to read Excalidraw file: ${excalidrawFullPath}`, error)
                  }
                }
              }
            })

            // Set socialImage in frontmatter if we found an excalidraw
            if (firstExcalidrawImage && !file.data.frontmatter?.socialImage) {
              if (!file.data.frontmatter) {
                file.data.frontmatter = {}
              }
              file.data.frontmatter.socialImage = firstExcalidrawImage
            }
          }
        },
      ]
    },
    htmlPlugins() {
      return []
    },
  }
}
