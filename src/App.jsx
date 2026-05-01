import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import { MapContainer, TileLayer, Polyline } from 'react-leaflet'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import polyline from '@mapbox/polyline'
import {
  LayoutDashboard, Activity, Scale, History, Settings,
  Footprints, Bike, Dumbbell, Waves, MapPin, FileText,
  Zap, LogOut
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { useStrava } from './hooks/useStrava'
import { useSupabase } from './hooks/useSupabase'

// Constants for styling
const COLORS = {
  background: '#0f0f0f',
  cardBackground: '#1a1a1a',
  accentGreen: '#00F5A0',
  accentOrange: '#FF6B35',
  textSecondary: '#888',
  textPrimary: '#ffffff',
  glassmorphismLight: 'rgba(26, 26, 26, 0.7)',
  glasmorphismBorder: 'rgba(255, 255, 255, 0.1)',
  glassGlow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  greenGlow: 'rgba(0, 245, 160, 0.2)'
}

const TYPOGRAPHY = {
  headingFont: "'Barlow Condensed', sans-serif",
  numbersFont: "'Rajdhani', sans-serif",
  bodyFont: "'Inter', sans-serif",
  titleFont: "'Inter', sans-serif"
}

// Utility function for calculating distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Sidebar Component
const Sidebar = ({ activeSection, setActiveSection, isStravaConnected, onStravaConnect, onStravaDisconnect, isMobile }) => {
  const navItems = [
    { name: 'Dashboard', Icon: LayoutDashboard, section: 'dashboard' },
    { name: 'Activity', Icon: Activity, section: 'activity' },
    { name: 'Body Stats', Icon: Scale, section: 'bodystats' },
    { name: 'History', Icon: History, section: 'history' },
    { name: 'Settings', Icon: Settings, section: 'settings' }
  ]

  if (isMobile) {
    return (
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '8px 6px',
          backgroundColor: COLORS.glassmorphismLight,
          borderTop: `1px solid ${COLORS.glasmorphismBorder}`,
          backdropFilter: 'blur(20px)'
        }}
      >
        {navItems.map((item) => (
          <button
            key={item.section}
            onClick={() => setActiveSection(item.section)}
            style={{
              minHeight: '44px',
              minWidth: '44px',
              padding: '6px 8px',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeSection === item.section ? COLORS.accentGreen : COLORS.textSecondary,
              cursor: 'pointer'
            }}
          >
            <item.Icon size={18} />
            <span style={{ marginTop: '4px', fontSize: '10px', fontWeight: 500 }}>{item.name}</span>
          </button>
        ))}
      </nav>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      height: '100vh',
      width: '80px',
      backgroundColor: COLORS.glassmorphismLight,
      backdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 0',
      borderRight: `1px solid ${COLORS.glasmorphismBorder}`,
      boxShadow: `${COLORS.glassGlow}, inset 0 0 20px rgba(0, 245, 160, 0.05)`,
      zIndex: 100,
      overflowX: 'hidden'
    }}>
      {/* Logo */}
      <img
        src="/gemini-svg.png"
        alt="Logo"
        style={{
          width: '50px',
          height: '50px',
          marginBottom: '30px',
          filter: 'drop-shadow(0 2px 8px rgba(0, 245, 160, 0.3))'
        }}
      />

      {/* Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        {navItems.map((item, index) => (
          <div key={index}
            onClick={() => setActiveSection(item.section)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '44px',
              minWidth: '44px',
              cursor: 'pointer',
              color: activeSection === item.section ? COLORS.accentGreen : COLORS.textSecondary,
              transition: 'all 300ms ease',
              transform: 'scale(1)',
              animation: `slideIn 0.5s ease-out ${index * 0.05}s both`
            }}>
            <item.Icon size={22} style={{ marginBottom: '4px', transition: 'all 300ms ease' }} />
            <span style={{ fontSize: '10px', fontFamily: TYPOGRAPHY.bodyFont, fontWeight: 500, transition: 'all 300ms ease' }}>{item.name}</span>
          </div>
        ))}
      </nav>

      {/* Strava Connection Button */}
      <div style={{
        marginTop: 'auto',
        marginBottom: '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
      }}>
        {!isStravaConnected ? (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg"
            alt="Connect with Strava"
            onClick={onStravaConnect}
            style={{
              width: '50px',
              height: '50px',
              cursor: 'pointer',
              filter: 'drop-shadow(0 2px 8px rgba(252, 76, 2, 0.3))',
              transition: 'all 300ms ease'
            }}
          />
        ) : (
          <>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              backgroundColor: COLORS.glassmorphismLight,
              border: `1px solid ${COLORS.glasmorphismBorder}`,
              boxShadow: `0 0 20px rgba(0, 245, 160, 0.3), ${COLORS.glassGlow}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 300ms ease',
              animation: 'glow 2s ease-in-out infinite'
            }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg" alt="Strava" style={{ width: '28px', height: '28px', filter: 'brightness(1.2)' }} />
            </div>
            <span style={{
              fontSize: '8px',
              fontFamily: TYPOGRAPHY.bodyFont,
              fontWeight: 600,
              color: COLORS.accentGreen,
              textAlign: 'center',
              transition: 'color 300ms ease',
              animation: 'slideIn 0.5s ease-out'
            }}>
              Strava ✓
            </span>
          </>
        )}
      </div>

      {/* Logout Button */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <button
          onClick={onStravaDisconnect}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 68, 68, 0.8)',
            border: `1px solid rgba(255, 100, 100, 0.3)`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '5px',
            transition: 'all 300ms ease',
            boxShadow: '0 4px 12px rgba(255, 68, 68, 0.2)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <LogOut size={22} color={COLORS.textPrimary} />
        </button>
        <span style={{ fontSize: '8px', fontFamily: TYPOGRAPHY.bodyFont, color: COLORS.textSecondary, textAlign: 'center', transition: 'color 300ms ease' }}>
          Salir
        </span>
      </div>
    </div>
  )
}

// Skeleton Loader Component
const SkeletonLoader = ({ width = '100%', height = '120px', borderRadius = '16px' }) => (
  <div style={{
    width,
    height,
    borderRadius,
    background: 'linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite'
  }} />
)

// Progress Ring Component for Workout Goals
const ProgressRing = ({ percentage, label }) => {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.8s ease-out' }}>
      <div style={{ position: 'relative', width: '100px', height: '100px' }}>
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}>
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#333"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={COLORS.accentGreen}
            strokeWidth="8"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '24px',
          fontWeight: 'bold',
          color: COLORS.accentGreen,
          fontFamily: TYPOGRAPHY.numbersFont,
          animation: 'counterUp 0.8s ease-out'
        }}>
          {percentage}%
        </div>
      </div>
      <span style={{ marginTop: '12px', fontSize: '13px', color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.headingFont, fontWeight: 600 }}>
        {label}
      </span>
    </div>
  )
}

// Stat Card Component
const StatCard = ({ title, value, unit, color = COLORS.accentGreen }) => (
  <div style={{
    backgroundColor: COLORS.glassmorphismLight,
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '120px',
    border: `1px solid ${COLORS.glasmorphismBorder}`,
    boxShadow: COLORS.glassGlow,
    transition: 'all 300ms ease',
    cursor: 'pointer',
    animation: 'fadeIn 0.6s ease-out'
  }}>
    <h3 style={{
      margin: '0 0 10px 0',
      fontSize: '14px',
      color: COLORS.textSecondary,
      fontFamily: TYPOGRAPHY.headingFont,
      textTransform: 'uppercase',
      letterSpacing: '1px'
    }}>
      {title}
    </h3>
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: '5px',
      marginTop: 'auto'
    }}>
      <span style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: value ? color : COLORS.textSecondary,
        fontFamily: TYPOGRAPHY.headingFont
      }}>
        {value ? value : '--'}
      </span>
      {value && unit && <span style={{ fontSize: '12px', color: COLORS.textSecondary }}>{unit}</span>}
    </div>
  </div>
)

// Body Composition Cards
const BodyCompositionCards = ({ data }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '15px',
    width: '100%'
  }}>
    <StatCard title="Weight" value={data.weight} unit="kg" color={COLORS.accentGreen} />
    <StatCard title="Muscle Mass" value={data.muscle} unit="kg" color={COLORS.accentOrange} />
    <StatCard title="Body Fat" value={data.fat} unit="kg" color={COLORS.accentOrange} />
    <StatCard title="BMI" value={data.bmi} unit="" color={COLORS.accentGreen} />
  </div>
)

// Upload Zone Component
const UploadZone = ({ label, accept, onChange, IconComponent }) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Create a fake event object to mimic the onChange behavior
      onChange({ target: { files: e.dataTransfer.files } })
    }
  }

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        backgroundColor: COLORS.glassmorphismLight,
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        height: '160px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: `2px dashed ${isDragging ? COLORS.accentGreen : COLORS.glasmorphismBorder}`,
        textAlign: 'center',
        padding: '20px',
        position: 'relative',
        transition: 'all 300ms ease',
        boxShadow: isDragging ? `0 0 30px rgba(0, 245, 160, 0.3), ${COLORS.glassGlow}` : COLORS.glassGlow,
        animation: 'fadeIn 0.6s ease-out'
      }}
    >
      <IconComponent size={40} color={isDragging ? COLORS.accentGreen : COLORS.textSecondary} style={{ marginBottom: '10px' }} />
      <span style={{
        fontSize: '14px',
        color: COLORS.textSecondary,
        fontFamily: TYPOGRAPHY.bodyFont,
        fontWeight: 500
      }}>
        {label}
      </span>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          opacity: 0,
          cursor: 'pointer'
        }}
      />
    </label>
  )
}

// Macros Progress Bars
const MacrosProgress = () => {
  const macrosData = [
    { name: 'Protein', value: 120, max: 150, color: COLORS.accentGreen },
    { name: 'Carbs', value: 180, max: 200, color: COLORS.accentOrange },
    { name: 'Fat', value: 60, max: 80, color: '#FFD166' }
  ]

  return (
    <div style={{
      backgroundColor: COLORS.glassmorphismLight,
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '20px',
      height: '100%',
      border: `1px solid ${COLORS.glasmorphismBorder}`,
      boxShadow: COLORS.glassGlow,
      animation: 'fadeIn 0.8s ease-out',
      transition: 'all 300ms ease'
    }}>
      <h3 style={{ 
        margin: '0 0 18px 0',
        fontSize: '18px',
        color: COLORS.textPrimary,
        fontFamily: TYPOGRAPHY.headingFont,
        fontWeight: 700,
        letterSpacing: '0.5px'
      }}>
        Daily Macros
      </h3>
      {macrosData.map((macro, index) => (
        <div key={index} style={{ marginBottom: '18px', animation: `slideIn 0.6s ease-out ${index * 0.1}s both` }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ 
              fontSize: '14px', 
              color: COLORS.textPrimary,
              fontFamily: TYPOGRAPHY.headingFont,
              fontWeight: 600
            }}>
              {macro.name}
            </span>
            <span style={{ 
              fontSize: '13px',
              color: COLORS.textSecondary,
              fontFamily: TYPOGRAPHY.numbersFont,
              fontWeight: 600
            }}>
              {macro.value}/{macro.max}g
            </span>
          </div>
          <div style={{
            height: '8px',
            backgroundColor: `${macro.color}20`,
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(macro.value / macro.max) * 100}%`,
              height: '100%',
              backgroundColor: macro.color,
              borderRadius: '4px'
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Login Component
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setError('Cuenta creada. Revisa tu email para confirmar.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onLogin()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: TYPOGRAPHY.bodyFont,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(0, 245, 160, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 107, 53, 0.08) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        backgroundColor: 'rgba(26, 26, 26, 0.6)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '50px 40px',
        width: '440px',
        border: `1px solid rgba(255, 255, 255, 0.1)`,
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        position: 'relative',
        zIndex: 1
      }}>
        <img
          src="/gemini-svg.png"
          alt="Logo"
          style={{
            width: '80px',
            height: '80px',
            display: 'block',
            margin: '0 auto 25px',
            filter: 'drop-shadow(0 4px 12px rgba(0, 245, 160, 0.3))'
          }}
        />
        <h1 style={{
          fontSize: '32px',
          fontFamily: TYPOGRAPHY.headingFont,
          fontWeight: '700',
          color: COLORS.textPrimary,
          textAlign: 'center',
          marginBottom: '8px',
          letterSpacing: '-0.5px'
        }}>
          Health Dashboard
        </h1>
        <p style={{
          color: COLORS.textSecondary,
          textAlign: 'center',
          marginBottom: '35px',
          fontSize: '15px',
          fontWeight: '400'
        }}>
          {isSignUp ? 'Crea tu cuenta personal' : 'Bienvenido de nuevo'}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              marginBottom: '16px',
              backgroundColor: 'rgba(15, 15, 15, 0.8)',
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              borderRadius: '12px',
              color: COLORS.textPrimary,
              fontFamily: TYPOGRAPHY.bodyFont,
              fontSize: '15px',
              outline: 'none'
            }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              marginBottom: '25px',
              backgroundColor: 'rgba(15, 15, 15, 0.8)',
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              borderRadius: '12px',
              color: COLORS.textPrimary,
              fontFamily: TYPOGRAPHY.bodyFont,
              fontSize: '15px',
              outline: 'none'
            }}
          />
          {error && (
            <p style={{
              color: error.includes('creada') ? COLORS.accentGreen : COLORS.accentOrange,
              fontSize: '13px',
              marginBottom: '18px',
              textAlign: 'center',
              fontWeight: '500'
            }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              background: loading ? '#333' : 'linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#0a0a0a',
              fontFamily: TYPOGRAPHY.headingFont,
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '18px',
              boxShadow: loading ? 'none' : '0 4px 15px rgba(0, 245, 160, 0.3)',
              letterSpacing: '0.5px'
            }}
          >
            {loading ? 'Cargando...' : isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: COLORS.textSecondary,
            fontFamily: TYPOGRAPHY.bodyFont,
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  )
}

