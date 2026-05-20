'use client'

import { useState, useRef, useEffect } from 'react'
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps'
import MapComponent from '@/components/MapComponent'
import dynamic from 'next/dynamic'
const BlueprintComponent = dynamic(() => import('@/components/BlueprintComponent'), { ssr: false })
import { MapPin, Calculator, ArrowRight, Phone, User, X } from 'lucide-react'

const LIBRARIES: any = ['places'];

// Reusable Header Component to match the screenshot
const BrandHeader = () => (
  <header className="w-full flex flex-col font-heading">
    {/* Navy Top Bar */}
    <div className="bg-brand-secondary text-white py-2 px-6 lg:px-12 flex justify-end lg:justify-between items-center text-xs tracking-widest uppercase font-bold">
      <div className="hidden lg:flex gap-3 text-[11px] whitespace-nowrap overflow-hidden">
        <span className="cursor-pointer hover:text-brand-primary transition-colors">GUTTER CLEANING</span>
        <span className="text-white/30">|</span>
        <span className="cursor-pointer hover:text-brand-primary transition-colors">GUTTER INSTALLATION</span>
        <span className="text-white/30">|</span>
        <span className="cursor-pointer hover:text-brand-primary transition-colors">PEST CONTROL</span>
        <span className="text-white/30">|</span>
        <span className="cursor-pointer hover:text-brand-primary transition-colors">LAWN TREATMENT</span>
        <span className="text-white/30">|</span>
        <span className="cursor-pointer hover:text-brand-primary transition-colors">WINDOW CLEANING</span>
        <span className="text-white/30">|</span>
        <span className="cursor-pointer hover:text-brand-primary transition-colors">POWER WASHING</span>
        <span className="text-white/30">|</span>
        <span className="cursor-pointer hover:text-brand-primary transition-colors">DRYER VENT CLEANING</span>
        <span className="text-white/30">|</span>
        <span className="cursor-pointer hover:text-brand-primary transition-colors">COMMERCIAL SERVICES</span>
      </div>
      <div className="flex items-center gap-3 pl-4 lg:border-l border-white/20 text-[13px]">
        <Phone className="w-3 h-3 text-brand-primary" fill="currentColor" />
        <span className="text-brand-primary">CALL <span className="text-white">(888)616-3307</span></span>
      </div>
    </div>
    
    {/* Orange Main Bar */}
    <div className="bg-brand-primary text-white py-3 px-6 lg:px-12 flex justify-between items-center shadow-md">
      <div className="flex items-center">
        <img src="/logo_full.png" alt="Ned's Home Logo" className="h-12 md:h-16 object-contain" />
      </div>
      <div className="hidden xl:flex gap-8 text-[15px] font-bold tracking-wide uppercase">
        <span className="flex items-center gap-1.5 cursor-pointer hover:text-white/80 transition-colors">SERVICES <span className="text-[10px]">▼</span></span>
        <span className="flex items-center gap-1.5 cursor-pointer hover:text-white/80 transition-colors">LOCATIONS <span className="text-[10px]">▼</span></span>
        <span className="cursor-pointer hover:text-white/80 transition-colors">BLOG</span>
        <span className="flex items-center gap-1.5 cursor-pointer hover:text-white/80 transition-colors">SUPPORT <span className="text-[10px]">▼</span></span>
        <span className="flex items-center gap-1.5 cursor-pointer hover:text-white/80 transition-colors">ABOUT US <span className="text-[10px]">▼</span></span>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 font-bold text-[15px] cursor-pointer hover:text-white/80 transition-colors uppercase tracking-wide">
          <User className="w-4 h-4" strokeWidth={3} />
          ACCOUNT
        </div>
        <button className="bg-white text-brand-primary px-6 py-2.5 font-bold text-[15px] uppercase tracking-wide rounded shadow hover:bg-slate-100 transition-colors">
          Get A Free Quote
        </button>
      </div>
    </div>
  </header>
)

// Autocomplete Input Component
const AddressAutocomplete = ({ 
  address, 
  setAddress, 
  isGeocoding 
}: { 
  address: string, 
  setAddress: (a: string) => void, 
  isGeocoding: boolean 
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const places = useMapsLibrary('places')

  useEffect(() => {
    if (!places || !inputRef.current) return

    const autocomplete = new places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'geometry'],
      types: ['address'],
      componentRestrictions: { country: ['us', 'ca'] } // Restrict to US and Canada
    })

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place.formatted_address) {
        setAddress(place.formatted_address)
      } else if (place.name) {
        setAddress(place.name)
      }
    })

    return () => {
      if (listener) listener.remove()
    }
  }, [places, setAddress])

  return (
    <input 
      ref={inputRef}
      type="text" 
      value={address}
      onChange={(e) => setAddress(e.target.value)}
      placeholder="Enter your home address..." 
      className="w-full bg-white/10 py-3 pl-11 pr-4 text-base font-medium text-white placeholder-white/50 focus:outline-none rounded-lg"
      disabled={isGeocoding}
    />
  )
}

