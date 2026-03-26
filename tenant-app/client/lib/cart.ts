export type CartItem = { productId: string; quantity: number };

function key(tenantId: string) {
  return `cart:${tenantId}`;
}

export function saveCart(tenantId: string, entries: Array<[string, number]> | Map<string, number>) {
  const list: CartItem[] = Array.isArray(entries)
    ? entries.map(([productId, quantity]) => ({ productId, quantity }))
    : Array.from((entries as Map<string, number>).entries()).map(([productId, quantity]) => ({ productId, quantity }));
  try {
    localStorage.setItem(key(tenantId), JSON.stringify(list));
  } catch {}
}

export function loadCart(tenantId: string): CartItem[] {
  try {
    const raw = localStorage.getItem(key(tenantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(it => it && it.productId && typeof it.quantity === 'number');
  } catch {}
  return [];
}

export function clearCart(tenantId: string) {
  try { localStorage.removeItem(key(tenantId)); } catch {}
}
