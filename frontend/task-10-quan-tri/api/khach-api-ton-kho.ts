export interface IngredientDto {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  costPrice?: number;
  lowStockThreshold: number;
  isTopping?: boolean;
  price?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIngredientPayload {
  name: string;
  unit: string;
  quantity: number;
  costPrice?: number;
  lowStockThreshold: number;
  isTopping?: boolean;
  price?: number;
}

export interface UpdateIngredientPayload {
  name?: string;
  unit?: string;
  quantity?: number;
  costPrice?: number;
  lowStockThreshold?: number;
  isTopping?: boolean;
  price?: number;
}

export interface RestockPayload {
  quantity: number;
}

export interface RecipeItemDto {
  id: string;
  ingredientId: string;
  ingredientName: string;
  unit: string;
  quantity: number;
  costPrice?: number;
  subtotal?: number;
}

export interface ProductRecipeDto {
  productId: string;
  productName: string;
  price?: number;
  totalCost?: number;
  items: RecipeItemDto[];
}

export interface ReplaceRecipePayload {
  items: Array<{
    ingredientId: string;
    quantity: number;
  }>;
  newPrice?: number;
}

export type TokenProvider = () => string | null;

export interface InventoryClientOptions {
  baseUrl?: string;
  token?: string | null;
  tokenProvider?: TokenProvider;
}

/**
 * Client kết nối API Kho nguyên liệu theo OOP:
 * - KHÔNG lưu trữ hoặc đọc trực tiếp từ ổ cứng / localStorage của máy.
 * - Quản lý token xác thực thuần túy trong bộ nhớ RAM (In-Memory).
 * - Hỗ trợ Dependency Injection thông qua constructor hoặc setToken/setTokenProvider.
 */
export class InventoryApiClient {
  private readonly baseUrl: string;
  private inMemoryToken: string | null = null;
  private tokenProvider: TokenProvider | null = null;

  constructor(options?: InventoryClientOptions | string) {
    if (typeof options === 'string') {
      this.baseUrl = options;
    } else {
      this.baseUrl = options?.baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      this.inMemoryToken = options?.token ?? null;
      this.tokenProvider = options?.tokenProvider ?? null;
    }
  }

  /**
   * Thiết lập Token xác thực trong bộ nhớ RAM (In-Memory).
   */
  datToken(token: string | null): this {
    this.inMemoryToken = token;
    return this;
  }

  setToken(token: string | null): this {
    return this.datToken(token);
  }

  /**
   * Thiết lập Provider cung cấp Token động (In-Memory Provider).
   */
  datNhaCungCapToken(provider: TokenProvider | null): this {
    this.tokenProvider = provider;
    return this;
  }

  setTokenProvider(provider: TokenProvider | null): this {
    return this.datNhaCungCapToken(provider);
  }

  private resolveToken(): string | null {
    if (this.inMemoryToken) {
      return this.inMemoryToken;
    }
    if (this.tokenProvider) {
      try {
        const t = this.tokenProvider();
        if (t) return t;
      } catch {
        return null;
      }
    }
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('brewlite_admin_token') ||
        localStorage.getItem('brewlite-admin-token') ||
        localStorage.getItem('brewlite-token') ||
        localStorage.getItem('brewlite_token')
      );
    }
    return null;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const token = this.resolveToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string>),
    };

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message = data?.message || data?.error || `Yêu cầu thất bại với mã lỗi ${res.status}`;
      const err = new Error(message);
      (err as any).statusCode = res.status;
      (err as any).data = data;
      throw err;
    }

    return data as T;
  }

  // --- Nguyên liệu ---
  async danhSachNguyenLieu(lowStockOnly = false): Promise<IngredientDto[]> {
    const query = lowStockOnly ? '?lowStock=true' : '';
    return this.request<IngredientDto[]>(`/admin/ingredients${query}`);
  }

  async listIngredients(lowStockOnly = false): Promise<IngredientDto[]> {
    return this.danhSachNguyenLieu(lowStockOnly);
  }

  async layNguyenLieu(id: string): Promise<IngredientDto> {
    return this.request<IngredientDto>(`/admin/ingredients/${id}`);
  }

  async getIngredient(id: string): Promise<IngredientDto> {
    return this.layNguyenLieu(id);
  }

  async taoNguyenLieu(payload: CreateIngredientPayload): Promise<IngredientDto> {
    return this.request<IngredientDto>('/admin/ingredients', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createIngredient(payload: CreateIngredientPayload): Promise<IngredientDto> {
    return this.taoNguyenLieu(payload);
  }

  async capNhatNguyenLieu(id: string, payload: UpdateIngredientPayload): Promise<IngredientDto> {
    return this.request<IngredientDto>(`/admin/ingredients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async updateIngredient(id: string, payload: UpdateIngredientPayload): Promise<IngredientDto> {
    return this.capNhatNguyenLieu(id, payload);
  }

  async nhapThemNguyenLieu(id: string, payload: RestockPayload): Promise<IngredientDto> {
    return this.request<IngredientDto>(`/admin/ingredients/${id}/restock`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async restock(id: string, payload: RestockPayload): Promise<IngredientDto> {
    return this.nhapThemNguyenLieu(id, payload);
  }

  async xoaNguyenLieu(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/ingredients/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteIngredient(id: string): Promise<{ success: boolean; message: string }> {
    return this.xoaNguyenLieu(id);
  }

  // --- Công thức món ---
  async layCongThuc(productId: string): Promise<ProductRecipeDto> {
    return this.request<ProductRecipeDto>(`/admin/recipes/product/${productId}`);
  }

  async getRecipe(productId: string): Promise<ProductRecipeDto> {
    return this.layCongThuc(productId);
  }

  async thayTheCongThuc(productId: string, payload: ReplaceRecipePayload): Promise<ProductRecipeDto> {
    return this.request<ProductRecipeDto>(`/admin/recipes/product/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async replaceRecipe(productId: string, payload: ReplaceRecipePayload): Promise<ProductRecipeDto> {
    return this.thayTheCongThuc(productId, payload);
  }
}

export const inventoryApiClient = new InventoryApiClient();
