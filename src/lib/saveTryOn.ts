import { supabase } from "./supabaseClient";

export async function saveTryOn(
  userId: string,
  photoUrl: string,
  items: any[],
  qualityScore: number | null,
  fitAnalysis: any
) {
  const { data, error } = await supabase
    .from("tryons")
    .insert([
      {
        user_id: userId,
        photo_url: photoUrl,
        items,
        quality_score: qualityScore,
        fit_analysis: fitAnalysis,
      },
    ])
    .select();

  if (error) {
    console.error("Error saving try-on:", error);
    throw error;
  }

  return data;
}
