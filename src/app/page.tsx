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
  <header className="w-full flex flex-col font-heading bg-white border-b border-slate-100 shadow-sm">
    <div className="py-4 px-6 lg:px-12 flex justify-between items-center max-w-[1600px] mx-auto w-full">
      {/* Logo */}
      <div className="flex items-center shrink-0">
        <img src="/neds/demo/logo_nolands.png" alt="Noland's Roofing Logo" className="h-16 md:h-20 object-contain" />
      </div>

      {/* Nav Links */}
      <div className="hidden xl:flex items-center justify-center flex-1 gap-8 text-[14px] font-bold tracking-wide text-[#b80028] uppercase px-8">
        <span className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">ROOFING SERVICES <span className="text-[10px] opacity-70">▼</span></span>
        <span className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">HOME RENOVATIONS <span className="text-[10px] opacity-70">▼</span></span>
        <span className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">WHY NOLAND'S <span className="text-[10px] opacity-70">▼</span></span>
        <span className="cursor-pointer hover:opacity-80 transition-opacity">FINANCING</span>
        <span className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">SAMPLE WORK <span className="text-[10px] opacity-70">▼</span></span>
        <span className="cursor-pointer hover:opacity-80 transition-opacity">BLOG</span>
        <span className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">CONTACT <span className="text-[10px] opacity-70">▼</span></span>
      </div>

      {/* Social Icons */}
      <div className="flex items-center gap-4 shrink-0 text-brand-primary">
        <a href="#" className="hover:opacity-80 transition-opacity bg-brand-primary/10 p-2 rounded text-brand-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.6l.4-4h-4V7a1 1 0 0 1 1-1h3z"></path>
          </svg>
        </a>
        <a href="#" className="hover:opacity-80 transition-opacity bg-brand-primary/10 p-2 rounded text-brand-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </a>
        <a href="#" className="hover:opacity-80 transition-opacity bg-brand-primary/10 p-2 rounded text-brand-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
          </svg>
        </a>
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
  const pricePerFoot = 8.50 // $8.50 per linear foot of roofing

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
  const [leadId, setLeadId] = useState<string | null>(null)

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

        // Generate lead ID and save initial partial lead
        const newLeadId = crypto.randomUUID()
        setLeadId(newLeadId)
        fetch('/neds/demo/api/save-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: newLeadId, address: formattedAddress })
        }).catch(err => console.error('Failed to save partial lead:', err))

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
    
    fetch('/neds/demo/api/save-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: leadId,
        address, 
        email,
        quote,
        perimeter: Math.round(perimeter),
        stories,
        treeCoverage,
        steepRoof,
        selectedServices
      })
    }).catch(err => console.error('Failed to save lead:', err))
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 selection:bg-brand-primary/30 flex flex-col overflow-hidden">
      <BrandHeader />
      
      
        {(!mapCenter && appMode === 'map') ? (
          // --- LANDING PAGE ---
          <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 md:py-16 relative z-10 flex flex-col items-center">
            
            <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight text-brand-secondary mb-6 text-center">
              TRUST NOLAND'S — <span className="text-brand-primary">YOUR ROOFING EXPERTS</span>
            </h1>

            <div className="w-full flex flex-col lg:flex-row gap-6 items-stretch mt-4">
              
              {/* Dark Navy Info Block */}
              <div className="flex-1 bg-brand-secondary text-white p-6 md:p-10 rounded-2xl shadow-xl flex flex-col justify-center">
                <h2 className="font-heading text-3xl md:text-4xl text-white mb-4 uppercase tracking-wide">
                  Instant Roofing Quotes. No Waiting.
                </h2>
                <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed font-body">
                  Noland's Roofing delivers expert craftsmanship and unbeatable service across Florida. Get an exact, locked-in price for your roofing project in seconds.
                  <br/><br/>
                  Enter your address to use our proprietary satellite measurement tool and see your instant quote.
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
                  src="/neds/demo/clean_gutters.png" 
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
                      Trace your roof
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed mb-5 font-body">
                      Click on the map to draw lines along your roof's edge.
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
                  { id: 'minor roof repairs', label: 'Minor Roof Repairs', desc: 'Add 20% to total quote' },
                  { id: 'downspout cleaning', label: 'Downspout Cleaning', desc: 'Add $100 flat rate' },
                  { id: 'Roof Inspection', label: 'Detailed Roof Inspection', desc: 'Add $150 flat rate' }
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
