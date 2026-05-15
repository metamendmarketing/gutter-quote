'use client'

import { useState } from 'react'
import { APIProvider } from '@vis.gl/react-google-maps'
import MapComponent from '@/components/MapComponent'
import { Search, MapPin, Calculator, ShieldCheck, ArrowRight } from 'lucide-react'

export default function Home() {
  const [address, setAddress] = useState('')
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number} | null>(null)
  const [perimeter, setPerimeter] = useState<number>(0) // in feet
  const pricePerFoot = 3.50 // $3.50 per linear foot of gutter

  // Questionnaire state
  const [stories, setStories] = useState<number>(1)
  const [treeCoverage, setTreeCoverage] = useState<string>('Light')
  const [gutterGuards, setGutterGuards] = useState<boolean>(false)
  const [lastCleaned, setLastCleaned] = useState<string>('< 1 year')

  // For Places Autocomplete, we'll use a simple fetch to Geocoding API for MVP 
  // since a full Places widget might require more boilerplate, 
  // but using a simple form submit to geocode is very robust.
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) return
    setIsGeocoding(true)
    setError(null)
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) throw new Error("Google Maps API Key is missing.")

      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`)
      const data = await res.json()
      
      if (data.status === 'OK' && data.results.length > 0) {
        setMapCenter(data.results[0].geometry.location)
        
        // Save lead in the background
        const formattedAddress = data.results[0].formatted_address || address
        fetch('/api/save-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: formattedAddress })
        }).catch(err => console.error('Failed to save lead:', err))
        
      } else {
        throw new Error("Could not find that address.")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGeocoding(false)
    }
  }

  const basePrice = perimeter * pricePerFoot
  let multiplier = 1

  if (stories === 2) multiplier *= 1.5
  if (stories >= 3) multiplier *= 2.0

  if (treeCoverage === 'Medium') multiplier *= 1.2
  if (treeCoverage === 'Heavy') multiplier *= 1.5

  if (lastCleaned === '1-3 years') multiplier *= 1.1
  if (lastCleaned === '3+ years') multiplier *= 1.2

  let finalQuote = basePrice * multiplier
  if (gutterGuards) {
    finalQuote += (perimeter * 0.50)
  }

  const quote = finalQuote.toFixed(2)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500/30">
      
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        {!mapCenter ? (
          // --- LANDING PAGE ---
          <main className="max-w-4xl mx-auto px-6 py-24 relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-blue-100 text-blue-600 mb-6">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
              Instant Gutter Quotes. <br/><span className="text-blue-600">No Waiting.</span>
            </h1>
            <p className="text-slate-500 max-w-2xl text-xl mb-12 leading-relaxed">
              Enter your address below. We use satellite imagery to measure your home's perimeter and provide an exact, locked-in price for gutter cleaning.
            </p>

            <div className="w-full max-w-xl p-2 bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-200">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative flex items-center">
                  <MapPin className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your home address..." 
                    className="w-full bg-transparent py-4 pl-12 pr-4 text-lg font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
                    disabled={isGeocoding}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isGeocoding || address.length < 5}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGeocoding ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <ArrowRight className="w-5 h-5" />}
                  Get Quote
                </button>
              </form>
            </div>
            {error && <p className="text-red-500 mt-4 font-medium">{error}</p>}
          </main>
        ) : (
          // --- MAP & TRACING VIEW ---
          <div className="h-screen w-full flex flex-col md:flex-row">
            
            {/* Sidebar Quote Panel */}
            <div className="w-full md:w-96 bg-white border-b md:border-b-0 md:border-r border-slate-200 shadow-xl z-10 flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-xl text-slate-900">Your Quote</h2>
                  <p className="text-sm text-slate-500 font-medium truncate max-w-[200px]" title={address}>{address}</p>
                </div>
                <button onClick={() => setMapCenter(null)} className="text-sm text-blue-600 hover:text-blue-700 font-bold bg-blue-50 px-3 py-1.5 rounded-lg">
                  Edit Address
                </button>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 text-center relative overflow-hidden">
                  <Calculator className="w-40 h-40 absolute -right-10 -bottom-10 text-slate-200 opacity-50" />
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 relative z-10">Estimated Price</p>
                  <h3 className="text-5xl font-black text-slate-900 relative z-10 tracking-tighter">
                    ${quote}
                  </h3>
                  <div className="mt-4 flex justify-center gap-4 text-sm font-medium text-slate-600 relative z-10">
                    <div>
                      <span className="block text-slate-400 text-xs uppercase tracking-wider mb-0.5">Perimeter</span>
                      <span className="text-slate-900 font-bold">{Math.round(perimeter)} ft</span>
                    </div>
                    <div className="w-px bg-slate-200"></div>
                    <div>
                      <span className="block text-slate-400 text-xs uppercase tracking-wider mb-0.5">Rate</span>
                      <span className="text-slate-900 font-bold">${pricePerFoot}/ft</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-auto">
                  {perimeter === 0 ? (
                    <>
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm">1</span>
                        Draw your roof outline
                      </h4>
                      <p className="text-slate-500 text-sm leading-relaxed pl-8">
                        Click the corners of your house on the map to draw a shape. Make sure to close the shape by clicking your starting point.
                      </p>
                      <h4 className="font-bold text-slate-900 flex items-center gap-2 mt-6">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm">2</span>
                        See your instant quote
                      </h4>
                      <p className="text-slate-500 text-sm leading-relaxed pl-8">
                        As you draw, the perimeter and price will update automatically above.
                      </p>
                    </>
                  ) : (
                    <div className="space-y-5 overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-slate-200" style={{ maxHeight: 'calc(100vh - 380px)' }}>
                      <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">Number of Stories</label>
                        <div className="flex gap-2">
                          {[1, 2, 3].map(num => (
                            <button
                              key={num}
                              onClick={() => setStories(num)}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${stories === num ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                            >
                              {num}{num === 3 ? '+' : ''} Story
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">Tree Coverage</label>
                        <div className="flex gap-2">
                          {['Light', 'Medium', 'Heavy'].map(cov => (
                            <button
                              key={cov}
                              onClick={() => setTreeCoverage(cov)}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${treeCoverage === cov ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                            >
                              {cov}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">Gutter Guards?</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setGutterGuards(true)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${gutterGuards === true ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setGutterGuards(false)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${gutterGuards === false ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">Last Cleaned</label>
                        <div className="flex flex-col gap-2">
                          {['< 1 year', '1-3 years', '3+ years'].map(time => (
                            <button
                              key={time}
                              onClick={() => setLastCleaned(time)}
                              className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors border text-left flex justify-between items-center ${lastCleaned === time ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                            >
                              <span>{time}</span>
                              {lastCleaned === time && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  disabled={perimeter === 0}
                  className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
                >
                  Book This Price
                </button>
              </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative bg-slate-100">
              <MapComponent 
                center={mapCenter} 
                onPerimeterChange={setPerimeter} 
              />
            </div>

          </div>
        )}
      </APIProvider>
    </div>
  )
}
