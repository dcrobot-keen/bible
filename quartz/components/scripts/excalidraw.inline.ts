import { registerEscapeHandler, removeAllChildren } from "./util"

interface Position {
  x: number
  y: number
}

class DiagramPanZoom {
  private isDragging = false
  private startPan: Position = { x: 0, y: 0 }
  private currentPan: Position = { x: 0, y: 0 }
  private scale = 1
  private readonly MIN_SCALE = 0.5
  private readonly MAX_SCALE = 3

  cleanups: (() => void)[] = []

  constructor(
    private container: HTMLElement,
    private content: HTMLElement,
  ) {
    this.setupEventListeners()
    this.setupNavigationControls()
    this.resetTransform()
  }

  private setupEventListeners() {
    const mouseDownHandler = this.onMouseDown.bind(this)
    const mouseMoveHandler = this.onMouseMove.bind(this)
    const mouseUpHandler = this.onMouseUp.bind(this)

    const touchStartHandler = this.onTouchStart.bind(this)
    const touchMoveHandler = this.onTouchMove.bind(this)
    const touchEndHandler = this.onTouchEnd.bind(this)

    const resizeHandler = this.resetTransform.bind(this)

    this.container.addEventListener("mousedown", mouseDownHandler)
    document.addEventListener("mousemove", mouseMoveHandler)
    document.addEventListener("mouseup", mouseUpHandler)

    this.container.addEventListener("touchstart", touchStartHandler, { passive: false })
    document.addEventListener("touchmove", touchMoveHandler, { passive: false })
    document.addEventListener("touchend", touchEndHandler)

    window.addEventListener("resize", resizeHandler)

    this.cleanups.push(
      () => this.container.removeEventListener("mousedown", mouseDownHandler),
      () => document.removeEventListener("mousemove", mouseMoveHandler),
      () => document.removeEventListener("mouseup", mouseUpHandler),
      () => this.container.removeEventListener("touchstart", touchStartHandler),
      () => document.removeEventListener("touchmove", touchMoveHandler),
      () => document.removeEventListener("touchend", touchEndHandler),
      () => window.removeEventListener("resize", resizeHandler),
    )
  }

  cleanup() {
    for (const cleanup of this.cleanups) {
      cleanup()
    }
  }

  private setupNavigationControls() {
    const controls = document.createElement("div")
    controls.className = "excalidraw-controls"

    const zoomIn = this.createButton("+", () => this.zoom(0.1))
    const zoomOut = this.createButton("-", () => this.zoom(-0.1))
    const resetBtn = this.createButton("Reset", () => this.resetTransform())

    controls.appendChild(zoomOut)
    controls.appendChild(resetBtn)
    controls.appendChild(zoomIn)

    this.container.appendChild(controls)
  }

  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button")
    button.textContent = text
    button.className = "excalidraw-control-button"
    button.addEventListener("click", onClick)
    window.addCleanup(() => button.removeEventListener("click", onClick))
    return button
  }

  private onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return
    this.isDragging = true
    this.startPan = { x: e.clientX - this.currentPan.x, y: e.clientY - this.currentPan.y }
    this.container.style.cursor = "grabbing"
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return
    e.preventDefault()

    this.currentPan = {
      x: e.clientX - this.startPan.x,
      y: e.clientY - this.startPan.y,
    }

    this.updateTransform()
  }

  private onMouseUp() {
    this.isDragging = false
    this.container.style.cursor = "grab"
  }

  private onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return
    this.isDragging = true
    const touch = e.touches[0]
    this.startPan = { x: touch.clientX - this.currentPan.x, y: touch.clientY - this.currentPan.y }
  }

  private onTouchMove(e: TouchEvent) {
    if (!this.isDragging || e.touches.length !== 1) return
    e.preventDefault()

    const touch = e.touches[0]
    this.currentPan = {
      x: touch.clientX - this.startPan.x,
      y: touch.clientY - this.startPan.y,
    }

    this.updateTransform()
  }

  private onTouchEnd() {
    this.isDragging = false
  }

  private zoom(delta: number) {
    const newScale = Math.min(Math.max(this.scale + delta, this.MIN_SCALE), this.MAX_SCALE)

    const rect = this.content.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const scaleDiff = newScale - this.scale
    this.currentPan.x -= centerX * scaleDiff
    this.currentPan.y -= centerY * scaleDiff

    this.scale = newScale
    this.updateTransform()
  }

  private updateTransform() {
    this.content.style.transform = `translate(${this.currentPan.x}px, ${this.currentPan.y}px) scale(${this.scale})`
  }

  private resetTransform() {
    const svg = this.content.querySelector("svg")
    if (!svg) return

    const rect = svg.getBoundingClientRect()
    const width = rect.width / this.scale
    const height = rect.height / this.scale

    this.scale = 1
    this.currentPan = {
      x: (this.container.clientWidth - width) / 2,
      y: (this.container.clientHeight - height) / 2,
    }
    this.updateTransform()
  }
}