export default function Home() {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} libraries={LIBRARIES}>
      <HomeContent />
    </APIProvider>
  )
}

function HomeContent() {
  const [appMode, setAppMode] = useState<'map' | 'blueprint'>('map')
  const [address, setAddress] = useState('')
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number} | null>(null)
  const [perimeter, setPerimeter] = useState<number>(0) // in feet
  const pricePerFoot = 3.50 // $3.50 per linear foot of gutter

  // Questionnaire state
  const [stories, setStories] = useState<number | null>(null)
  const [treeCoverage, setTreeCoverage] = useState<string>('No')
  const [lastCleaned, setLastCleaned] = useState<string>('< 1 year')
  const [steepRoof, setSteepRoof] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false)
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [mapCompletedLines, setMapCompletedLines] = useState<google.maps.LatLngLiteral[][]>([])
  const [mapCurrentLine, setMapCurrentLine] = useState<google.maps.LatLngLiteral[]>([])
  const [mapHasCentered, setMapHasCentered] = useState(false)
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
        // Set the formatted address for lead capture later
        const formattedAddress = data.results[0].formatted_address || address
        setAddress(formattedAddress)

      } else {
        throw new Error("Could not find that address.")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGeocoding(false)
    }
  }

  let finalQuote = 0
  if (stories !== null) {
    let basePricePerFoot = 0
    if (stories === 1) basePricePerFoot = 1.20
    else if (stories === 2) basePricePerFoot = 1.60
    else if (stories >= 3) basePricePerFoot = 2.00

    let basePrice = perimeter * basePricePerFoot
    let multiplier = 1

    if (treeCoverage === 'Light coverage') multiplier *= 1.1
    if (treeCoverage === 'Medium coverage') multiplier *= 1.2
    if (treeCoverage === 'Heavy coverage') multiplier *= 1.3

    if (lastCleaned === '1-3 years') multiplier *= 1.1
    if (lastCleaned === '3+ years') multiplier *= 1.2

    if (steepRoof) multiplier *= 1.1

    if (selectedServices.includes('minor gutter repairs')) multiplier *= 1.2

    finalQuote = basePrice * multiplier

    if (selectedServices.includes('downspout cleaning')) {
      finalQuote += 100
    }
    if (selectedServices.includes('Gutter Guard Installation')) {
      finalQuote += (perimeter * 15.00)
    }
  }

  const quote = finalQuote > 0 ? finalQuote.toFixed(2) : '--'

  const handleEmailSubmit = async () => {
    if (!email || !address) return
    setIsEmailSent(true)
    
    fetch('/api/save-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, email })
    }).catch(err => console.error('Failed to save lead:', err))
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 selection:bg-brand-primary/30 flex flex-col overflow-hidden">
      <BrandHeader />
      
      
        {(!mapCenter && appMode === 'map') ? (
          // --- LANDING PAGE ---
          <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 md:py-16 relative z-10 flex flex-col items-center">
            
            <h1 className="text-4xl md:text-5xl font-heading font-medium tracking-wide uppercase text-brand-secondary mb-6 text-center">
              TRUST NED STEVENS — <span className="text-brand-primary">THE GUTTER EXPERTS</span>
            </h1>

            <div className="w-full flex flex-col lg:flex-row gap-6 items-stretch mt-4">
              
              {/* Dark Navy Info Block */}
              <div className="flex-1 bg-brand-secondary text-white p-6 md:p-10 rounded-2xl shadow-xl flex flex-col justify-center">
                <h2 className="font-heading text-3xl md:text-4xl text-white mb-4 uppercase tracking-wide">
                  Instant Gutter Quotes. No Waiting.
                </h2>
                <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed font-body">
                  Your home works hard to defend you from the elements. Return the favor and call the team of professionals at Ned Stevens for seasonal gutter cleaning services. 
                  <br/><br/>
                  Enter your address to use our proprietary satellite measurement tool and get an exact, locked-in price for gutter cleaning in seconds.
                </p>
                <div className="w-full max-w-xl p-2 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                  <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative flex items-center">
                      <MapPin className="w-5 h-5 text-white/50 absolute left-4 pointer-events-none z-10" />
                      <AddressAutocomplete 
                        address={address} 
                        setAddress={setAddress} 
                        isGeocoding={isGeocoding} 
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isGeocoding || address.length < 5}
                      className="bg-brand-primary hover:bg-brand-primary-hover text-white px-6 py-3 rounded-lg font-heading font-medium text-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest shadow-md"
                    >
                      {isGeocoding ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <ArrowRight className="w-5 h-5" />}
                      Get Quote
                    </button>
                  </form>
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-px bg-white/20 flex-1"></div>
                  <span className="text-white/60 font-bold uppercase tracking-widest text-xs">OR</span>
                  <div className="h-px bg-white/20 flex-1"></div>
                </div>
                <button 
                  onClick={() => setAppMode('blueprint')}
                  className="mt-6 w-full max-w-xl bg-transparent border-2 border-white/20 hover:border-white/40 hover:bg-white/5 text-white py-4 rounded-xl font-heading font-medium text-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  Upload a PDF / Blueprint
                </button>
                {error && <p className="text-red-400 mt-4 font-bold">{error}</p>}
              </div>
              
              {/* Right Side Image/Graphic Placeholder */}
              <div className="flex-1 rounded-2xl bg-slate-200 overflow-hidden shadow-xl relative min-h-[300px] lg:min-h-full">
                <img 
                  src="/clean_gutters.png" 
                  alt="Gutter Cleaning" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-brand-primary/10 mix-blend-multiply"></div>
              </div>

            </div>
          </main>
        ) : (
          // --- MAP & TRACING VIEW ---
          <div className="flex-1 w-full flex flex-col md:flex-row" style={{ height: 'calc(100vh - 120px)' }}>
            
            {/* Sidebar Quote Panel */}
            <div className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 shadow-xl z-10 flex flex-col">
              <div className="bg-white text-brand-secondary p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-2xl font-medium uppercase tracking-widest">Your Quote</h2>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]" title={address}>{address}</p>
                </div>
                <button onClick={() => setMapCenter(null)} className="text-xs text-slate-600 hover:text-brand-primary font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                  Edit
                </button>
              </div>

              <div className="p-5 flex-1 flex flex-col overflow-hidden">
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center relative overflow-hidden mb-5 text-brand-secondary shadow-sm">
                  <Calculator className="w-32 h-32 absolute -right-8 -bottom-8 text-slate-200" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 relative z-10">Estimated Price</p>
                  <h3 className="font-heading text-5xl md:text-6xl font-bold relative z-10 tracking-wide text-brand-primary">
                    {stories === null ? '--' : `$${quote}`}
                  </h3>
                  <div className="mt-2 flex justify-center gap-4 text-xs font-medium relative z-10">
                    <div>
                      <span className="block text-slate-400 uppercase tracking-wider mb-0.5">Perimeter</span>
                      <span className="font-bold text-base">{Math.round(perimeter)} ft</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                  <div className={`bg-slate-50 p-5 rounded-xl border border-slate-200 shrink-0 ${perimeter === 0 ? 'block' : 'hidden'}`}>
                    <h4 className="font-heading text-xl font-medium tracking-wide text-brand-secondary flex items-center gap-2 mb-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-brand-primary text-white text-xs">1</span>
                      Trace your gutters
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed mb-5 font-body">
                      Click on the map to draw lines along your roof's edge where gutters are located.
                    </p>
                    <h4 className="font-heading text-xl font-medium tracking-wide text-brand-secondary flex items-center gap-2 mb-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-brand-primary text-white text-xs">2</span>
                      See your instant quote
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed font-body">
                      As you draw, the perimeter and price will update automatically above.
                    </p>
                  </div>
                  
                  <div className={`space-y-4 overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-slate-200 font-body flex-1 ${perimeter > 0 ? 'block' : 'hidden'}`}>
                      <div>
                        <label className="block text-xs font-bold text-brand-secondary mb-2 uppercase tracking-wide">Number of Stories</label>
                        <div className="flex gap-2">
                          {[1, 2, 3].map(num => (
                            <button
                              key={num}
                              onClick={() => setStories(num)}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-sm font-bold transition-all border ${stories === num ? 'bg-brand-secondary border-brand-secondary text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-primary'}`}
                            >
                              {num}{num === 3 ? '+' : ''}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-brand-secondary mb-2 uppercase tracking-wide">Tree Coverage?</label>
                        <div className="flex gap-2 flex-wrap">
                          {['No', 'Light coverage', 'Medium coverage', 'Heavy coverage'].map((cov) => (
                            <button
                              key={cov}
                              onClick={() => setTreeCoverage(cov)}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-sm font-bold transition-all border ${treeCoverage === cov ? 'bg-brand-secondary border-brand-secondary text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-primary'}`}
                            >
                              {cov}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-brand-secondary mb-2 uppercase tracking-wide">Steep Roof?</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSteepRoof(true)}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-sm font-bold transition-all border ${steepRoof === true ? 'bg-brand-secondary border-brand-secondary text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-primary'}`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setSteepRoof(false)}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-sm font-bold transition-all border ${steepRoof === false ? 'bg-brand-secondary border-brand-secondary text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-primary'}`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                <div className="mt-4 flex flex-col gap-3 shrink-0 pt-2 border-t border-slate-100">
                  <button 
                    disabled={perimeter === 0}
                    onClick={() => setIsServicesModalOpen(true)}
                    className="w-full bg-white hover:bg-slate-50 text-brand-secondary border-2 border-slate-200 px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    Add another service to your quote
                  </button>
                  
                  <div className="space-y-2 mt-2">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={perimeter === 0 || isEmailSent}
                      placeholder="Enter your email address..."
                      className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm font-medium focus:outline-none focus:border-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button 
                      onClick={handleEmailSubmit}
                      disabled={perimeter === 0 || !email || isEmailSent}
                      className={`w-full ${isEmailSent ? 'bg-green-500' : 'bg-brand-primary hover:bg-brand-primary-hover'} text-white px-5 py-3 rounded-lg font-heading font-medium tracking-wide uppercase text-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
                    >
                      {isEmailSent ? 'Quote Sent!' : 'Email me my quote'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Map / Blueprint Area */}
            <div className="flex-1 relative bg-slate-200 flex flex-col">
              
              {/* Mode Toggle Bar */}
              <div className="absolute top-4 left-4 z-10 flex bg-white rounded-lg shadow-md p-1 font-bold text-xs uppercase tracking-widest border border-slate-200">
                <button 
                  onClick={() => setAppMode('map')} 
                  className={`px-4 py-2 rounded-md transition-colors ${appMode === 'map' ? 'bg-brand-secondary text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Satellite Map
                </button>
                <button 
                  onClick={() => setAppMode('blueprint')} 
                  className={`px-4 py-2 rounded-md transition-colors ${appMode === 'blueprint' ? 'bg-brand-secondary text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Blueprint / PDF
                </button>
              </div>

              <div className={`w-full h-full ${appMode === 'map' ? 'block' : 'hidden'}`}>
                <MapComponent 
                  center={mapCenter!} 
                  onPerimeterChange={setPerimeter} 
                  completedLines={mapCompletedLines}
                  setCompletedLines={setMapCompletedLines}
                  currentLine={mapCurrentLine}
                  setCurrentLine={setMapCurrentLine}
                  hasCentered={mapHasCentered}
                  setHasCentered={setMapHasCentered}
                />
              </div>
              <div className={`w-full h-full ${appMode === 'blueprint' ? 'block' : 'hidden'}`}>
                <BlueprintComponent 
                  onPerimeterChange={setPerimeter} 
                />
              </div>
            </div>

          </div>
        )}

        {/* Add Services Modal */}
        {isServicesModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-secondary/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                <h3 className="font-bold uppercase tracking-wider text-brand-secondary">Additional Services</h3>
                <button onClick={() => setIsServicesModalOpen(false)} className="text-slate-400 hover:text-brand-primary transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { id: 'minor gutter repairs', label: 'Minor Gutter Repairs', desc: 'Add 20% to total quote' },
                  { id: 'downspout cleaning', label: 'Downspout Cleaning', desc: 'Add $100 flat rate' },
                  { id: 'Gutter Guard Installation', label: 'Gutter Guard Installation', desc: 'Add $15/foot flat rate' }
                ].map(service => (
                  <label key={service.id} className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedServices.includes(service.id) ? 'border-brand-secondary bg-slate-50' : 'border-slate-100 hover:border-slate-200'}`}>
                    <div className="pt-0.5">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-brand-secondary cursor-pointer"
                        checked={selectedServices.includes(service.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedServices(prev => [...prev, service.id])
                          } else {
                            setSelectedServices(prev => prev.filter(s => s !== service.id))
                          }
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-brand-secondary">{service.label}</div>
                      <div className="text-xs text-slate-500 font-medium">{service.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <button 
                  onClick={() => setIsServicesModalOpen(false)} 
                  className="w-full bg-brand-secondary hover:bg-brand-primary text-white font-bold py-3 rounded-lg transition-colors uppercase tracking-widest text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
