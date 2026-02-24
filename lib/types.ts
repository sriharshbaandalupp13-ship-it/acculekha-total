export type ProductCategory = "software" | "hardware" | "iot" | "service" | "bundle";

export interface ProductInput {
  id?: string;
  slug: string;
  name: string;
  cat: ProductCategory;
  description: string;
  unit: string;
  price: number;
  origPrice?: number | null;
  gstRate: number;
  inStock: boolean;
  enabled: boolean;
  isNew: boolean;
  offer?: string | null;
  image1?: string | null;
  image2?: string | null;
  image3?: string | null;
  image4?: string | null;
  videoUrl?: string | null;
}

export interface CartLine {
  productId: string;
  qty: number;
}
