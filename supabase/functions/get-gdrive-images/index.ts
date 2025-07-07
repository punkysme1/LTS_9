// supabase/functions/get-gdrive-images/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Ambil API Key dari Supabase secrets
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
const API_URL = 'https://www.googleapis.com/drive/v3/files'

// Header PENTING untuk penanganan CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Izinkan semua origin
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Izinkan metode POST dan OPTIONS
}

serve(async (req) => {
  // Blok ini KHUSUS untuk menangani preflight request (OPTIONS) dari browser
  // Ini adalah bagian yang kemungkinan hilang atau salah
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { folderId } = await req.json()
    if (!folderId) {
      throw new Error('Folder ID is required')
    }
    if (!GOOGLE_API_KEY) {
      throw new Error('Google API Key is not configured')
    }

    const query = encodeURIComponent(`'${folderId}' in parents and (mimeType='image/jpeg' or mimeType='image/png' or mimeType='image/gif')`)
    const fields = encodeURIComponent('files(id, name, webContentLink, thumbnailLink)')
    
    const fullUrl = `${API_URL}?q=${query}&key=${GOOGLE_API_KEY}&fields=${fields}&orderBy=name`

    const response = await fetch(fullUrl)
    if (!response.ok) {
      const errorData = await response.json()
      console.error('Google Drive API Error:', errorData.error.message)
      throw new Error(`Google Drive API error: ${errorData.error.message}`)
    }

    const data = await response.json()
    
    const images = data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      url: file.webContentLink,
      thumbnail: file.thumbnailLink,
    }))

    // Pastikan respons utama juga menyertakan header CORS
    return new Response(
      JSON.stringify({ images }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    // Pastikan respons eror juga menyertakan header CORS
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})