function App() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [gpxData, setGpxData] = useState(null)
  const [gpxFileName, setGpxFileName] = useState(null)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [supabaseSaveMessage, setSupabaseSaveMessage] = useState(null)
  const [savedGpxFiles, setSavedGpxFiles] = useState([])
  const [savedInBodyRecords, setSavedInBodyRecords] = useState([])
  const [inBodyData, setInBodyData] = useState({
    weight: null,
    muscle: null,
    fat: null,
    bmi: null
  })
  const [sectionLoading, setSectionLoading] = useState(false)

  const { isConnected, activities, athlete, loading, getActivities, getAthlete, stravaAuthUrl, disconnect, setActivities } = useStrava()
  const {
    saveWorkout,
    getWorkouts,
    saveInBody,
    getInBodyHistory,
    saveGpxFile,
    savePdfFile,
    getGpxFiles,
    deleteGpxFile,
    deleteInBodyRecord
  } = useSupabase()

  const defaultWeeklyData = [
    { day: 'Dom', distance: 4.8 },
    { day: 'Lun', distance: 5.3 },
    { day: 'Mar', distance: 7.1 },
    { day: 'Mie', distance: 4.2 },
    { day: 'Jue', distance: 8.4 },
    { day: 'Vie', distance: 5.9 },
    { day: 'Sab', distance: 9.2 }
  ]

  const [historicalData, setHistoricalData] = useState([])
  const [weeklyData, setWeeklyData] = useState(defaultWeeklyData)

  // Load cached Strava activities immediately on mount (if Strava connected)
  useEffect(() => {
    if (isConnected) {
      const cached = localStorage.getItem('strava_activities_cache')
      if (cached) {
        try {
          const cachedActivities = JSON.parse(cached)
          setActivities(cachedActivities)
          console.log(`✅ Loaded ${cachedActivities.length} activities from cache on mount`)
        } catch (err) {
          console.error('Error loading cached activities:', err)
        }
      }
    }
  }, [isConnected])

  // Check authentication on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSavedGpxFiles([])
    setSavedInBodyRecords([])
    setInBodyData({ weight: null, muscle: null, fat: null, bmi: null })
    setHistoricalData([])
    setWeeklyData([])
  }

  // Lazy load data based on active section
  useEffect(() => {
    const loadSectionData = async () => {
      setSectionLoading(true)

      try {
        if (activeSection === 'dashboard') {
          // Dashboard only loads InBody data for display (minimal load)
          const inBodyHistory = await getInBodyHistory().catch(() => [])
          setSavedInBodyRecords(inBodyHistory || [])

          // Set most recent InBody data
          if (inBodyHistory && inBodyHistory.length > 0) {
            const latest = inBodyHistory[0]
            setInBodyData({
              weight: latest.weight,
              muscle: latest.muscle_mass,
              fat: latest.body_fat,
              bmi: latest.bmi
            })
          }
        } else if (activeSection === 'activity') {
          // FIRST: Load cached activities immediately for instant display
          const cached = localStorage.getItem('strava_activities_cache')
          const cacheTime = localStorage.getItem('strava_activities_cache_time')

          if (cached) {
            try {
              const cachedActivities = JSON.parse(cached)
              setActivities(cachedActivities)
              console.log(`✅ Showing ${cachedActivities.length} cached activities instantly`)
            } catch (err) {
              console.error('Error loading cached activities:', err)
            }
          }

          // Load GPX files
          const gpxFiles = await getGpxFiles().catch(() => [])
          setSavedGpxFiles(gpxFiles || [])

          // SECOND: Background refresh ONLY if cache is older than 60 minutes
          if (isConnected) {
            const cacheAge = cacheTime ? Date.now() - parseInt(cacheTime) : Infinity
            const CACHE_REFRESH_THRESHOLD = 60 * 60 * 1000 // 60 minutes

            if (cacheAge >= CACHE_REFRESH_THRESHOLD) {
              console.log('⏳ Cache older than 60 min, refreshing in background...')
              getActivities(false).then(async (activities) => {
                // Save each activity to Supabase in background (limit to recent 50)
                if (activities && activities.length > 0) {
                  const recentActivities = activities.slice(0, 50)
                  for (const activity of recentActivities) {
                    try {
                      await saveWorkout(activity)
                    } catch (err) {
                      console.error('Error saving workout to Supabase:', err)
                    }
                  }
                }
              }).catch((err) => {
                // Silently fail - user already has cached data
                console.log('Background refresh failed (likely 429), keeping cached data')
              })

              getAthlete().catch((err) => {
                console.error('Failed to fetch athlete:', err)
              })
            } else {
              console.log('✅ Cache is fresh (<60 min), skipping refresh')
            }
          }
        } else if (activeSection === 'bodystats' || activeSection === 'history') {
          // Load InBody history for charts when BodyStats or History tab is clicked
          const inBodyHistory = await getInBodyHistory().catch(() => [])
          setSavedInBodyRecords(inBodyHistory || [])

          // Set most recent InBody data
          if (inBodyHistory && inBodyHistory.length > 0) {
            const latest = inBodyHistory[0]
            setInBodyData({
              weight: latest.weight,
              muscle: latest.muscle_mass,
              fat: latest.body_fat,
              bmi: latest.bmi
            })

            // Transform inBodyHistory for charts (last 30 records)
            const chartData = inBodyHistory.slice(0, 30).reverse().map(record => ({
              date: new Date(record.measurement_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
              weight: record.weight,
              muscle: record.muscle_mass,
              fat: record.body_fat
            }))
            setHistoricalData(chartData)
          }
        }
      } catch (err) {
        console.error('Error loading section data:', err)
      } finally {
        setSectionLoading(false)
      }
    }

    loadSectionData()
  }, [activeSection, isConnected])

  const workoutGoalsData = [
    { activity: 'Running', percentage: 85 },
    { activity: 'Strength', percentage: 70 },
    { activity: 'Yoga', percentage: 60 }
  ]

  // Fetch real Strava data for weekly chart (last 7 days)
  const fetchWeeklyStravaData = async () => {
    if (!isConnected) {
      setWeeklyData(defaultWeeklyData)
      return
    }

    try {
      // Use cached activities if available
      const cachedActivities = localStorage.getItem('strava_activities_cache')
      let activities = cachedActivities ? JSON.parse(cachedActivities) : await getActivities()

      if (!activities || activities.length === 0) {
        setWeeklyData(defaultWeeklyData)
        return
      }

      const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today

      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 6) // Last 7 days including today
      sevenDaysAgo.setHours(0, 0, 0, 0) // Start of that day

      const weeklyChartData = days.map(day => ({ day, distance: 0 }))

      activities.forEach(activity => {
        const activityDate = new Date(activity.start_date)
        if (activityDate >= sevenDaysAgo && activityDate <= today) {
          const dayIndex = activityDate.getDay()
          weeklyChartData[dayIndex].distance += (activity.distance || 0) / 1000 // Convert to km
        }
      })

      console.log('📊 Weekly data:', weeklyChartData)
      setWeeklyData(weeklyChartData)
    } catch (error) {
      console.error('Error fetching weekly Strava data:', error)
      setWeeklyData(defaultWeeklyData)
    }
  }

  // Fetch weekly data when dashboard is loaded and Strava is connected
  useEffect(() => {
    if (isConnected && activeSection === 'dashboard') {
      fetchWeeklyStravaData()
    }
  }, [isConnected, activeSection])

  const handleGpxUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setGpxFileName(file.name)
    setSupabaseSaveMessage(null)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target.result
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(content, 'text/xml')
      const trkpts = xmlDoc.getElementsByTagName('trkpt')
      const route = []
      let distance = 0
      let prevLat = null, prevLon = null

      for (let i = 0; i < trkpts.length; i++) {
        const lat = parseFloat(trkpts[i].getAttribute('lat'))
        const lon = parseFloat(trkpts[i].getAttribute('lon'))
        route.push([lat, lon])
        if (prevLat !== null) distance += calculateDistance(prevLat, prevLon, lat, lon)
        prevLat = lat; prevLon = lon
      }

      const parsedData = {
        route,
        distance: distance.toFixed(2)
      }

      setGpxData(parsedData)

      // Save to Supabase
      try {
        const result = await saveGpxFile(file.name, parsedData, file)

        if (result.duplicate) {
          setSupabaseSaveMessage('⚠️ Este archivo ya fue registrado anteriormente')
        } else {
          setSupabaseSaveMessage('✓ Guardado en Supabase')
          // Refresh saved files list
          const files = await getGpxFiles()
          setSavedGpxFiles(files || [])
        }

        setTimeout(() => setSupabaseSaveMessage(null), 3000)
      } catch (err) {
        console.error('Error saving GPX to Supabase:', err)
        setSupabaseSaveMessage('❌ Error guardando en Supabase')
        setTimeout(() => setSupabaseSaveMessage(null), 3000)
      }
    }
    reader.readAsText(file)
  }

  const handleInBodyUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSupabaseSaveMessage(null)

    try {
      // Load pdfjs with proper worker configuration
      const pdfjsLib = await import('pdfjs-dist/build/pdf.min.mjs')
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).href

      // Load PDF document
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      
      // Extract text from all pages
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map(item => item.str).join(' ')
        fullText += pageText + ' '
      }
      
      console.log('📄 PDF extracted text:', fullText)

      // InBody120 fixed scales - extract value after each scale
      // Weight scale: 55 70 85 100 115 130 145 160 175 190 205 [VALUE]
      const weightMatch = fullText.match(/55\s+70\s+85\s+100\s+115\s+130\s+145\s+160\s+175\s+190\s+205\s+([\d.]+)/)
      const weight = weightMatch ? parseFloat(weightMatch[1]) : null

      // Muscle scale: 70 80 90 100 110 120 130 140 150 160 170 [VALUE]
      const muscleMatch = fullText.match(/70\s+80\s+90\s+100\s+110\s+120\s+130\s+140\s+150\s+160\s+170\s+([\d.]+)/)
      const muscle = muscleMatch ? parseFloat(muscleMatch[1]) : null

      // Fat scale: 40 60 80 100 160 220 280 340 400 460 520 [VALUE]
      const fatMatch = fullText.match(/40\s+60\s+80\s+100\s+160\s+220\s+280\s+340\s+400\s+460\s+520\s+([\d.]+)/)
      const fat = fatMatch ? parseFloat(fatMatch[1]) : null

      // BMI scale: 10.0 15.0 18.5 22.0 25.0 30.0 35.0 40.0 45.0 50.0 55.0 [VALUE]
      const bmiMatch = fullText.match(/10\.0\s+15\.0\s+18\.5\s+22\.0\s+25\.0\s+30\.0\s+35\.0\s+40\.0\s+45\.0\s+50\.0\s+55\.0\s+([\d.]+)/)
      const bmi = bmiMatch ? parseFloat(bmiMatch[1]) : null

      console.log('🎯 BMI extracted:', bmi)

      // Extract water and protein from range patterns
      const valuePattern = /([\d.]+)\s+\(\s*\)\s+[\d.]+~[\d.]+/g
      const matches = []
      let match
      while ((match = valuePattern.exec(fullText)) !== null) {
        matches.push(parseFloat(match[1]))
      }

      const parsedData = {
        weight,
        muscle,
        fat,
        bmi,
        water: matches[0] || null,
        protein: matches[1] || null,
        measurement_date: new Date().toISOString()
      }

      console.log('📊 Final parsed InBody data:', parsedData)

      setInBodyData(parsedData)

      // Save to Supabase
      const result = await savePdfFile(file.name, file, parsedData)

      if (result.duplicate) {
        setSupabaseSaveMessage('⚠️ Este archivo ya fue registrado anteriormente')
        setTimeout(() => setSupabaseSaveMessage(null), 3000)
      } else {
        setSupabaseSaveMessage('✓ Guardado en Supabase')

        // Refresh saved records list and update UI
        const records = await getInBodyHistory()
        setSavedInBodyRecords(records || [])

        // Update current display with latest record
        if (records && records.length > 0) {
          const latest = records[0]
          setInBodyData({
            weight: latest.weight,
            muscle: latest.muscle_mass,
            fat: latest.body_fat,
            bmi: latest.bmi
          })

          // Update historical data for charts
          const chartData = records.slice(0, 30).reverse().map(record => ({
            date: new Date(record.measurement_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
            weight: record.weight,
            muscle: record.muscle_mass,
            fat: record.body_fat
          }))
          setHistoricalData(chartData)
        }

        setTimeout(() => setSupabaseSaveMessage(null), 3000)
      }
    } catch (err) {
      console.error('Error processing InBody PDF:', err)
      const errorMsg = err.message.includes('ya fue registrado')
        ? '⚠️ Este reporte ya fue registrado anteriormente'
        : '❌ Error procesando PDF'
      setSupabaseSaveMessage(errorMsg)
      setTimeout(() => setSupabaseSaveMessage(null), 5000)
    }
  }

  const handleStravaConnect = () => {
    window.location.href = stravaAuthUrl()
  }

  const handleStravaDisconnect = () => {
    disconnect()
    window.location.reload()
  }

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity)

    // Decode polyline to coordinates
    if (activity.map && activity.map.summary_polyline) {
      const coordinates = polyline.decode(activity.map.summary_polyline)
      setGpxData({
        route: coordinates,
        distance: (activity.distance / 1000).toFixed(2),
        name: activity.name,
        type: activity.type
      })
    }

    setActiveSection('activity')
  }

  const getActivityIcon = (type) => {
    const iconMap = {
      'Run': Footprints,
      'Ride': Bike,
      'Swim': Waves,
      'Walk': Footprints,
      'Hike': Footprints,
      'WeightTraining': Dumbbell,
      'Workout': Dumbbell
    }
    const IconComponent = iconMap[type] || Activity
    return <IconComponent size={20} />
  }

  if (authLoading) {
    return (
      <div style={{
        backgroundColor: COLORS.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.textPrimary,
        fontFamily: TYPOGRAPHY.headingFont
      }}>
        Cargando...
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onLogin={() => setUser(true)} />
  }

  const weeklyChartSeries = weeklyData.length ? weeklyData : defaultWeeklyData

  return (
    <div style={{
      backgroundColor: COLORS.background,
      color: COLORS.textPrimary,
      minHeight: '100vh',
      fontFamily: TYPOGRAPHY.bodyFont,
      display: 'flex'
    }}>
      {/* Import fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Rajdhani:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          overflow-x: hidden;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 0 20px rgba(0, 245, 160, 0.1);
          }
          50% {
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 0 30px rgba(0, 245, 160, 0.2);
          }
        }
        
        @keyframes counterUp {
          from {
            opacity: 0.5;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        ::-webkit-scrollbar {
          width: 10px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${COLORS.background};
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${COLORS.textSecondary};
          border-radius: 5px;
          transition: background 300ms ease;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${COLORS.accentGreen}50;
        }
        
        .leaflet-container {
          background: ${COLORS.cardBackground} !important;
        }
        
        [data-card] {
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        [data-card]:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 48px 0 rgba(0, 245, 160, 0.15);
        }
        
        button, [role="button"] {
          transition: all 300ms ease;
          min-height: 44px;
        }

        button:hover:not(:disabled), [role="button"]:hover {
          transform: translateY(-2px);
        }
      `}</style>
      
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isStravaConnected={isConnected}
        onStravaConnect={handleStravaConnect}
        onStravaDisconnect={handleLogout}
        isMobile={isMobile}
      />
      
      {/* Main Content */}
      <main style={{
        marginLeft: isMobile ? '0' : '80px',
        padding: isMobile ? '16px 12px 70px' : '20px',
        width: isMobile ? '100%' : 'calc(100% - 80px)',
        minHeight: '100vh'
      }}>
        {activeSection === 'dashboard' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
            gridAutoRows: 'minmax(150px, auto)',
            gap: isMobile ? '14px' : '20px',
            alignItems: 'stretch'
          }}>
            {/* Activity Chart - Spans 3 columns */}
            <div style={{
              gridColumn: '1 / -1',
              backgroundColor: COLORS.glassmorphismLight,
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '24px',
              width: '100%',
              height: '300px',
              border: `1px solid ${COLORS.glasmorphismBorder}`,
              boxShadow: COLORS.glassGlow,
              animation: 'fadeIn 0.6s ease-out',
              transition: 'all 300ms ease'
            }}>
          <h2 style={{
            margin: '0 0 18px 0',
            fontSize: isMobile ? '18px' : '20px',
            fontFamily: TYPOGRAPHY.headingFont,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            color: COLORS.textPrimary
          }}>
            Weekly Activity (Last 7 Days)
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weeklyChartSeries}>
              <CartesianGrid stroke={COLORS.textSecondary} strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" stroke={COLORS.textSecondary} />
              <YAxis stroke={COLORS.textSecondary} label={{ value: 'km', angle: -90, position: 'insideLeft', fill: COLORS.textSecondary }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.cardBackground,
                  borderColor: `${COLORS.textSecondary}40`,
                  borderRadius: '8px'
                }}
                itemStyle={{ color: COLORS.textPrimary }}
                formatter={(value) => [`${value.toFixed(1)} km`, 'Distance']}
              />
              <Area
                type="monotone"
                dataKey="distance"
                stroke={COLORS.accentGreen}
                fill={COLORS.accentGreen}
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Workout Goals */}
        <div style={{ 
          gridColumn: isMobile ? '1 / -1' : '1 / 2',
          backgroundColor: COLORS.glassmorphismLight,
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${COLORS.glasmorphismBorder}`,
          boxShadow: COLORS.glassGlow,
          animation: 'fadeIn 0.8s ease-out 0.1s both',
          transition: 'all 300ms ease'
        }}>
          <h2 style={{ 
            margin: '0 0 24px 0',
            fontSize: isMobile ? '18px' : '20px',
            fontFamily: TYPOGRAPHY.headingFont,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            color: COLORS.textPrimary
          }}>
            Workout Goals
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: isMobile ? '12px' : '20px' }}>
            {workoutGoalsData.map((goal, index) => (
              <ProgressRing 
                key={index} 
                percentage={goal.percentage} 
                label={goal.activity} 
              />
            ))}
          </div>
        </div>
        
        {/* Health Score */}
        <div style={{ 
          gridColumn: isMobile ? '1 / -1' : '2 / 3',
          backgroundColor: COLORS.glassmorphismLight,
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${COLORS.glasmorphismBorder}`,
          boxShadow: COLORS.glassGlow,
          animation: 'fadeIn 0.8s ease-out 0.2s both',
          transition: 'all 300ms ease'
        }}>
          <h2 style={{ 
            margin: '0 0 12px 0',
            fontSize: isMobile ? '18px' : '20px',
            fontFamily: TYPOGRAPHY.headingFont,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            color: COLORS.textPrimary
          }}>
            Health Score
          </h2>
          <div style={{ 
            fontSize: isMobile ? '36px' : '56px',
            fontWeight: 'bold', 
            color: COLORS.accentGreen,
            margin: '12px 0',
            fontFamily: TYPOGRAPHY.numbersFont,
            animation: 'counterUp 0.8s ease-out'
          }}>
            87
          </div>
          <div style={{
            width: '80%',
            height: '10px',
            backgroundColor: `${COLORS.accentGreen}20`,
            borderRadius: '5px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '87%',
              height: '100%',
              backgroundColor: COLORS.accentGreen,
              borderRadius: '5px'
            }} />
          </div>
          <div style={{ 
            marginTop: '10px',
            fontSize: isMobile ? '12px' : '14px',
            color: COLORS.textSecondary
          }}>
            Excellent
          </div>
        </div>
        
        {/* Calorie/Macro Analysis */}
        <div style={{ 
          gridColumn: isMobile ? '1 / -1' : '3 / 4',
          backgroundColor: COLORS.glassmorphismLight,
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '0',
          border: `1px solid ${COLORS.glasmorphismBorder}`,
          boxShadow: COLORS.glassGlow,
          animation: 'fadeIn 0.8s ease-out 0.15s both',
          transition: 'all 300ms ease'
        }}>
          <MacrosProgress />
        </div>
        
        {/* Body Composition - Spans 2 columns */}
        <div style={{
          gridColumn: isMobile ? '1 / -1' : '1 / 3',
          backgroundColor: COLORS.glassmorphismLight,
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          border: `1px solid ${COLORS.glasmorphismBorder}`,
          boxShadow: COLORS.glassGlow,
          animation: 'fadeIn 0.8s ease-out 0.3s both',
          transition: 'all 300ms ease'
        }}>
          <h2 style={{
            margin: '0 0 18px 0',
            fontSize: isMobile ? '18px' : '20px',
            fontFamily: TYPOGRAPHY.headingFont,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            color: COLORS.textPrimary
          }}>
            Body Composition
          </h2>
          {sectionLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
              <SkeletonLoader height="140px" />
              <SkeletonLoader height="140px" />
              <SkeletonLoader height="140px" />
              <SkeletonLoader height="140px" />
            </div>
          ) : inBodyData.weight ? (
            <BodyCompositionCards data={inBodyData} />
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: COLORS.textSecondary,
              fontSize: '14px'
            }}>
              Sin datos registrados - Sube tu primer reporte InBody
            </div>
          )}
        </div>
        
        {/* Route Map */}
        {gpxData ? (
          <div style={{ 
            gridColumn: isMobile ? '1 / -1' : '3 / 4',
            backgroundColor: COLORS.cardBackground,
            borderRadius: '12px',
            height: isMobile ? '220px' : '300px',
            border: `1px solid ${COLORS.textSecondary}40`,
            overflow: 'hidden'
          }}>
            <MapContainer
              center={gpxData.route[Math.floor(gpxData.route.length / 2)]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; CartoDB'
              />
              <Polyline positions={gpxData.route} color={COLORS.accentGreen} weight={3} opacity={0.9} />
            </MapContainer>
          </div>
        ) : (
          <div style={{
            gridColumn: isMobile ? '1 / -1' : '3 / 4',
            backgroundColor: COLORS.cardBackground,
            borderRadius: '12px',
            border: `1px solid ${COLORS.textSecondary}40`,
            minHeight: isMobile ? '220px' : '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.textSecondary,
            fontSize: '14px'
          }}>
            Upload a GPX route to view map
          </div>
        )}
        
        {/* Upload Zones */}
        <div style={{
          gridColumn: '1 / -1',
          backgroundColor: COLORS.cardBackground,
          borderRadius: '12px',
          padding: isMobile ? '16px' : '20px',
          border: `1px solid ${COLORS.textSecondary}40`
        }}>
          <h2 style={{
            margin: '0 0 15px 0',
            fontSize: isMobile ? '16px' : '18px',
            fontFamily: TYPOGRAPHY.headingFont
          }}>
            Data Upload
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? '14px' : '20px'
          }}>
            <UploadZone
              label="Upload GPX Route"
              accept=".gpx"
              onChange={handleGpxUpload}
              IconComponent={MapPin}
            />
            <UploadZone
              label="Upload InBody Report"
              accept=".pdf"
              onChange={handleInBodyUpload}
              IconComponent={FileText}
            />
          </div>
          {(gpxFileName || supabaseSaveMessage) && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: supabaseSaveMessage?.includes('Error') || supabaseSaveMessage?.includes('❌')
                ? '#ff444420'
                : supabaseSaveMessage?.includes('⚠️')
                ? '#fbbf2420'
                : `${COLORS.accentGreen}20`,
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              {gpxFileName && !supabaseSaveMessage && <p>✓ {gpxFileName} uploaded successfully</p>}
              {supabaseSaveMessage && <p style={{ margin: 0, fontFamily: TYPOGRAPHY.bodyFont, fontWeight: 500 }}>{supabaseSaveMessage}</p>}
            </div>
          )}
        </div>
      </div>
        )}

        {activeSection === 'activity' && (
          sectionLoading ? (
            <div style={{ display: 'grid', gap: '20px' }}>
              <SkeletonLoader height="300px" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                <SkeletonLoader height="160px" />
                <SkeletonLoader height="160px" />
                <SkeletonLoader height="160px" />
              </div>
            </div>
          ) : (
            <ActivitySection
              gpxData={gpxData}
              gpxFileName={gpxFileName}
              stravaActivities={activities}
              onActivityClick={handleActivityClick}
              getActivityIcon={getActivityIcon}
              savedGpxFiles={savedGpxFiles}
              onDeleteGpxFile={async (id, filePath) => {
                await deleteGpxFile(id, filePath)
                const files = await getGpxFiles()
                setSavedGpxFiles(files || [])
              }}
              onLoadGpxFile={(file) => {
                setGpxData({
                  route: file.route_data,
                  distance: file.distance,
                  name: file.filename
                })
              }}
            />
          )
        )}
        {activeSection === 'bodystats' && (
          sectionLoading ? (
            <div style={{ display: 'grid', gap: '20px' }}>
              <SkeletonLoader height="300px" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                <SkeletonLoader height="140px" />
                <SkeletonLoader height="140px" />
                <SkeletonLoader height="140px" />
                <SkeletonLoader height="140px" />
              </div>
            </div>
          ) : (
            <BodyStatsSection
              inBodyData={inBodyData}
              historicalData={historicalData}
              savedInBodyRecords={savedInBodyRecords}
              onDeleteRecord={async (id) => {
              await deleteInBodyRecord(id)
              const records = await getInBodyHistory()
              setSavedInBodyRecords(records || [])
              // Update historical data after deletion
              if (records && records.length > 0) {
                const chartData = records.slice(0, 7).reverse().map((record, index) => {
                  const date = new Date(record.measurement_date)
                  return {
                    date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    weight: record.weight,
                    muscle: record.muscle_mass,
                    fat: record.body_fat
                  }
                })
                setHistoricalData(chartData)
              } else {
                setHistoricalData([])
              }
            }}
            onLoadRecord={(record) => {
              setInBodyData({
                weight: record.weight,
                muscle: record.muscle_mass,
                fat: record.body_fat,
                bmi: record.bmi
              })
            }}
            />
          )
        )}
        {activeSection === 'history' && (
          sectionLoading ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              <SkeletonLoader height="120px" />
              <SkeletonLoader height="120px" />
              <SkeletonLoader height="120px" />
            </div>
          ) : (
            <HistorySection savedInBodyRecords={savedInBodyRecords} />
          )
        )}
        {activeSection === 'settings' && (
          <SettingsSection
            isStravaConnected={isConnected}
            athlete={athlete}
            onStravaConnect={handleStravaConnect}
            onStravaDisconnect={handleStravaDisconnect}
          />
        )}
      </main>
    </div>
  )
}

