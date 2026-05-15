'use client'

import { useEffect, useState, useRef } from 'react'
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { Trash2, MousePointerClick, RotateCcw } from 'lucide-react'

export default function MapComponent({ 
  center, 
  onPerimeterChange 
}: { 
  center: {lat: number, lng: number},
  onPerimeterChange: (perimeter: number) => void
}) {
  const map = useMap()
  const drawingLib = useMapsLibrary('drawing')
  const geometryLib = useMapsLibrary('geometry')
  
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null)
  const currentPolygonRef = useRef<google.maps.Polygon | null>(null)
  const [isDrawn, setIsDrawn] = useState(false)
  const [managerKey, setManagerKey] = useState(0)

  useEffect(() => {
    if (!map || !drawingLib || !geometryLib) return

    // Initialize Drawing Manager
    const manager = new drawingLib.DrawingManager({
      drawingMode: drawingLib.OverlayType.POLYGON,
      drawingControl: false, // Turned off default UI to use custom
      polygonOptions: {
        fillColor: '#f97316', // High contrast orange
        fillOpacity: 0.4,
        strokeWeight: 4,
        strokeColor: '#ea580c',
        clickable: false,
        editable: true,
        zIndex: 1
      }
    })

    manager.setMap(map)
    setDrawingManager(manager)

    // Event listener for when polygon is complete
    google.maps.event.addListener(manager, 'overlaycomplete', (event: any) => {
      // If there's an existing polygon, remove it
      if (currentPolygonRef.current) {
        currentPolygonRef.current.setMap(null)
      }

      if (event.type === drawingLib.OverlayType.POLYGON) {
        const polygon = event.overlay as google.maps.Polygon
        currentPolygonRef.current = polygon
        setIsDrawn(true)

        // Calculate initial perimeter
        calculatePerimeter(polygon, geometryLib)

        // Switch back to hand/pan mode instead of drawing another polygon
        manager.setDrawingMode(null)

        // Listen for edits
        polygon.getPaths().forEach((path) => {
          google.maps.event.addListener(path, 'insert_at', () => calculatePerimeter(polygon, geometryLib))
          google.maps.event.addListener(path, 'remove_at', () => calculatePerimeter(polygon, geometryLib))
          google.maps.event.addListener(path, 'set_at', () => calculatePerimeter(polygon, geometryLib))
        })
      }
    })

    return () => {
      manager.setMap(null)
    }
  }, [map, drawingLib, geometryLib, onPerimeterChange, managerKey])

  const calculatePerimeter = (polygon: google.maps.Polygon, geometry: google.maps.GeometryLibrary) => {
    const path = polygon.getPath()
    // computeLength returns meters
    const lengthInMeters = geometry.spherical.computeLength(path)
    // Add the distance from the last point to the first point to close the perimeter
    const closedLengthInMeters = lengthInMeters + geometry.spherical.computeDistanceBetween(
      path.getAt(0),
      path.getAt(path.getLength() - 1)
    )
    
    // convert meters to feet (1 meter = 3.28084 feet)
    const lengthInFeet = closedLengthInMeters * 3.28084
    onPerimeterChange(lengthInFeet)
  }

  // Update center when address changes
  useEffect(() => {
    if (map && center) {
      map.panTo(center)
      map.setZoom(20)
    }
  }, [map, center])

  const handleClear = () => {
    if (currentPolygonRef.current) {
      currentPolygonRef.current.setMap(null)
      currentPolygonRef.current = null
    }
    setIsDrawn(false)
    onPerimeterChange(0)
    setManagerKey(prev => prev + 1)
  }

  return (
    <div className="relative w-full h-full">
      <Map
        defaultCenter={center}
        defaultZoom={20}
        mapTypeId="satellite"
        tilt={0}
        disableDefaultUI={false}
        gestureHandling="greedy"
        className="w-full h-full"
      />
      
      {/* Custom Floating UI */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full px-4 pointer-events-none">
        {isDrawn ? (
          <button 
            onClick={handleClear}
            className="pointer-events-auto bg-white hover:bg-red-50 text-red-600 px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 border border-red-100 transition-all hover:scale-105"
          >
            <Trash2 className="w-5 h-5" />
            Clear & Redraw Outline
          </button>
        ) : (
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md text-white pl-6 pr-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-full text-blue-400">
                <MousePointerClick className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-sm">Draw your roof</p>
                <p className="text-xs text-slate-300">Tap the corners. Tap the start point to finish.</p>
              </div>
            </div>
            
            <div className="w-px h-8 bg-slate-700 mx-1"></div>
            
            <button 
              onClick={() => setManagerKey(prev => prev + 1)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors flex flex-col items-center gap-1"
              title="Restart drawing"
            >
              <RotateCcw className="w-4 h-4" />
              Restart
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
