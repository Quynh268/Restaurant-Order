import { supabase } from '@/lib/supabaseClient';

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data;
}

export async function getFoodsByCategory(categoryId: number) {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_available', true)
    .order('is_combo', { ascending: false }); // combo lên trước

  if (error) throw error;
  return data;
}

// Lấy item mỗi combo_id
export async function getComboItems(comboId: number) {
  const { data, error } = await supabase
    .from('combo_items')
    .select('item_name')
    .eq('combo_id', comboId)
    .order('sort_order');

  if (error) throw error;
  return data;
}
