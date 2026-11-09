'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  CreateIngredientPayload,
  IngredientDto,
  inventoryApiClient,
  ProductRecipeDto,
  ReplaceRecipePayload,
  RestockPayload,
  UpdateIngredientPayload,
} from '../api/khach-api-ton-kho';

export function useInventory(token?: string | null) {
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token !== undefined) {
      inventoryApiClient.setToken(token);
    }
  }, [token]);

  const fetchIngredients = useCallback(async (lowStockOnly = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryApiClient.listIngredients(lowStockOnly);
      setIngredients(data);
      return data;
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách nguyên liệu');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const notifyInventoryChanged = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('brewlite:inventory-updated'));
      try {
        localStorage.setItem('brewlite_inventory_updated', Date.now().toString());
        localStorage.setItem('brewlite_admin_products_updated', Date.now().toString());
      } catch {}
    }
  }, []);

  const createIngredient = useCallback(
    async (payload: CreateIngredientPayload) => {
      const created = await inventoryApiClient.createIngredient(payload);
      await fetchIngredients();
      notifyInventoryChanged();
      return created;
    },
    [fetchIngredients, notifyInventoryChanged],
  );

  const updateIngredient = useCallback(
    async (id: string, payload: UpdateIngredientPayload) => {
      const updated = await inventoryApiClient.updateIngredient(id, payload);
      await fetchIngredients();
      notifyInventoryChanged();
      return updated;
    },
    [fetchIngredients, notifyInventoryChanged],
  );

  const restock = useCallback(
    async (id: string, payload: RestockPayload) => {
      const updated = await inventoryApiClient.restock(id, payload);
      await fetchIngredients();
      notifyInventoryChanged();
      return updated;
    },
    [fetchIngredients, notifyInventoryChanged],
  );

  const deleteIngredient = useCallback(
    async (id: string) => {
      const res = await inventoryApiClient.deleteIngredient(id);
      await fetchIngredients();
      notifyInventoryChanged();
      return res;
    },
    [fetchIngredients, notifyInventoryChanged],
  );

  const getRecipe = useCallback(async (productId: string): Promise<ProductRecipeDto> => {
    return inventoryApiClient.getRecipe(productId);
  }, []);

  const replaceRecipe = useCallback(
    async (productId: string, payload: ReplaceRecipePayload): Promise<ProductRecipeDto> => {
      const res = await inventoryApiClient.replaceRecipe(productId, payload);
      notifyInventoryChanged();
      return res;
    },
    [notifyInventoryChanged],
  );

  useEffect(() => {
    fetchIngredients().catch(() => {});
  }, [fetchIngredients]);

  return {
    ingredients,
    loading,
    error,
    fetchIngredients,
    createIngredient,
    updateIngredient,
    restock,
    deleteIngredient,
    getRecipe,
    replaceRecipe,
  };
}

