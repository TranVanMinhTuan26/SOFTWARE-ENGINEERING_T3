'use client';

import { IngredientsTab } from './TabNguyenLieu';

interface InventoryTabProps {
  triggerToast?: (msg: string) => void;
}

export function InventoryTab({ triggerToast = () => {} }: InventoryTabProps) {
  return <IngredientsTab triggerToast={triggerToast} />;
}