// Activity Section Component with Pagination
const ActivitySection = ({ gpxData, stravaActivities, onActivityClick, getActivityIcon, savedGpxFiles, onDeleteGpxFile, onLoadGpxFile }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('Todos')
  const activitiesPerPage = 12

  // Filter activities
  const filteredActivities = stravaActivities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'Todos' ||
      (filterType === 'Running' && activity.type === 'Run') ||
      (filterType === 'Ride' && activity.type === 'Ride') ||
      (filterType === 'Workout' && (activity.type === 'Workout' || activity.type === 'WeightTraining'))
    return matchesSearch && matchesFilter
  })

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / activitiesPerPage)
  const startIndex = (currentPage - 1) * activitiesPerPage
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + activitiesPerPage)

  return (
    <div>
      {/* Map */}
      {gpxData ? (
        <div style={{
          backgroundColor: COLORS.cardBackground,
          borderRadius: '12px',
          height: '400px',
          border: `1px solid ${COLORS.textSecondary}40`,
          overflow: 'hidden',
          marginBottom: '20px'
        }}>
          <MapContainer
            center={gpxData.route[Math.floor(gpxData.route.length / 2)]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CartoDB'
            />
            <Polyline positions={gpxData.route} color={COLORS.accentGreen} weight={3} opacity={0.9} />
          </MapContainer>
        </div>
      ) : (
        <div style={{
          backgroundColor: COLORS.cardBackground,
          borderRadius: '12px',
          padding: '20px',
          height: '150px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${COLORS.textSecondary}40`,
          marginBottom: '20px'
        }}>
          <span style={{ color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.headingFont }}>
            Click on an activity below to see the route
          </span>
        </div>
      )}

      {/* Strava Activities */}
      {stravaActivities && stravaActivities.length > 0 && (
        <div style={{
          backgroundColor: COLORS.cardBackground,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${COLORS.textSecondary}40`
        }}>
          {/* Header with count and filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontFamily: TYPOGRAPHY.headingFont,
              color: COLORS.textPrimary
            }}>
              {filteredActivities.length} actividades totales
            </h3>

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Todos', 'Running', 'Ride', 'Workout'].map(type => (
                <button
                  key={type}
                  onClick={() => { setFilterType(type); setCurrentPage(1); }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${filterType === type ? COLORS.accentGreen : COLORS.textSecondary}40`,
                    backgroundColor: filterType === type ? `${COLORS.accentGreen}20` : 'transparent',
                    color: filterType === type ? COLORS.accentGreen : COLORS.textSecondary,
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: TYPOGRAPHY.bodyFont,
                    transition: 'all 200ms'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <input
            type="text"
            placeholder="Buscar actividad..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '15px',
              borderRadius: '8px',
              border: `1px solid ${COLORS.textSecondary}40`,
              backgroundColor: COLORS.background,
              color: COLORS.textPrimary,
              fontSize: '14px',
              fontFamily: TYPOGRAPHY.bodyFont,
              outline: 'none'
            }}
          />

          {/* Activities grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '15px'
          }}>
            {paginatedActivities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => onActivityClick(activity)}
              style={{
                backgroundColor: COLORS.background,
                borderRadius: '8px',
                padding: '15px',
                cursor: 'pointer',
                border: `1px solid ${COLORS.textSecondary}40`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.accentGreen
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${COLORS.textSecondary}40`
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '24px', marginRight: '10px' }}>
                  {getActivityIcon(activity.type)}
                </span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: COLORS.textPrimary,
                  fontFamily: TYPOGRAPHY.headingFont,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {activity.name}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: COLORS.textSecondary
              }}>
                <span>{(activity.distance / 1000).toFixed(2)} km</span>
                <span>{Math.floor(activity.moving_time / 60)} min</span>
              </div>
              <div style={{
                marginTop: '8px',
                fontSize: '11px',
                color: COLORS.textSecondary
              }}>
                {new Date(activity.start_date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            marginTop: '20px'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: `1px solid ${COLORS.textSecondary}40`,
                backgroundColor: currentPage === 1 ? 'transparent' : COLORS.background,
                color: currentPage === 1 ? COLORS.textSecondary : COLORS.textPrimary,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontFamily: TYPOGRAPHY.bodyFont,
                opacity: currentPage === 1 ? 0.5 : 1
              }}
            >
              ← Anterior
            </button>

            <span style={{
              fontSize: '14px',
              color: COLORS.textPrimary,
              fontFamily: TYPOGRAPHY.bodyFont
            }}>
              Página {currentPage} de {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: `1px solid ${COLORS.textSecondary}40`,
                backgroundColor: currentPage === totalPages ? 'transparent' : COLORS.background,
                color: currentPage === totalPages ? COLORS.textSecondary : COLORS.textPrimary,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontFamily: TYPOGRAPHY.bodyFont,
                opacity: currentPage === totalPages ? 0.5 : 1
              }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    )}

    {/* Loading message when no activities */}
    {(!stravaActivities || stravaActivities.length === 0) && (
      <div style={{
        backgroundColor: COLORS.cardBackground,
        borderRadius: '12px',
        padding: '40px',
        border: `1px solid ${COLORS.textSecondary}40`,
        textAlign: 'center'
      }}>
        <span style={{
          color: COLORS.textSecondary,
          fontFamily: TYPOGRAPHY.bodyFont,
          fontSize: '14px'
        }}>
          Cargando actividades... (puede tomar un momento por límite de API)
        </span>
      </div>
    )}
  </div>
  )
}

  // Body Stats Section Component
  const BodyStatsSection = ({ inBodyData, historicalData, savedInBodyRecords, onDeleteRecord, onLoadRecord }) => (
    <div>
      <div style={{
        gridColumn: '1 / 3',
        backgroundColor: COLORS.cardBackground,
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${COLORS.textSecondary}40`,
        marginBottom: '20px'
      }}>
        {inBodyData.weight ? (
          <BodyCompositionCards data={inBodyData} />
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: COLORS.textSecondary,
            fontSize: '14px'
          }}>
            Sin datos registrados - Sube tu primer reporte InBody
          </div>
        )}
      </div>
      <div className="h-[300px] md:h-[400px]" style={{
        backgroundColor: COLORS.cardBackground,
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${COLORS.textSecondary}40`
      }}>
        <h3 style={{
          margin: '0 0 15px 0',
          fontSize: '18px',
          fontFamily: TYPOGRAPHY.headingFont,
          fontWeight: 700,
          color: COLORS.textPrimary
        }}>
          Progress Over Time
        </h3>
        {historicalData.length > 0 ? (
          <div className="h-[200px] w-full md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalData}>
            <CartesianGrid stroke={COLORS.textSecondary} strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" stroke={COLORS.textSecondary} style={{ fontSize: '12px' }} />
            <YAxis stroke={COLORS.textSecondary} style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: COLORS.cardBackground,
                borderColor: `${COLORS.textSecondary}40`,
                borderRadius: '8px',
                fontSize: '12px'
              }}
              itemStyle={{ color: COLORS.textPrimary }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area
              type="monotone"
              dataKey="weight"
              stroke={COLORS.accentGreen}
              fill={COLORS.accentGreen}
              fillOpacity={0.2}
              name="Weight (kg)"
            />
            <Area
              type="monotone"
              dataKey="muscle"
              stroke={COLORS.accentOrange}
              fill={COLORS.accentOrange}
              fillOpacity={0.2}
              name="Muscle (kg)"
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
        ) : (
          <div style={{
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.textSecondary,
            fontSize: '14px'
          }}>
            Sin datos suficientes para mostrar gráfica
          </div>
        )}
      </div>
    </div>
  )

  // History Section Component
  const HistorySection = ({ savedInBodyRecords }) => {
    const chartData = savedInBodyRecords.length > 0
      ? savedInBodyRecords.slice(0, 30).reverse().map(record => ({
          date: new Date(record.measurement_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
          weight: record.weight,
          muscle: record.muscle_mass,
          fat: record.body_fat
        }))
      : []

    return (
      <div>
        {/* Historical Chart */}
        <div style={{
          backgroundColor: COLORS.cardBackground,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${COLORS.textSecondary}40`,
          marginBottom: '20px'
        }}>
          <h2 style={{
            margin: '0 0 15px 0',
            fontSize: '20px',
            fontFamily: TYPOGRAPHY.headingFont,
            fontWeight: 700,
            color: COLORS.textPrimary
          }}>
            Body Composition History
          </h2>
          {chartData.length > 0 ? (
            <div className="h-[200px] w-full md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
              <CartesianGrid stroke={COLORS.textSecondary} strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="date"
                stroke={COLORS.textSecondary}
                style={{ fontSize: '12px', fontFamily: TYPOGRAPHY.bodyFont }}
              />
              <YAxis
                stroke={COLORS.textSecondary}
                style={{ fontSize: '12px', fontFamily: TYPOGRAPHY.numbersFont }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.cardBackground,
                  borderColor: `${COLORS.textSecondary}40`,
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                itemStyle={{ color: COLORS.textPrimary }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', fontFamily: TYPOGRAPHY.bodyFont }} />
              <Area
                type="monotone"
                dataKey="weight"
                stroke={COLORS.accentGreen}
                fill={COLORS.accentGreen}
                fillOpacity={0.3}
                name="Weight (kg)"
              />
              <Area
                type="monotone"
                dataKey="muscle"
                stroke={COLORS.accentOrange}
                fill={COLORS.accentOrange}
                fillOpacity={0.3}
                name="Muscle (kg)"
              />
              <Area
                type="monotone"
                dataKey="fat"
                stroke="#FFD166"
                fill="#FFD166"
                fillOpacity={0.3}
                name="Fat (kg)"
              />
            </AreaChart>
          </ResponsiveContainer>
          </div>
          ) : (
            <div style={{
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.textSecondary,
              fontSize: '14px'
            }}>
              Sin datos registrados - Sube tu primer reporte InBody
            </div>
          )}
        </div>

        {/* Historical Data Table */}
        <div style={{
          backgroundColor: COLORS.cardBackground,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${COLORS.textSecondary}40`
        }}>
          <h3 style={{
            margin: '0 0 15px 0',
            fontSize: '18px',
            fontFamily: TYPOGRAPHY.headingFont,
            fontWeight: 700,
            color: COLORS.textPrimary
          }}>
            InBody Measurement Records
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{
                  borderBottom: `2px solid ${COLORS.textSecondary}40`,
                  textAlign: 'left'
                }}>
                  <th style={{
                    padding: '10px',
                    fontFamily: TYPOGRAPHY.headingFont,
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>Date</th>
                  <th style={{
                    padding: '10px',
                    fontFamily: TYPOGRAPHY.headingFont,
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}>Weight</th>
                  <th style={{
                    padding: '10px',
                    fontFamily: TYPOGRAPHY.headingFont,
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}>Muscle</th>
                  <th style={{
                    padding: '10px',
                    fontFamily: TYPOGRAPHY.headingFont,
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}>Fat</th>
                </tr>
              </thead>
              <tbody>
                {savedInBodyRecords.length > 0 ? (
                  savedInBodyRecords.map((record, index) => (
                  <tr key={record.id || index} style={{
                    borderBottom: `1px solid ${COLORS.textSecondary}20`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${COLORS.textSecondary}10`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}>
                    <td style={{
                      padding: '12px 10px',
                      fontFamily: TYPOGRAPHY.bodyFont,
                      color: COLORS.textPrimary
                    }}>{new Date(record.measurement_date).toLocaleDateString('es-ES')}</td>
                    <td style={{
                      padding: '12px 10px',
                      fontFamily: TYPOGRAPHY.numbersFont,
                      fontWeight: 600,
                      color: COLORS.accentGreen
                    }}>{record.weight ? record.weight.toFixed(1) : '-'} kg</td>
                    <td style={{
                      padding: '12px 10px',
                      fontFamily: TYPOGRAPHY.numbersFont,
                      fontWeight: 600,
                      color: COLORS.accentOrange
                    }}>{record.muscle_mass ? record.muscle_mass.toFixed(1) : '-'} kg</td>
                    <td style={{
                      padding: '12px 10px',
                      fontFamily: TYPOGRAPHY.numbersFont,
                      fontWeight: 600,
                      color: '#FFD166'
                    }}>{record.body_fat ? record.body_fat.toFixed(1) : '-'} kg</td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: COLORS.textSecondary,
                      fontSize: '14px'
                    }}>
                      Sin registros históricos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

// Settings Section Component
const SettingsSection = ({ isStravaConnected, athlete, onStravaConnect, onStravaDisconnect }) => (
  <div>
    <h2 style={{
      margin: '0 0 20px 0',
      fontSize: '24px',
      fontFamily: TYPOGRAPHY.headingFont,
      color: COLORS.textPrimary
    }}>
      Settings
    </h2>

    {/* Strava Connection Card */}
    <div style={{
      backgroundColor: COLORS.cardBackground,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${COLORS.textSecondary}40`,
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap size={24} color={COLORS.accentOrange} />
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontFamily: TYPOGRAPHY.headingFont,
            fontWeight: 700,
            color: COLORS.textPrimary
          }}>
            Strava Connection
          </h3>
        </div>
        <div style={{
          padding: '4px 12px',
          borderRadius: '12px',
          backgroundColor: isStravaConnected ? `${COLORS.accentGreen}20` : `${COLORS.textSecondary}20`,
          color: isStravaConnected ? COLORS.accentGreen : COLORS.textSecondary,
          fontSize: '12px',
          fontFamily: TYPOGRAPHY.headingFont,
          fontWeight: 'bold'
        }}>
          {isStravaConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {isStravaConnected && athlete ? (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            marginBottom: '15px'
          }}>
            {athlete.profile && (
              <img
                src={athlete.profile}
                alt={`${athlete.firstname} ${athlete.lastname}`}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: `2px solid ${COLORS.accentGreen}`
                }}
              />
            )}
            <div>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: COLORS.textPrimary,
                fontFamily: TYPOGRAPHY.headingFont
              }}>
                {athlete.firstname} {athlete.lastname}
              </div>
              {athlete.city && athlete.country && (
                <div style={{
                  fontSize: '12px',
                  color: COLORS.textSecondary,
                  marginTop: '4px'
                }}>
                  {athlete.city}, {athlete.country}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onStravaDisconnect}
            style={{
              backgroundColor: '#ff4444',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontFamily: TYPOGRAPHY.headingFont,
              color: COLORS.textPrimary,
              cursor: 'pointer',
                    width: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ff6666'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ff4444'
            }}
          >
            Desconectar Strava
          </button>
        </div>
      ) : (
        <div>
          <p style={{
            color: COLORS.textSecondary,
            fontSize: '14px',
            marginBottom: '15px',
            lineHeight: '1.5'
          }}>
            Connect your Strava account to automatically sync your activities and view them on the dashboard.
          </p>
          <button
            onClick={onStravaConnect}
            style={{
              backgroundColor: COLORS.accentOrange,
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontFamily: TYPOGRAPHY.headingFont,
              color: COLORS.textPrimary,
              cursor: 'pointer',
                    width: '100%',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ff8855'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.accentOrange
            }}
          >
            Conectar Strava
          </button>
        </div>
      )}
    </div>

    {/* Other Settings Placeholder */}
    <div style={{
      backgroundColor: COLORS.cardBackground,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${COLORS.textSecondary}40`
    }}>
      <h3 style={{
        margin: '0 0 10px 0',
        fontSize: '16px',
        fontFamily: TYPOGRAPHY.headingFont,
        color: COLORS.textPrimary
      }}>
        App Settings
      </h3>
      <p style={{ color: COLORS.textSecondary, fontSize: '14px', margin: 0 }}>
        Additional settings coming soon...
      </p>
    </div>
  </div>
)

export default App