// Decompress base64 compressed data
function decompressData(base64String: string, pako: any, lzString: any): any {
  try {
    // Remove all whitespace, newlines, and tabs
    const cleanBase64 = base64String.replace(/[\s\n\r\t]/g, "")

    console.log("Cleaning base64, length:", cleanBase64.length)

    // First, try LZ-String decompression (Obsidian might use this)
    try {
      const lzDecompressed = lzString.decompressFromBase64(cleanBase64)
      if (lzDecompressed) {
        const parsed = JSON.parse(lzDecompressed)
        console.log("Successfully decompressed with LZ-String")
        return parsed
      }
    } catch (lzError) {
      console.log("LZ-String decompression failed:", lzError)
    }

    // Try to parse as uncompressed JSON
    try {
      const directJson = atob(cleanBase64)
      const parsed = JSON.parse(directJson)
      console.log("Successfully parsed as uncompressed base64-encoded JSON")
      return parsed
    } catch (directError) {
      console.log("Not uncompressed JSON, trying pako decompression...")
    }

    // Decode base64 to binary
    const binaryString = atob(cleanBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    console.log("Decoded bytes, length:", bytes.length)
    console.log("First 20 bytes:", Array.from(bytes.slice(0, 20)))

    // Check for LZ-string compressed format (Obsidian might use this)
    // LZ-string base64 starts with specific patterns
    const firstChar = cleanBase64.charAt(0)
    console.log("First base64 char:", firstChar)

    // Try different decompression methods
    let decompressed: string
    try {
      // Try standard inflate first (with glib/deflate headers)
      decompressed = pako.inflate(bytes, { to: "string" })
      console.log("Decompressed with inflate")
    } catch (e1) {
      console.log("inflate failed:", e1)
      try {
        // Try raw inflate (deflate without headers)
        decompressed = pako.inflateRaw(bytes, { to: "string" })
        console.log("Decompressed with inflateRaw")
      } catch (e2) {
        console.log("inflateRaw failed:", e2)
        try {
          // Try ungzip
          decompressed = pako.ungzip(bytes, { to: "string" })
          console.log("Decompressed with ungzip")
        } catch (e3) {
          console.log("ungzip failed:", e3)
          // Last resort: try interpreting as UTF-8 directly
          const decoder = new TextDecoder("utf-8")
          decompressed = decoder.decode(bytes)
          console.log("Using raw bytes as UTF-8")
        }
      }
    }

    console.log("Decompressed successfully, length:", decompressed.length)
    console.log("First 100 chars:", decompressed.substring(0, 100))

    // Parse JSON
    return JSON.parse(decompressed)
  } catch (error) {
    console.error("Failed to decompress Excalidraw data:", error)
    console.error("Base64 string preview:", base64String.substring(0, 200))
    return null
  }
}

let excalidrawImport: any = undefined
let pakoImport: any = undefined
let lzStringImport: any = undefined

document.addEventListener("nav", async () => {
  const center = document.querySelector(".center") as HTMLElement
  const nodes = center.querySelectorAll('code[data-language="excalidraw-data"]') as NodeListOf<
    HTMLElement
  >
  if (nodes.length === 0) return

  // Lazy load required libraries
  if (!pakoImport) {
    pakoImport = await import("pako")
  }

  if (!lzStringImport) {
    lzStringImport = await import("lz-string")
  }

  if (!excalidrawImport) {
    excalidrawImport = await import("@excalidraw/excalidraw")
  }

  const textMapping: WeakMap<HTMLElement, string> = new WeakMap()
  for (const node of nodes) {
    textMapping.set(node, node.textContent || "")
  }

  async function renderExcalidraw() {
    const darkMode = document.documentElement.getAttribute("saved-theme") === "dark"

    for (const node of nodes) {
      const compressedData = textMapping.get(node)?.trim()
      if (!compressedData) continue

      // Decompress the data
      const sceneData = decompressData(compressedData, pakoImport, lzStringImport)
      if (!sceneData) {
        const errorDiv = document.createElement("div")
        errorDiv.innerHTML = "Failed to load Excalidraw diagram"
        errorDiv.style.padding = "20px"
        errorDiv.style.color = "red"

        const pre = node.parentElement
        if (pre) {
          pre.replaceWith(errorDiv)
        }
        continue
      }

      // Create container for SVG
      const container = document.createElement("div")
      container.className = "excalidraw-container"

      try {
        // Prepare elements and appState
        const elements = sceneData.elements || []
        const appState = sceneData.appState || {}
        let files = sceneData.files || {}

        // Get embedded files from data attribute
        const embeddedFilesAttr = node.getAttribute("data-embedded-files")
        if (embeddedFilesAttr) {
          try {
            const embeddedFiles = JSON.parse(embeddedFilesAttr)
            // Merge embedded files with existing files
            files = { ...files, ...embeddedFiles }
            console.log("Loaded embedded files:", Object.keys(embeddedFiles))
          } catch (e) {
            console.warn("Failed to parse embedded files:", e)
          }
        }

        console.log("Elements count:", elements.length)
        console.log("Files:", files)

        // Try to render using canvas first (more reliable than SVG with workers)
        try {
          console.log("Attempting to render with exportToCanvas...")
          const canvas = await excalidrawImport.exportToCanvas({
            elements: elements,
            appState: {
              ...appState,
              exportBackground: true,
              exportWithDarkMode: darkMode,
              viewBackgroundColor: darkMode ? "#1e1e1e" : "#ffffff",
            },
            files: files || null,
          })

          console.log("Canvas generated successfully")

          // Add canvas to container
          canvas.style.maxWidth = "100%"
          canvas.style.height = "auto"
          container.appendChild(canvas)

          console.log("Excalidraw diagram rendered successfully (canvas)")
        } catch (canvasError) {
          console.log("Canvas export failed, trying SVG:", canvasError)

          // Fallback to SVG
          const svg = await excalidrawImport.exportToSvg({
            elements: elements,
            appState: {
              ...appState,
              exportBackground: true,
              exportWithDarkMode: darkMode,
              viewBackgroundColor: darkMode ? "#1e1e1e" : "#ffffff",
            },
            files: files || null,
            exportPadding: 10,
          })

          console.log("SVG generated successfully")

          // Add SVG to container
          container.appendChild(svg)

          console.log("Excalidraw diagram rendered successfully (SVG)")
        }

        // Replace code block with container
        const pre = node.parentElement
        if (pre) {
          pre.replaceWith(container)
        }
      } catch (error) {
        console.error("Failed to render Excalidraw:", error)
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        const errorStack = error instanceof Error ? error.stack : undefined
        if (errorStack) {
          console.error("Error stack:", errorStack)
        }
        container.innerHTML = `<div style="padding: 20px; color: red;">
          Failed to render Excalidraw diagram<br/>
          Error: ${errorMessage}<br/>
          Check console for details
        </div>`

        const pre = node.parentElement
        if (pre) {
          pre.replaceWith(container)
        }
      }
    }
  }

  await renderExcalidraw()

  // Re-render on theme change
  document.addEventListener("themechange", renderExcalidraw)
  window.addCleanup(() => document.removeEventListener("themechange", renderExcalidraw))
})
