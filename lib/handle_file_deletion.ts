
import { createClient } from '@/lib/supabase-client'
import { deleteCarImage } from '@/lib/upload-image'

export async function deleteCarImageFromStorage(carId: string) {
  const supabase = createClient()

  // 1. Fetch the car to get the image URLs before deleting
  const { data: car, error: fetchError } = await supabase
    .from('cars')
    .select('image, images')
    .eq('id', carId)
    .single()

  if (fetchError) throw new Error(fetchError.message)

  // 2. Delete the car from the database
  const { error: deleteError } = await supabase
    .from('cars')
    .delete()
    .eq('id', carId)

  if (deleteError) throw new Error(deleteError.message)

  // 3. Clean up storage via the API to ensure physical files are removed
  const filesToDelete = []
  if (car?.image) filesToDelete.push(deleteCarImage(car.image))
  if (car?.images?.length) {
    car.images.forEach((url: string) => filesToDelete.push(deleteCarImage(url)))
  }

  // Execute storage deletions in parallel
  await Promise.allSettled(filesToDelete)
}
