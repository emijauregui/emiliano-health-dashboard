import { useState } from 'react'
import { supabase } from '../lib/supabase'

export const useSupabase = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const saveWorkout = async (workout) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('workouts')
        .upsert({
          strava_id: workout.id,
          name: workout.name,
          type: workout.type,
          distance: workout.distance,
          moving_time: workout.moving_time,
          start_date: workout.start_date,
          polyline: workout.map?.summary_polyline,
          average_speed: workout.average_speed,
          max_speed: workout.max_speed,
          average_heartrate: workout.average_heartrate,
          max_heartrate: workout.max_heartrate,
          total_elevation_gain: workout.total_elevation_gain
        }, { onConflict: 'strava_id' })

      if (error) throw error
      return data
    } catch (err) {
      setError(err.message)
      console.error('Error saving workout:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getWorkouts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('start_date', { ascending: false })
        .limit(50)

      if (error) throw error
      return data
    } catch (err) {
      setError(err.message)
      console.error('Error fetching workouts:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const saveInBody = async (data) => {
    try {
      setLoading(true)

      // Check for duplicates by measurement_date
      const measurementDate = data.measurement_date || new Date().toISOString()
      const dateOnly = measurementDate.split('T')[0] // Compare only date part

      const { data: existing, error: checkError } = await supabase
        .from('inbody_records')
        .select('*')
        .gte('measurement_date', `${dateOnly}T00:00:00`)
        .lte('measurement_date', `${dateOnly}T23:59:59`)

      if (checkError) console.error('Error checking duplicates:', checkError)

      if (existing && existing.length > 0) {
        throw new Error('Este reporte ya fue registrado anteriormente')
      }

      // Prepare data object matching exact table schema
      const insertData = {
        measurement_date: measurementDate,
        weight: data.weight || null,
        muscle_mass: data.muscle || null,
        body_fat: data.fat || null,
        bmi: data.bmi || null,
        water: data.water || null,
        protein: data.protein || null
      }

      console.log('📊 INSERT data to inbody_records:', insertData)

      const { data: result, error } = await supabase
        .from('inbody_records')
        .insert(insertData)
        .select()

      if (error) {
        console.error('❌ Supabase INSERT error:', error)
        throw error
      }

      console.log('✅ INSERT successful:', result)
      return result
    } catch (err) {
      setError(err.message)
      console.error('Error saving InBody data:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getInBodyHistory = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('inbody_records')
        .select('*')
        .order('measurement_date', { ascending: false })
        .limit(50)

      if (error) throw error
      return data
    } catch (err) {
      setError(err.message)
      console.error('Error fetching InBody history:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const saveGpxFile = async (filename, parsedData, fileBlob) => {
    try {
      setLoading(true)

      // Check for duplicate filename
      const { data: existing, error: checkError } = await supabase
        .from('gpx_files')
        .select('id')
        .eq('filename', filename)

      if (checkError) console.error('Error checking duplicates:', checkError)

      if (existing && existing.length > 0) {
        console.log('⚠️ Duplicate GPX file found:', filename)
        return { duplicate: true }
      }

      // Upload file to storage
      const filePath = `gpx/${Date.now()}_${filename}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gpx-files')
        .upload(filePath, fileBlob)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gpx-files')
        .getPublicUrl(filePath)

      // Save metadata to database
      const { data, error } = await supabase
        .from('gpx_files')
        .insert({
          filename,
          file_path: filePath,
          file_url: publicUrl,
          distance: parsedData.distance,
          route_data: parsedData.route
        })
        .select()

      if (error) throw error
      return { duplicate: false, data }
    } catch (err) {
      setError(err.message)
      console.error('Error saving GPX file:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const savePdfFile = async (filename, fileBlob, parsedData) => {
    try {
      setLoading(true)

      // Check for duplicates by measurement_date
      const measurementDate = parsedData.measurement_date || parsedData.date || new Date().toISOString()
      const dateOnly = measurementDate.split('T')[0] // Compare only date part

      const { data: existing, error: checkError } = await supabase
        .from('inbody_records')
        .select('id')
        .gte('measurement_date', `${dateOnly}T00:00:00`)
        .lte('measurement_date', `${dateOnly}T23:59:59`)

      if (checkError) console.error('Error checking duplicates:', checkError)

      if (existing && existing.length > 0) {
        console.log('⚠️ Duplicate InBody record found for date:', dateOnly)
        return { duplicate: true }
      }

      console.log('📤 Uploading PDF to storage:', filename)

      // Upload file to storage
      const filePath = `${Date.now()}_${filename}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('inbody-pdfs')
        .upload(filePath, fileBlob)

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError)
        throw uploadError
      }

      console.log('✅ PDF uploaded to storage:', filePath)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('inbody-pdfs')
        .getPublicUrl(filePath)

      console.log('🔗 Public URL:', publicUrl)

      // Save to inbody_records (don't send file_url if column doesn't exist)
      const result = await saveInBody(parsedData)
      return { duplicate: false, data: result }
    } catch (err) {
      setError(err.message)
      console.error('Error saving PDF file:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getGpxFiles = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('gpx_files')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data
    } catch (err) {
      setError(err.message)
      console.error('Error fetching GPX files:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteWorkout = async (id) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      setError(err.message)
      console.error('Error deleting workout:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteGpxFile = async (id, filePath) => {
    try {
      setLoading(true)

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('gpx-files')
        .remove([filePath])

      if (storageError) console.error('Storage delete error:', storageError)

      // Delete from database
      const { error } = await supabase
        .from('gpx_files')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      setError(err.message)
      console.error('Error deleting GPX file:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteInBodyRecord = async (id) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('inbody_records')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      setError(err.message)
      console.error('Error deleting InBody record:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    saveWorkout,
    getWorkouts,
    saveInBody,
    getInBodyHistory,
    saveGpxFile,
    savePdfFile,
    getGpxFiles,
    deleteWorkout,
    deleteGpxFile,
    deleteInBodyRecord
  }
}
