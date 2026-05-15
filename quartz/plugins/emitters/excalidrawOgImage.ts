import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"
import { QuartzPluginData } from "../vfile"
import fs from "node:fs/promises"
import fsSync from "fs"
import path from "path"
import sharp from "sharp"
import { styleText } from "util"
import { FullSlug, QUARTZ } from "../../util/path"

/**
 * Converts Excalidraw SVG files to PNG for use as OG images
 */
export const ExcalidrawOgImage: QuartzEmitterPlugin = () => {
  return {
    name: "ExcalidrawOgImage",
    getQuartzComponents() {
      return []
    },
    async *emit(ctx, content, _resources) {
      // Get content directory - QUARTZ points to the quartz folder, so go up one level
      const contentDir = path.resolve(QUARTZ, "..", "content")
      const processedSvgs = new Set<string>()

      for (const [_tree, vfile] of content) {
        const socialImage = vfile.data.frontmatter?.socialImage

        // Check if socialImage is an SVG file
        if (
          socialImage &&
          typeof socialImage === "string" &&
          socialImage.endsWith(".svg")
        ) {
          // Avoid processing the same SVG multiple times
          if (processedSvgs.has(socialImage)) continue
          processedSvgs.add(socialImage)

          try {
            // Read SVG file from content directory
            const svgPath = path.resolve(contentDir, socialImage)

            if (fsSync.existsSync(svgPath)) {
              console.log(`Converting SVG to PNG for OG image: ${socialImage}`)

              // Read SVG content
              const svgBuffer = await fs.readFile(svgPath)

              // Convert to PNG with sharp (1200x630 for OG images)
              const pngBuffer = await sharp(svgBuffer)
                .resize(1200, 630, {
                  fit: "contain",
                  background: { r: 255, g: 255, b: 255, alpha: 1 },
                })
                .png()
                .toBuffer()

              // Generate output path (remove .svg extension, will add -og.png)
              const pngFileName = socialImage.replace(/\.svg$/, "-og")
              const slug = pngFileName as FullSlug

              // Write PNG file
              yield write({
                ctx,
                content: pngBuffer,
                slug,
                ext: ".png",
              })

              // Update frontmatter to use PNG instead of SVG
              vfile.data.frontmatter.socialImage = `${pngFileName}.png`

              console.log(`  Created: ${pngFileName}.png`)
            } else {
              console.warn(
                styleText("yellow", `  Warning: SVG file not found: ${svgPath}`),
              )
            }
          } catch (error) {
            console.error(
              styleText("red", `  Error converting SVG to PNG: ${socialImage}`),
              error,
            )
          }
        }
      }
    },
  }
}
