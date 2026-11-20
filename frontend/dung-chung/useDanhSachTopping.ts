import { useEffect, useState, useCallback } from 'react';
import { API } from './cau-hinh-api';
import type { Topping } from './kieu-du-lieu-chung';

export const DEFAULT_TOPPINGS: Topping[] = [
  { id: 'top_tranchau', name: 'Trân châu', price: 10000, active: true },
  { id: 'top_kemcheese', name: 'Kem cheese', price: 10000, active: true },
  { id: 'top_shotespresso', name: 'Shot espresso', price: 10000, active: true },
];

export function useToppings() {
  const [toppings, setToppings] = useState<Topping[]>(DEFAULT_TOPPINGS);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchToppings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/toppings`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setToppings(data);
        }
      }
    } catch {
      // Keep default toppings on network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchToppings();
  }, [fetchToppings]);

  return { toppings, setToppings, fetchToppings, loading };
}

