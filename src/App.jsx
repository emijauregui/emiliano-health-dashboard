import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Polyline } from 'react-leaflet'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import polyline from '@mapbox/polyline'
import 'leaflet/dist/leaflet.css'
import { useStrava } from './hooks/useStrava'

// Constants for styling
const COLORS = {
  background: '#0f0f0f',
  cardBackground: '#1a1a1a',
  accentGreen: '#00F5A0',
  accentOrange: '#FF6B35',
  textSecondary: '#888',
  textPrimary: '#ffffff'
}

const TYPOGRAPHY = {
  headingFont: "'Space Grotesk', sans-serif",
  bodyFont: 'sans-serif'
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
const Sidebar = ({ activeSection, setActiveSection, isStravaConnected, onStravaConnect }) => {
  const navItems = [
    { name: 'Dashboard', icon: '📊', section: 'dashboard' },
    { name: 'Activity', icon: '🏃', section: 'activity' },
    { name: 'Body Stats', icon: '⚖️', section: 'bodystats' },
    { name: 'History', icon: '📅', section: 'history' },
    { name: 'Settings', icon: '⚙️', section: 'settings' }
  ]

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      height: '100vh',
      width: '80px',
      backgroundColor: COLORS.cardBackground,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 0',
      borderRight: `1px solid ${COLORS.textSecondary}40`,
      zIndex: 100
    }}>
      {/* Logo */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: `linear-gradient(135deg, ${COLORS.accentGreen}, ${COLORS.accentOrange})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '30px',
        fontSize: '20px'
      }}>
        ⚡
      </div>

      {/* Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        {navItems.map((item, index) => (
          <div key={index}
            onClick={() => setActiveSection(item.section)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: activeSection === item.section ? COLORS.accentGreen : COLORS.textSecondary,
              transition: 'all 0.2s ease'
            }}>
            <span style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</span>
            <span style={{ fontSize: '10px', fontFamily: TYPOGRAPHY.headingFont }}>{item.name}</span>
          </div>
        ))}
      </nav>

      {/* Strava Connection Button */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: isStravaConnected ? 'default' : 'pointer',
        transition: 'all 0.2s ease'
      }}
        onClick={!isStravaConnected ? onStravaConnect : undefined}
      >
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '10px',
          backgroundColor: isStravaConnected ? COLORS.accentGreen : COLORS.accentOrange,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          marginBottom: '5px'
        }}>
          {isStravaConnected ? '✓' : '🚴'}
        </div>
        <span style={{
          fontSize: '9px',
          fontFamily: TYPOGRAPHY.headingFont,
          color: isStravaConnected ? COLORS.accentGreen : COLORS.accentOrange,
          textAlign: 'center'
        }}>
          {isStravaConnected ? 'Strava ✓' : 'Connect'}
        </span>
      </div>

      {/* User Indicator */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          backgroundColor: COLORS.accentGreen,
          marginBottom: '8px'
        }} />
        <span style={{ fontSize: '10px', fontFamily: TYPOGRAPHY.headingFont, color: COLORS.textSecondary }}>Emiliano</span>
      </div>
    </div>
  )
}

// Progress Ring Component for Workout Goals
const ProgressRing = ({ percentage, label }) => {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: '100px', height: '100px' }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
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
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '18px',
          fontWeight: 'bold',
          color: COLORS.textPrimary
        }}>
          {percentage}%
        </div>
      </div>
      <span style={{ marginTop: '10px', fontSize: '12px', color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.headingFont }}>
        {label}
      </span>
    </div>
  )
}

// Stat Card Component
const StatCard = ({ title, value, unit, color = COLORS.accentGreen }) => (
  <div style={{
    backgroundColor: COLORS.cardBackground,
    borderRadius: '12px',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100px',
    border: `1px solid ${COLORS.textSecondary}40`
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
        color,
        fontFamily: TYPOGRAPHY.headingFont
      }}>
        {value}
      </span>
      {unit && <span style={{ fontSize: '12px', color: COLORS.textSecondary }}>{unit}</span>}
    </div>
  </div>
)

// Body Composition Cards
const BodyCompositionCards = ({ data }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
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
const UploadZone = ({ label, accept, onChange, icon }) => {
  const [isDragging, setIsDragging] = useState(false)

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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        backgroundColor: COLORS.cardBackground,
        borderRadius: '12px',
        height: '150px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: `2px dashed ${isDragging ? COLORS.accentGreen : COLORS.textSecondary}40`,
        transition: 'all 0.2s ease',
        textAlign: 'center',
        padding: '15px'
      }}
    >
      <span style={{ fontSize: '32px', marginBottom: '10px' }}>{icon}</span>
      <span style={{ 
        fontSize: '14px', 
        color: COLORS.textSecondary,
        fontFamily: TYPOGRAPHY.headingFont
      }}>
        {label}
      </span>
      <input 
        type="file" 
        accept={accept} 
        onChange={onChange} 
        style={{ display: 'none' }} 
      />
    </div>
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
      backgroundColor: COLORS.cardBackground,
      borderRadius: '12px',
      padding: '20px',
      height: '100%'
    }}>
      <h3 style={{ 
        margin: '0 0 15px 0',
        fontSize: '16px',
        color: COLORS.textPrimary,
        fontFamily: TYPOGRAPHY.headingFont
      }}>
        Daily Macros
      </h3>
      {macrosData.map((macro, index) => (
        <div key={index} style={{ marginBottom: '15px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '5px'
          }}>
            <span style={{ 
              fontSize: '14px', 
              color: COLORS.textPrimary,
              fontFamily: TYPOGRAPHY.headingFont
            }}>
              {macro.name}
            </span>
            <span style={{ 
              fontSize: '12px', 
              color: COLORS.textSecondary
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

function App() {
  const [gpxData, setGpxData] = useState(null)
  const [gpxFileName, setGpxFileName] = useState(null)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [inBodyData, setInBodyData] = useState({
    weight: 75.2,
    muscle: 32.1,
    fat: 18.4,
    bmi: 22.8
  })

  const { isConnected, activities, loading, getActivities, stravaAuthUrl } = useStrava()

  useEffect(() => {
    if (isConnected) {
      getActivities(5).catch(console.error)
    }
  }, [isConnected])

  const historicalData = [
    { date: 'Mon', weight: 74.8, muscle: 31.9, fat: 18.6 },
    { date: 'Tue', weight: 75.0, muscle: 32.0, fat: 18.5 },
    { date: 'Wed', weight: 75.1, muscle: 32.0, fat: 18.5 },
    { date: 'Thu', weight: 75.3, muscle: 32.1, fat: 18.4 },
    { date: 'Fri', weight: 75.2, muscle: 32.1, fat: 18.4 },
    { date: 'Sat', weight: 75.1, muscle: 32.0, fat: 18.5 },
    { date: 'Sun', weight: 75.2, muscle: 32.1, fat: 18.4 }
  ]

  const workoutGoalsData = [
    { activity: 'Running', percentage: 85 },
    { activity: 'Strength', percentage: 70 },
    { activity: 'Yoga', percentage: 60 }
  ]

  const weeklyData = [
    { day: 'Lun', calories: 420, steps: 8200, distance: 5.2 },
    { day: 'Mar', calories: 380, steps: 7100, distance: 4.8 },
    { day: 'Mie', calories: 650, steps: 12400, distance: 8.1 },
    { day: 'Jue', calories: 290, steps: 5800, distance: 3.9 },
    { day: 'Vie', calories: 710, steps: 13200, distance: 9.3 },
    { day: 'Sab', calories: 540, steps: 9800, distance: 6.7 },
    { day: 'Dom', calories: 180, steps: 3200, distance: 2.1 }
  ]

  const handleGpxUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setGpxFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
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

      setGpxData({
        route,
        distance: distance.toFixed(2)
      })
    }
    reader.readAsText(file)
  }

  const handleInBodyUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    // Simulate processing
    setInBodyData({ weight: 75.5, muscle: 32.3, fat: 18.2, bmi: 22.6 })
  }

  const handleStravaConnect = () => {
    window.location.href = stravaAuthUrl()
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
    const icons = {
      'Run': '🏃',
      'Ride': '🚴',
      'Swim': '🏊',
      'Walk': '🚶',
      'Hike': '🥾',
      'WeightTraining': '🏋️',
      'Workout': '💪'
    }
    return icons[type] || '🏃'
  }

  return (
    <div style={{
      backgroundColor: COLORS.background,
      color: COLORS.textPrimary,
      minHeight: '100vh',
      fontFamily: TYPOGRAPHY.bodyFont,
      display: 'flex'
    }}>
      {/* Import Space Grotesk font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          overflow-x: hidden;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${COLORS.background};
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${COLORS.textSecondary};
          border-radius: 4px;
        }
        
        .leaflet-container {
          background: ${COLORS.cardBackground} !important;
        }
      `}</style>
      
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isStravaConnected={isConnected}
        onStravaConnect={handleStravaConnect}
      />
      
      {/* Main Content */}
      <main style={{
        marginLeft: '80px',
        padding: '20px',
        width: 'calc(100% - 80px)'
      }}>
        {activeSection === 'dashboard' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridAutoRows: 'minmax(150px, auto)',
            gap: '20px'
          }}>
            {/* Activity Chart - Spans 3 columns */}
            <div style={{ 
              gridColumn: '1 / -1',
          backgroundColor: COLORS.cardBackground,
          borderRadius: '12px',
          padding: '20px',
          width: '100%',
          height: '300px',
          border: `1px solid ${COLORS.textSecondary}40`
        }}>
          <h2 style={{ 
            margin: '0 0 15px 0',
            fontSize: '18px',
            fontFamily: TYPOGRAPHY.headingFont
          }}>
            Weekly Activity
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyData}>
              <CartesianGrid stroke={COLORS.textSecondary} strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" stroke={COLORS.textSecondary} />
              <YAxis stroke={COLORS.textSecondary} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: COLORS.cardBackground, 
                  borderColor: `${COLORS.textSecondary}40`,
                  borderRadius: '8px'
                }}
                itemStyle={{ color: COLORS.textPrimary }}
              />
              <Area 
                type="monotone" 
                dataKey="calories" 
                stroke={COLORS.accentGreen} 
                fill={COLORS.accentGreen} 
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Workout Goals */}
        <div style={{ 
          backgroundColor: COLORS.cardBackground,
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${COLORS.textSecondary}40`
        }}>
          <h2 style={{ 
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontFamily: TYPOGRAPHY.headingFont
          }}>
            Workout Goals
          </h2>
          <div style={{ display: 'flex', gap: '20px' }}>
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
          backgroundColor: COLORS.cardBackground,
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${COLORS.textSecondary}40`
        }}>
          <h2 style={{ 
            margin: '0 0 10px 0',
            fontSize: '18px',
            fontFamily: TYPOGRAPHY.headingFont
          }}>
            Health Score
          </h2>
          <div style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: COLORS.accentGreen,
            margin: '10px 0'
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
            fontSize: '12px',
            color: COLORS.textSecondary
          }}>
            Excellent
          </div>
        </div>
        
        {/* Calorie/Macro Analysis */}
        <div style={{ 
          gridColumn: '3 / 4',
          gridRow: 'span 2',
          backgroundColor: COLORS.cardBackground,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${COLORS.textSecondary}40`
        }}>
          <MacrosProgress />
        </div>
        
        {/* Body Composition - Spans 2 columns */}
        <div style={{ 
          gridColumn: '1 / 3',
          backgroundColor: COLORS.cardBackground,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${COLORS.textSecondary}40`
        }}>
          <h2 style={{ 
            margin: '0 0 15px 0',
            fontSize: '18px',
            fontFamily: TYPOGRAPHY.headingFont
          }}>
            Body Composition
          </h2>
          <BodyCompositionCards data={inBodyData} />
        </div>
        
        {/* Route Map */}
        {gpxData && (
          <div style={{ 
            gridColumn: '1 / 3',
            backgroundColor: COLORS.cardBackground,
            borderRadius: '12px',
            height: '300px',
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
        )}
        
        {/* Upload Zones */}
        <div style={{
          gridColumn: '1 / -1',
          backgroundColor: COLORS.cardBackground,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${COLORS.textSecondary}40`
        }}>
          <h2 style={{
            margin: '0 0 15px 0',
            fontSize: '18px',
            fontFamily: TYPOGRAPHY.headingFont
          }}>
            Data Upload
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px'
          }}>
            <UploadZone
              label="Upload GPX Route"
              accept=".gpx"
              onChange={handleGpxUpload}
              icon="🗺️"
            />
            <UploadZone
              label="Upload InBody Report"
              accept=".pdf"
              onChange={handleInBodyUpload}
              icon="📄"
            />
          </div>
          {(gpxFileName || inBodyData) && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: `${COLORS.accentGreen}20`,
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              {gpxFileName && <p>✓ {gpxFileName} uploaded successfully</p>}
              {inBodyData && <p>✓ InBody data updated</p>}
            </div>
          )}
        </div>
      </div>
        )}

        {activeSection === 'activity' && (
          <ActivitySection
            gpxData={gpxData}
            gpxFileName={gpxFileName}
            stravaActivities={activities}
            onActivityClick={handleActivityClick}
            getActivityIcon={getActivityIcon}
          />
        )}
        {activeSection === 'bodystats' && <BodyStatsSection inBodyData={inBodyData} />}
        {activeSection === 'history' && <HistorySection />}
        {activeSection === 'settings' && <SettingsSection />}
      </main>
    </div>
  )
}

// Activity Section Component
const ActivitySection = ({ gpxData, stravaActivities, onActivityClick, getActivityIcon }) => (
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
        <h3 style={{
          margin: '0 0 15px 0',
          fontSize: '18px',
          fontFamily: TYPOGRAPHY.headingFont,
          color: COLORS.textPrimary
        }}>
          Recent Activities
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '15px'
        }}>
          {stravaActivities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => onActivityClick(activity)}
              style={{
                backgroundColor: COLORS.background,
                borderRadius: '8px',
                padding: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
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
      </div>
    )}
  </div>
)

// Body Stats Section Component
const BodyStatsSection = ({ inBodyData }) => (
  <div>
    <div style={{ 
      gridColumn: '1 / 3',
      backgroundColor: COLORS.cardBackground,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${COLORS.textSecondary}40`,
      marginBottom: '20px'
    }}>
      <BodyCompositionCards data={inBodyData} />
    </div>
    <div style={{ 
      backgroundColor: COLORS.cardBackground,
      borderRadius: '12px',
      padding: '20px',
      height: '300px',
      border: `1px solid ${COLORS.textSecondary}40`
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontFamily: TYPOGRAPHY.headingFont }}>
        Progress Chart (TODO)
      </h3>
    </div>
  </div>
)

// History Section Component
const HistorySection = () => (
  <div style={{
    backgroundColor: COLORS.cardBackground,
    borderRadius: '12px',
    padding: '20px',
    height: '150px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${COLORS.textSecondary}40`
  }}>
    <span style={{ color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.headingFont }}>Historial próximamente</span>
  </div>
)

// Settings Section Component
const SettingsSection = () => (
  <div style={{
    backgroundColor: COLORS.cardBackground,
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${COLORS.textSecondary}40`
  }}>
    <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontFamily: TYPOGRAPHY.headingFont }}>Settings</h3>
    <div style={{ color: COLORS.textSecondary }}>
      <p>Strava connection status: Not connected</p>
      <p>Client ID: 233519</p>
    </div>
  </div>
)

export default App