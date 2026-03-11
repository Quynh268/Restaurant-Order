export type Category = {
  id: number;
  name: string;
  is_active: boolean;
  sort_order: number;
};

export type ComboItem = {
  item_name: string;
};

export type Food = {
  id: number;
  category_id: number;
  name: string;
  price: number;
  is_combo: boolean;
  is_addon: boolean;
  is_available: boolean;
  image?: string;
  combo_items?: ComboItem[];
};