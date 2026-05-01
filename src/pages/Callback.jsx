import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { exchangeToken } = useStrava()
  const [status, setStatus] = useState('Processing...')
  const [error, setError] = useState(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError('Authorization denied')
      setTimeout(() => navigate('/'), 3000)
      return
    }

    if (!code) {
      setError('No authorization code received')
      setTimeout(() => navigate('/'), 3000)
      return
    }

    const handleCallback = async () => {
      try {
        setStatus('Exchanging authorization code...')
        await exchangeToken(code)
        setStatus('Connected successfully! Redirecting...')
        setTimeout(() => navigate('/'), 1500)
      } catch (err) {
        setError(err.message || 'Failed to connect to Strava')
        setTimeout(() => navigate('/'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, exchangeToken, navigate])

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
