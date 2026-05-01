import { useState, useEffect } from 'react'
import { config } from '../config'

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize'
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'
const STRAVA_API_URL = 'https://www.strava.com/api/v3'

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'strava_access_token',
  REFRESH_TOKEN: 'strava_refresh_token',
  EXPIRES_AT: 'strava_expires_at',
  ACTIVITIES_CACHE: 'strava_activities_cache',
  ACTIVITIES_CACHE_TIME: 'strava_activities_cache_time'
}

const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds

export const useStrava = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [activities, setActivities] = useState([])
  const [athlete, setAthlete] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check if user is already connected
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (accessToken) {
      setIsConnected(true)
    }
  }, [])

  const stravaAuthUrl = () => {
    const scope = 'read,activity:read_all'
    return `${STRAVA_AUTH_URL}?client_id=${config.stravaClientId}&redirect_uri=${config.stravaRedirectUri}&response_type=code&scope=${scope}`
  }

  const exchangeToken = async (code) => {
    try {
      const body = new URLSearchParams({
        client_id: config.stravaClientId,
        client_secret: config.stravaClientSecret,
        code: code,
        grant_type: 'authorization_code'
      })

      const response = await fetch(STRAVA_TOKEN_URL, {
        method: 'POST',
        body: body
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Token exchange failed:', errorText)
        throw new Error(`Failed to exchange token: ${response.status}`)
      }

      const data = await response.json()

      // Store tokens
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token)
      localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, data.expires_at)

      setIsConnected(true)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const body = new URLSearchParams({
        client_id: config.stravaClientId,
        client_secret: config.stravaClientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })

      const response = await fetch(STRAVA_TOKEN_URL, {
        method: 'POST',
        body: body
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Token refresh failed:', errorText)
        throw new Error(`Failed to refresh token: ${response.status}`)
      }

      const data = await response.json()

      // Update tokens
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token)
      localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, data.expires_at)

      return data.access_token
    } catch (err) {
      // If refresh fails, clear tokens and disconnect
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT)
      setIsConnected(false)
      throw err
    }
  }

  const getValidAccessToken = async () => {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    const expiresAt = parseInt(localStorage.getItem(STORAGE_KEYS.EXPIRES_AT))
    const now = Math.floor(Date.now() / 1000)

    // If token is expired or about to expire (within 5 minutes), refresh it
    if (!accessToken || expiresAt - now < 300) {
      return await refreshAccessToken()
    }

    return accessToken
  }

  const getAthlete = async () => {
    try {
      const accessToken = await getValidAccessToken()

      const response = await fetch(`${STRAVA_API_URL}/athlete`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, disconnect
          disconnect()
          throw new Error('Authentication failed')
        }
        throw new Error('Failed to fetch athlete info')
      }

      const data = await response.json()
      setAthlete(data)
      return data
    } catch (err) {
      console.error('Get athlete error:', err)
      throw err
    }
  }

  const getActivities = async (useCache = true) => {
    setLoading(true)
    setError(null)

    try {
      // ALWAYS check cache first - load immediately if exists
      const cachedActivities = localStorage.getItem(STORAGE_KEYS.ACTIVITIES_CACHE)

      if (cachedActivities) {
        const cached = JSON.parse(cachedActivities)
        setActivities(cached)
        console.log(`✅ Loaded ${cached.length} activities from cache immediately`)

        // If useCache is false or cache doesn't exist, fetch fresh data
        if (!useCache) {
          console.log('⏳ Fetching fresh activities (useCache=false)...')
        } else {
          // Cache exists, return it and skip API call
          setLoading(false)
          return cached
        }
      } else {
        console.log('📥 No cache found, fetching from API...')
      }

      // Fetch ALL activities with pagination
      const accessToken = await getValidAccessToken()
      let allActivities = []
      let page = 1
      const perPage = 100
      const maxActivities = 500

      while (true) {
        const response = await fetch(
          `${STRAVA_API_URL}/athlete/activities?per_page=${perPage}&page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        )

        // Handle rate limit (429) - silently return cache
        if (response.status === 429) {
          console.log('⚠️ Strava API rate limit reached (429) - using cache silently')
          const cachedActivitiesForRateLimit = localStorage.getItem(STORAGE_KEYS.ACTIVITIES_CACHE)
          if (cachedActivitiesForRateLimit) {
            const cached = JSON.parse(cachedActivitiesForRateLimit)
            setActivities(cached)
            setLoading(false)
            // Don't set error - show cached data silently
            return cached
          }
          // If no cache, just return empty array silently
          setLoading(false)
          return []
        }

        if (!response.ok) {
          if (response.status === 401) {
            // Token is invalid, disconnect
            disconnect()
            throw new Error('Authentication failed')
          }
          throw new Error('Failed to fetch activities')
        }

        const data = await response.json()

        // Break if no more activities
        if (!data || data.length === 0) break

        allActivities = [...allActivities, ...data]
        console.log(`📥 Fetched page ${page}: ${data.length} activities (total: ${allActivities.length})`)

        page++

        // Stop at max activities to avoid rate limits
        if (allActivities.length >= maxActivities) {
          console.log(`⚠️ Reached max limit of ${maxActivities} activities`)
          break
        }

        // Break if we got less than perPage (last page)
        if (data.length < perPage) break
      }

      // Save to cache
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES_CACHE, JSON.stringify(allActivities))
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES_CACHE_TIME, Date.now().toString())

      setActivities(allActivities)
      console.log(`✅ ${allActivities.length} Strava activities fetched and cached`)
      return allActivities
    } catch (err) {
      console.error('Strava API error:', err.message)

      // Fallback to cache if API fails - don't show error to user
      const cachedActivities = localStorage.getItem(STORAGE_KEYS.ACTIVITIES_CACHE)
      if (cachedActivities) {
        console.log('⚠️ API failed, using cached activities as fallback')
        const cached = JSON.parse(cachedActivities)
        setActivities(cached)
        setLoading(false)
        return cached
      }

      // Only throw if no cache available
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const disconnect = () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT)
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES_CACHE)
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES_CACHE_TIME)
    setIsConnected(false)
    setActivities([])
    setAthlete(null)
  }

  return {
    isConnected,
    activities,
    setActivities,
    athlete,
    loading,
    error,
    stravaAuthUrl,
    exchangeToken,
    getActivities,
    getAthlete,
    disconnect
  }
}

// Standalone disconnect function for use outside hook
export const disconnectStrava = () => {
  localStorage.removeItem('strava_access_token')
  localStorage.removeItem('strava_refresh_token')
  localStorage.removeItem('strava_expires_at')
}
