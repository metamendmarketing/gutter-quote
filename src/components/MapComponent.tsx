'use client'

import { useEffect, useState, useRef, memo } from 'react'
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { Trash2, MousePointerClick, RotateCcw, Check } from 'lucide-react'

const MapComponent = memo(function MapComponent({ 
  center, 
  onPerimeterChange,
  completedLines,
  setCompletedLines,
  currentLine,
  setCurrentLine,
  hasCentered,
  setHasCentered
}: { 
  center: {lat: number, lng: number},
  onPerimeterChange: (perimeter: number) => void,
  completedLines: google.maps.LatLngLiteral[][],
  setCompletedLines: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral[][]>>,
  currentLine: google.maps.LatLngLiteral[],
  setCurrentLine: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral[]>>,
  hasCentered: boolean,
  setHasCentered: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const map = useMap('main-satellite-map')
  const geometryLib = useMapsLibrary('geometry')
  const currentLineRef = useRef<google.maps.LatLngLiteral[]>([])
  useEffect(() => {
    currentLineRef.current = currentLine;
  }, [currentLine]);
  
  const polylinesRef = useRef<google.maps.Polyline[]>([])
  const currentPolylineRef = useRef<google.maps.Polyline | null>(null)

  // Map Listeners
  useEffect(() => {
    if (!map) return;
    
    const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        if (currentLineRef.current.length === 1) {
          const newPt = {lat, lng};
          const finishedLine = [...currentLineRef.current, newPt];
          setCompletedLines(prev => [...prev, finishedLine]);
          setCurrentLine([]);
        } else {
          setCurrentLine([{lat, lng}]);
        }
      }
    });

    const moveListener = map.addListener('mousemove', (e: google.maps.MapMouseEvent) => {
      if (e.latLng && currentPolylineRef.current && currentLineRef.current.length > 0) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const previewPath = [...currentLineRef.current, {lat, lng}];
        currentPolylineRef.current.setPath(previewPath);
      }
    });

    const mouseOutListener = map.addListener('mouseout', () => {
      if (currentPolylineRef.current && currentLineRef.current.length > 0) {
        currentPolylineRef.current.setPath(currentLineRef.current);
      }
    });

    return () => {
      google.maps.event.removeListener(clickListener);
      google.maps.event.removeListener(moveListener);
      google.maps.event.removeListener(mouseOutListener);
    }
  }, [map]);

  // Render Completed Lines
  useEffect(() => {
    if (!map) return;
    
    // Clear old ones
    polylinesRef.current.forEach(pl => pl.setMap(null));
    
    // Create new ones
    polylinesRef.current = completedLines.map(linePath => 
      new google.maps.Polyline({
        map,
        path: linePath,
        strokeColor: '#F95B16', // Brand Orange
        strokeOpacity: 0.8,
        strokeWeight: 4,
        zIndex: 1,
        clickable: false,
      })
    );
    
    // Cleanup on unmount or deps change
    return () => {
      polylinesRef.current.forEach(pl => pl.setMap(null));
    }
  }, [completedLines, map]);

  // Render Current Line
  useEffect(() => {
    if (!map) return;
    if (!currentPolylineRef.current) {
      currentPolylineRef.current = new google.maps.Polyline({
        map,
        path: currentLine,
        strokeColor: '#E05113', // Brand Darker Orange
        strokeOpacity: 1.0,
        strokeWeight: 5,
        zIndex: 2,
        clickable: false,
      });
    } else {
      currentPolylineRef.current.setPath(currentLine);
    }
    
    return () => {}
  }, [currentLine, map]);
  
  // Cleanup current line on unmount
  useEffect(() => {
    return () => {
      if (currentPolylineRef.current) {
        currentPolylineRef.current.setMap(null);
      }
    }
  }, []);

  // Calculate Perimeter whenever lines change
  useEffect(() => {
    if (!geometryLib) return;
    
    let totalMeters = 0;
    const allLines = [...completedLines, currentLine].filter(line => line.length > 1);
    
    allLines.forEach(line => {
      const path = line.map(p => new google.maps.LatLng(p.lat, p.lng));
      totalMeters += geometryLib.spherical.computeLength(path);
    });
    
    const lengthInFeet = totalMeters * 3.28084;
    onPerimeterChange(lengthInFeet);
  }, [completedLines, currentLine, geometryLib, onPerimeterChange]);

  // Update center when address changes
  useEffect(() => {
    if (map && center && !hasCentered) {
      map.panTo(center);
      map.setZoom(20);
      setHasCentered(true);
    }
  }, [map, center, hasCentered, setHasCentered]);

  const handleClear = () => {
    setCompletedLines([]);
    setCurrentLine([]);
  }



  const handleUndo = () => {
    if (currentLine.length > 0) {
      setCurrentLine(prev => prev.slice(0, -1));
    } else if (completedLines.length > 0) {
      setCompletedLines(prev => prev.slice(0, -1));
    }
  }

  return (
    <div className="relative w-full h-full">
      <Map
        id="main-satellite-map"
        defaultCenter={center}
        defaultZoom={20}
        mapTypeId="satellite"
        tilt={0}
        disableDefaultUI={true}
        clickableIcons={false}
        gestureHandling="greedy"
        className="w-full h-full cursor-crosshair"
      />
      
      {/* Custom Floating UI */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full px-4 pointer-events-none z-50">
        {completedLines.length > 0 || currentLine.length > 0 ? (
          <div className="pointer-events-auto flex flex-wrap justify-center gap-2 max-w-full">
            <button 
              onClick={handleClear}
              className="bg-white hover:bg-red-50 text-red-600 px-4 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 border border-red-100 transition-all hover:scale-105 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
            
            {(completedLines.length > 0 || currentLine.length > 0) && (
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
                Tap map to add another line
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
                <p className="text-xs text-slate-300">Tap map to trace gutter lines.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default MapComponent;
