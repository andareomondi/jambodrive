import { createClient } from '@/lib/supabase-client'

export async function uploadCarImage(file: File): Promise<string> {
  const supabase = createClient()

  // Unique filename: timestamp + original name
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
  const path = `cars/${filename}`

  const { error } = await supabase.storage
    .from('car-images')
    .upload(path, file, { upsert: false })

  if (error) throw new Error(error.message)

  // Return the public URL
  const { data } = supabase.storage
    .from('car-images')
    .getPublicUrl(path)

  return data.publicUrl
}

export async function deleteCarImage(url: string) {
  const supabase = createClient()

  // Extract the path from the full URL
  const path = url.split('/car-images/')[1]
  if (!path) return

  const { error } = await supabase.storage
    .from('car-images')
    .remove([path])

  if (error) throw new Error(error.message)
}
