import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStrava } from '../hooks/useStrava'

const COLORS = {
  background: '#0f0f0f',
  cardBackground: '#1a1a1a',
  accentGreen: '#00F5A0',
  textPrimary: '#ffffff',
  textSecondary: '#888'
}

const TYPOGRAPHY = {
  headingFont: "'Space Grotesk', sans-serif"
}

export default function Callback() {
  const navigate = useNavigate()
  const { exchangeToken } = useStrava()
  const [status, setStatus] = useState('Processing...')
  const [error, setError] = useState(null)
  const hasExchanged = useRef(false)

  useEffect(() => {
    // Prevent multiple calls (especially in React StrictMode)
    if (hasExchanged.current) {
      console.log('Token exchange already attempted, skipping...')
      return
    }
    hasExchanged.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const errorParam = params.get('error')
    const scope = params.get('scope')

    console.log('Callback URL params:', { code, errorParam, scope })

    if (errorParam) {
      setError('Authorization denied')
      setTimeout(() => navigate('/'), 3000)
      return
    }

    if (!code) {
      console.error('No code in URL. Current URL:', window.location.href)
      setError('No authorization code received')
      setTimeout(() => navigate('/'), 3000)
      return
    }

    const handleCallback = async (authCode) => {
      try {
        console.log('Exchanging code (ONCE):', authCode)
        setStatus('Exchanging authorization code...')
        await exchangeToken(authCode)
        setStatus('Connected successfully! Redirecting...')
        setTimeout(() => navigate('/'), 1500)
      } catch (err) {
        console.error('Token exchange error:', err)
        setError(err.message || 'Failed to connect to Strava')
        setTimeout(() => navigate('/'), 3000)
      }
    }

    handleCallback(code)
  }, [])

  return (
    <div style={{
      backgroundColor: COLORS.background,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: TYPOGRAPHY.headingFont,
      color: COLORS.textPrimary
    }}>
      <div style={{
        backgroundColor: COLORS.cardBackground,
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        {error ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', color: COLORS.textPrimary }}>
              Connection Failed
            </h2>
            <p style={{ color: COLORS.textSecondary, margin: '0' }}>{error}</p>
          </>
        ) : (
          <>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
              animation: 'spin 1s linear infinite'
            }}>
              🔄
            </div>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', color: COLORS.textPrimary }}>
              Connecting to Strava
            </h2>
            <p style={{ color: COLORS.textSecondary, margin: '0' }}>{status}</p>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
