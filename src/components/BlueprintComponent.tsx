'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { UploadCloud, ZoomIn, ZoomOut, Ruler, Trash2, CheckCircle2, RotateCcw, Check, MousePointerClick } from 'lucide-react'

// Initialize pdfjs worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

type Point = { x: number, y: number }

export default function BlueprintComponent({ onPerimeterChange }: { onPerimeterChange: (p: number) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [pdfPage, setPdfPage] = useState<any>(null)
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null)
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Fast-updating view state using refs for perfect math during rapid events
  const view = useRef({ zoom: 1, panX: 0, panY: 0 })
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const pointerDownPos = useRef<Point | null>(null)

  // Tools state
  const [isCalibrating, setIsCalibrating] = useState(false)
  
  // Calibration
  const [calibrationStart, setCalibrationStart] = useState<Point | null>(null)
  const [calibrationEnd, setCalibrationEnd] = useState<Point | null>(null)
  const [pixelsPerFoot, setPixelsPerFoot] = useState<number | null>(null)
  const [showCalibrationPrompt, setShowCalibrationPrompt] = useState(false)
  const [calibrationInput, setCalibrationInput] = useState('')

  // Drawing Segments
  const [completedLines, setCompletedLines] = useState<Point[][]>([])
  const [currentLine, setCurrentLine] = useState<Point[]>([])
  const [mousePos, setMousePos] = useState<Point | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const originalSize = useRef({ width: 0, height: 0 })

  // Recalculate perimeter when points or calibration change
  useEffect(() => {
    if (!pixelsPerFoot) {
      onPerimeterChange(0)
      return
    }

    let totalPixels = 0
    const allLines = [...completedLines]
    if (currentLine.length > 1) {
      allLines.push(currentLine)
    }

    allLines.forEach(line => {
      for (let i = 1; i < line.length; i++) {
        const dx = line[i].x - line[i-1].x
        const dy = line[i].y - line[i-1].y
        totalPixels += Math.sqrt(dx*dx + dy*dy)
      }
    })

    onPerimeterChange(totalPixels / pixelsPerFoot)
  }, [completedLines, currentLine, pixelsPerFoot, onPerimeterChange])

  // Center and Fit Document
  const centerAndFit = useCallback((contentWidth: number, contentHeight: number) => {
    if (!canvasRef.current || !containerRef.current) return
    
    // Force canvas internal resolution to match screen CSS resolution
    canvasRef.current.width = containerRef.current.clientWidth
    canvasRef.current.height = containerRef.current.clientHeight

    const cw = canvasRef.current.width
    const ch = canvasRef.current.height
    
    const padding = 40
    const scaleX = (cw - padding * 2) / contentWidth
    const scaleY = (ch - padding * 2) / contentHeight
    const initialZoom = Math.max(0.01, Math.min(scaleX, scaleY, 1))
    
    const initialPanX = (cw - (contentWidth * initialZoom)) / 2
    const initialPanY = (ch - (contentHeight * initialZoom)) / 2
    
    view.current = { zoom: initialZoom, panX: initialPanX, panY: initialPanY }
  }, [])

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setIsLoading(true)
    setError('')
    view.current = { zoom: 1, panX: 0, panY: 0 }
    setCompletedLines([])
    setCurrentLine([])
    setPixelsPerFoot(null)
    setCalibrationStart(null)
    setCalibrationEnd(null)
    offscreenCanvasRef.current = null

    try {
      if (uploadedFile.type === 'application/pdf') {
        const arrayBuffer = await uploadedFile.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const page = await pdf.getPage(1)
        setPdfPage(page)
        setImageObj(null)
      } else if (uploadedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(uploadedFile)
        const img = new Image()
        img.src = url
        await new Promise((resolve) => {
          img.onload = resolve
        })
        setImageObj(img)
        setPdfPage(null)
        originalSize.current = { width: img.width, height: img.height }
        
        // Timeout ensures the canvas DOM element is fully rendered before fitting
        setTimeout(() => centerAndFit(img.width, img.height), 50)
      } else {
        throw new Error("Unsupported file format. Please upload a PDF, PNG, or JPG.")
      }
      setIsCalibrating(false)
    } catch (err: any) {
      setError(err.message || 'Error processing file')
      setFile(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Draw loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#f8fafc' // slate-50
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(view.current.panX, view.current.panY)
    ctx.scale(view.current.zoom, view.current.zoom)

    // Enable high quality rendering for scaled out images
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Draw document
    if (imageObj) {
      ctx.drawImage(imageObj, 0, 0)
    }
    
    // Draw an offscreen buffer if we made one (for PDF)
    if (offscreenCanvasRef.current) {
      // The offscreen buffer is rendered at 2.0x scale, so we draw it at half size here to maintain 1:1 logical scale
      ctx.drawImage(offscreenCanvasRef.current, 0, 0, originalSize.current.width, originalSize.current.height)
    }

    // Draw Calibration Line
    if (calibrationStart && isCalibrating) {
      ctx.beginPath()
      ctx.moveTo(calibrationStart.x, calibrationStart.y)
      const end = calibrationEnd || (isCalibrating ? mousePos : null)
      if (end) {
        ctx.lineTo(end.x, end.y)
      }
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3 / view.current.zoom
      ctx.stroke()
      
      ctx.fillStyle = '#3b82f6'
      ctx.beginPath()
      ctx.arc(calibrationStart.x, calibrationStart.y, 5 / view.current.zoom, 0, Math.PI * 2)
      ctx.fill()
      if (end) {
        ctx.beginPath()
        ctx.arc(end.x, end.y, 5 / view.current.zoom, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw Completed Lines
    completedLines.forEach(line => {
      if (line.length < 2) return
      ctx.beginPath()
      ctx.moveTo(line[0].x, line[0].y)
      for (let i = 1; i < line.length; i++) {
        ctx.lineTo(line[i].x, line[i].y)
      }
      ctx.strokeStyle = '#F95B16'
      ctx.lineWidth = 4 / view.current.zoom
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.stroke()

      ctx.fillStyle = '#14173D'
      line.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4 / view.current.zoom, 0, Math.PI * 2)
        ctx.fill()
      })
    })

    // Draw Current Line
    if (currentLine.length > 0) {
      ctx.beginPath()
      ctx.moveTo(currentLine[0].x, currentLine[0].y)
      for (let i = 1; i < currentLine.length; i++) {
        ctx.lineTo(currentLine[i].x, currentLine[i].y)
      }
      
      // Preview to mouse
      if (!isCalibrating && mousePos && !isDragging.current) {
        ctx.lineTo(mousePos.x, mousePos.y)
      }

      ctx.strokeStyle = '#E05113' // slightly darker active line
      ctx.lineWidth = 5 / view.current.zoom
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.stroke()

      ctx.fillStyle = '#14173D'
      currentLine.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4 / view.current.zoom, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    ctx.restore()
  }, [imageObj, pdfPage, completedLines, currentLine, mousePos, isCalibrating, calibrationStart, calibrationEnd])

  // PDF Offscreen Renderer
  useEffect(() => {
    if (!pdfPage) {
      offscreenCanvasRef.current = null
      return
    }
    
    const renderPdf = async () => {
      // Render at 2x for sharpness when zoomed in
      const scaleMultiplier = 2.0
      const viewport = pdfPage.getViewport({ scale: scaleMultiplier })
      
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        await pdfPage.render({ canvasContext: ctx, viewport: viewport }).promise
        offscreenCanvasRef.current = canvas
        
        // Logical size is half of the rendered canvas width
        const logicalWidth = viewport.width / scaleMultiplier
        const logicalHeight = viewport.height / scaleMultiplier
        originalSize.current = { width: logicalWidth, height: logicalHeight }
        
        setTimeout(() => centerAndFit(logicalWidth, logicalHeight), 50)
      }
    }
    renderPdf()
  }, [pdfPage, centerAndFit])

  // Animation frame loop
  useEffect(() => {
    let animationFrameId: number
    const render = () => {
      draw()
      animationFrameId = requestAnimationFrame(render)
    }
    render()
    return () => cancelAnimationFrame(animationFrameId)
  }, [draw])

  // Resize canvas to match container
  useEffect(() => {
    if (!file) return
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth
        canvasRef.current.height = containerRef.current.clientHeight
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [file])

  // Coordinate Helpers
  const getMousePos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | React.WheelEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    
    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = (e as React.MouseEvent).clientX
      clientY = (e as React.MouseEvent).clientY
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const screenToWorld = (screenPos: Point): Point => {
    return {
      x: (screenPos.x - view.current.panX) / view.current.zoom,
      y: (screenPos.y - view.current.panY) / view.current.zoom
    }
  }

  // Helper for controlled zooming around a point
  const doZoom = (zoomFactor: number, centerScreenX: number, centerScreenY: number) => {
    const worldX = (centerScreenX - view.current.panX) / view.current.zoom
    const worldY = (centerScreenY - view.current.panY) / view.current.zoom
    const newZoom = Math.max(0.01, Math.min(view.current.zoom * zoomFactor, 10))
    
    view.current = {
      zoom: newZoom,
      panX: centerScreenX - worldX * newZoom,
      panY: centerScreenY - worldY * newZoom
    }
  }

  // Interaction Handlers
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!file) return
    const screenPos = getMousePos(e)

    pointerDownPos.current = screenPos
    isDragging.current = true
    dragStart.current = { x: screenPos.x - view.current.panX, y: screenPos.y - view.current.panY }
  }

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!file) return
    const screenPos = getMousePos(e)
    const worldPos = screenToWorld(screenPos)
    
    setMousePos(worldPos)

    if (isDragging.current && pointerDownPos.current) {
      const dx = screenPos.x - pointerDownPos.current.x
      const dy = screenPos.y - pointerDownPos.current.y
      
      // If moved more than 3 pixels, it's a pan
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        view.current.panX = screenPos.x - dragStart.current.x
        view.current.panY = screenPos.y - dragStart.current.y
      }
    }
  }

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = false
    
    if (!pointerDownPos.current || !file) return
    
    const screenPos = getMousePos(e)
    const dx = screenPos.x - pointerDownPos.current.x
    const dy = screenPos.y - pointerDownPos.current.y
    const isClick = Math.abs(dx) <= 3 && Math.abs(dy) <= 3
    
    pointerDownPos.current = null

    if (isClick) {
      const worldPos = screenToWorld(screenPos)
      
      if (isCalibrating && !showCalibrationPrompt) {
        if (!calibrationStart) {
          setCalibrationStart(worldPos)
        } else if (!calibrationEnd) {
          setCalibrationEnd(worldPos)
          setShowCalibrationPrompt(true)
        }
      } else if (!isCalibrating && pixelsPerFoot) {
        if (currentLine.length === 1) {
          setCompletedLines([...completedLines, [...currentLine, worldPos]])
          setCurrentLine([])
        } else {
          setCurrentLine([worldPos])
        }
      }
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (!file) return
    
    const screenPos = getMousePos(e)
    const zoomSensitivity = 0.005
    const zoomFactor = Math.exp(-e.deltaY * zoomSensitivity)
    
    doZoom(zoomFactor, screenPos.x, screenPos.y)
  }

  const handleZoomInClick = () => {
    if (!canvasRef.current) return
    doZoom(1.2, canvasRef.current.width / 2, canvasRef.current.height / 2)
  }

  const handleZoomOutClick = () => {
    if (!canvasRef.current) return
    doZoom(1 / 1.2, canvasRef.current.width / 2, canvasRef.current.height / 2)
  }

  const submitCalibration = () => {
    const feet = parseFloat(calibrationInput)
    if (isNaN(feet) || feet <= 0 || !calibrationStart || !calibrationEnd) {
      alert("Please enter a valid positive number.")
      return
    }

    const dx = calibrationEnd.x - calibrationStart.x
    const dy = calibrationEnd.y - calibrationStart.y
    const pixels = Math.sqrt(dx*dx + dy*dy)

    setPixelsPerFoot(pixels / feet)
    setShowCalibrationPrompt(false)
    setIsCalibrating(false)
  }

  const handleClear = () => {
    setCompletedLines([])
    setCurrentLine([])
  }

  const handleUndo = () => {
    setCurrentLine(prev => prev.slice(0, -1))
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const preventDefault = (e: Event) => e.preventDefault()
      canvas.addEventListener('contextmenu', preventDefault)
      return () => canvas.removeEventListener('contextmenu', preventDefault)
    }
  }, [])

  if (!file) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 p-6">
        <label className="border-4 border-dashed border-slate-300 rounded-3xl p-12 text-center cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-all max-w-lg w-full">
          <UploadCloud className="w-20 h-20 text-brand-primary mx-auto mb-6" />
          <h3 className="text-2xl font-heading font-bold text-brand-secondary uppercase tracking-widest mb-4">Upload Blueprint</h3>
          <p className="text-slate-500 mb-8">Select a PDF or Image of the property blueprint/floorplan to begin tracing.</p>
          <div className="bg-brand-primary text-white font-bold py-3 px-8 rounded-lg inline-block uppercase tracking-wide">Select File</div>
          <input type="file" accept=".pdf,image/png,image/jpeg" onChange={handleFileUpload} className="hidden" />
          {error && <p className="text-red-500 font-bold mt-4">{error}</p>}
        </label>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 relative overflow-hidden" ref={containerRef}>
      
      {/* Top Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-xl p-2 flex items-center gap-2 z-20 border border-slate-200">
        <button 
          onClick={() => { setIsCalibrating(true); setCalibrationStart(null); setCalibrationEnd(null); setPixelsPerFoot(null); }} 
          className={`p-3 rounded-lg flex flex-col items-center gap-1 min-w-[70px] ${isCalibrating ? 'bg-blue-600 text-white' : (pixelsPerFoot ? 'text-blue-600' : 'text-slate-600 hover:bg-slate-100')}`}
        >
          {pixelsPerFoot && !isCalibrating ? <CheckCircle2 className="w-5 h-5" /> : <Ruler className="w-5 h-5" />}
          <span className="text-[10px] font-bold uppercase tracking-wider">{pixelsPerFoot ? 'Scale Set' : 'Calibrate'}</span>
        </button>
      </div>

      {/* Custom Floating UI (Matches Map View) */}
      {!isCalibrating && pixelsPerFoot && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full px-4 pointer-events-none z-20">
          {completedLines.length > 0 || currentLine.length > 0 ? (
            <div className="pointer-events-auto flex flex-wrap justify-center gap-2 max-w-full">
              <button 
                onClick={handleClear}
                className="bg-white hover:bg-red-50 text-red-600 px-4 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 border border-red-100 transition-all hover:scale-105 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
              
              {currentLine.length > 0 && (
                <button 
                  onClick={handleUndo}
                  className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 border border-slate-200 transition-all hover:scale-105 text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Undo
                </button>
              )}
              
              {currentLine.length === 0 && completedLines.length > 0 && (
                <div className="bg-brand-secondary/90 backdrop-blur-md text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-brand-secondary-hover text-sm font-medium">
                  Tap to start another line
                </div>
              )}
            </div>
          ) : (
            <div className="pointer-events-auto bg-brand-secondary/90 backdrop-blur-md text-white pl-6 pr-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-brand-secondary-hover">
              <div className="flex items-center gap-3">
                <div className="bg-brand-primary/20 p-2 rounded-full text-brand-primary">
                  <MousePointerClick className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-sm">Draw gutters</p>
                  <p className="text-xs text-slate-300">Tap blueprint to trace gutter lines.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 bg-white shadow-xl rounded-xl flex flex-col z-20 border border-slate-200 overflow-hidden">
        <button onClick={handleZoomInClick} className="p-3 hover:bg-slate-100 text-slate-700 border-b border-slate-200">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button onClick={handleZoomOutClick} className="p-3 hover:bg-slate-100 text-slate-700">
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      {/* Status Overlay */}
      {isCalibrating && !showCalibrationPrompt && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-bold py-2 px-6 rounded-full shadow-lg z-20 animate-pulse pointer-events-none">
          {!calibrationStart ? "Click first point of a known measurement" : "Click second point to finish line"}
        </div>
      )}

      {/* Calibration Modal */}
      {showCalibrationPrompt && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full">
            <h3 className="font-heading text-2xl font-bold uppercase tracking-widest text-brand-secondary mb-2">Set Scale</h3>
            <p className="text-slate-600 mb-6 text-sm">Enter the real-world length of the line you just drew to calibrate the tool.</p>
            
            <div className="flex gap-4 items-center mb-6">
              <input 
                type="number" 
                value={calibrationInput}
                onChange={e => setCalibrationInput(e.target.value)}
                placeholder="e.g. 20"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && submitCalibration()}
                className="flex-1 border-2 border-slate-200 rounded-lg p-3 text-xl font-bold text-slate-800 focus:outline-none focus:border-brand-primary"
              />
              <span className="font-bold text-lg text-slate-500">Feet</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowCalibrationPrompt(false); setCalibrationStart(null); setCalibrationEnd(null); setIsCalibrating(false); }} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button onClick={submitCalibration} className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-md hover:bg-brand-primary-hover">
                Calibrate
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas 
        ref={canvasRef}
        className={`w-full h-full ${isDragging.current ? 'cursor-move' : 'cursor-crosshair'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      />
    </div>
  )
}
