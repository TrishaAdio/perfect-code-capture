// Backend-persisted cart with offline-safe optimistic updates.
//
// Design:
// - localStorage cache for instant UI + offline survival.
// - On boot (and on login), hydrate from /api/cart if a session exists.
//   Backend wins UNLESS we have local pending changes (dirty flag), in which
//   case local wins and we push immediately.
// - Every mutation writes local, marks dirty, schedules a debounced PUT.
// - On 401/network failure: keep local cache, retry with backoff. Cart never
//   silently disappears.
// - Same exported API as before so callers (CartPanel, product page) stay
//   identical and visuals don't change.
import { useEffect, useState, useCallback } from "react";
import {
  fetchCart,
  pushCart,
  clearServerCart,
  getToken,
  type ServerCartItem,
} from "@/lib/api";

export type CartItem = {
  productId: string;
  name: string;
  image: string;
  category?: string;
  months: number;
  price: number;
  realPrice?: number;
  quantity: number;
};

const KEY = "symdeals.cart";
const DIRTY_KEY = "symdeals.cart.dirty";
const EVT = "symdeals:cart";

function safeStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function read(): CartItem[] {
  const s = safeStorage();
  if (!s) return [];
  try {
    const raw = s.getItem(KEY);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(items: CartItem[]) {
  const s = safeStorage();
  if (!s) return;
  try {
    s.setItem(KEY, JSON.stringify(items));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVT));
    }
  } catch {
    /* ignore */
  }
}

function setDirty(v: boolean) {
  const s = safeStorage();
  if (!s) return;
  try {
    if (v) s.setItem(DIRTY_KEY, "1");
    else s.removeItem(DIRTY_KEY);
  } catch {
    /* ignore */
  }
}
function isDirty(): boolean {
  const s = safeStorage();
  if (!s) return false;
  try {
    return s.getItem(DIRTY_KEY) === "1";
  } catch {
    return false;
  }
}

function itemKey(i: Pick<CartItem, "productId" | "months">) {
  return `${i.productId}::${i.months}`;
}

function toServer(items: CartItem[]): ServerCartItem[] {
  return items.map((it) => ({
    productId: it.productId,
    months: it.months,
    quantity: it.quantity,
    name: it.name || "",
    image: it.image || "",
    category: it.category || "",
    price: it.price,
    realPrice: it.realPrice ?? 0,
  }));
}
function fromServer(items: ServerCartItem[]): CartItem[] {
  return items.map((it) => ({
    productId: it.productId,
    months: it.months,
    quantity: it.quantity,
    name: it.name || "",
    image: it.image || "",
    category: it.category || undefined,
    price: it.price,
    realPrice: it.realPrice || undefined,
  }));
}

// ---------- Sync engine ----------
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let inflight: Promise<void> | null = null;
let retryDelay = 1500;

function schedulePush(delayMs = 350) {
  if (typeof window === "undefined") return;
  if (!getToken()) return; // anonymous: localStorage only
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void runPush();
  }, delayMs);
}

async function runPush(): Promise<void> {
  if (inflight) return inflight;
  if (!getToken()) return;
  const snapshot = read();
  inflight = (async () => {
    try {
      const res = await pushCart(toServer(snapshot));
      // Only clear dirty if no further changes happened since snapshot.
      const latest = read();
      if (JSON.stringify(latest) === JSON.stringify(snapshot)) {
        setDirty(false);
      } else {
        // changed during flight — schedule another push
        schedulePush(200);
      }
      // Reflect canonicalized server items if they differ trivially
      const canonical = fromServer(res.items);
      if (JSON.stringify(canonical) !== JSON.stringify(latest)) {
        // Avoid clobbering newer local edits during inflight
        if (JSON.stringify(latest) === JSON.stringify(snapshot)) {
          writeLocal(canonical);
        }
      }
      retryDelay = 1500;
    } catch {
      // backoff retry
      setDirty(true);
      const next = Math.min(retryDelay * 2, 30_000);
      setTimeout(() => {
        if (isDirty()) schedulePush(0);
      }, retryDelay);
      retryDelay = next;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

let hydrated = false;
let hydrating: Promise<void> | null = null;

export async function initCartSync(force = false): Promise<void> {
  if (typeof window === "undefined") return;
  if (!getToken()) return;
  if (hydrated && !force) return;
  if (hydrating) return hydrating;
  hydrating = (async () => {
    try {
      // If we have unsynced local changes, push first then trust local.
      if (isDirty()) {
        await runPush();
        hydrated = true;
        return;
      }
      const res = await fetchCart();
      const serverItems = fromServer(res.items);
      writeLocal(serverItems);
      hydrated = true;
    } catch {
      // keep local cache; will retry on next mutation
    } finally {
      hydrating = null;
    }
  })();
  return hydrating;
}

// Re-hydrate on tab focus / visibility — covers backgrounded mobile tabs.
if (typeof window !== "undefined") {
  const refresh = () => {
    if (document.visibilityState === "visible" && getToken()) {
      void initCartSync(true);
    }
  };
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", refresh);

  // React to login/logout dispatched by api.ts.
  window.addEventListener("symdeals:auth", ((e: Event) => {
    const detail = (e as CustomEvent).detail as { type?: string } | undefined;
    if (detail?.type === "login") {
      void hydrateCartAfterLogin();
    } else if (detail?.type === "logout") {
      clearLocalCartCache();
    }
  }) as EventListener);
}

// ---------- Public API (unchanged signatures) ----------

export function getCart(): CartItem[] {
  return read();
}

export function addToCart(item: CartItem) {
  const items = read();
  const k = itemKey(item);
  const existing = items.find((x) => itemKey(x) === k);
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + (item.quantity || 1));
    existing.price = item.price;
    existing.realPrice = item.realPrice;
    existing.image = item.image;
    existing.name = item.name;
    existing.category = item.category;
  } else {
    items.push({ ...item, quantity: Math.max(1, item.quantity || 1) });
  }
  writeLocal(items);
  setDirty(true);
  schedulePush();
}

export function removeFromCart(productId: string, months: number) {
  const next = read().filter(
    (x) => !(x.productId === productId && x.months === months)
  );
  writeLocal(next);
  setDirty(true);
  schedulePush();
}

export function setCartQuantity(productId: string, months: number, qty: number) {
  const items = read();
  const next = items
    .map((x) =>
      x.productId === productId && x.months === months
        ? { ...x, quantity: Math.max(0, Math.min(99, Math.floor(qty))) }
        : x
    )
    .filter((x) => x.quantity > 0);
  writeLocal(next);
  setDirty(true);
  schedulePush();
}

export function clearCart() {
  writeLocal([]);
  setDirty(false);
  if (getToken()) {
    void clearServerCart().catch(() => {
      setDirty(true);
      schedulePush();
    });
  }
}

// Call after login to pull the user's saved cart.
export async function hydrateCartAfterLogin() {
  hydrated = false;
  await initCartSync(true);
}

// Call on logout to clear the local cache (server copy stays).
export function clearLocalCartCache() {
  const s = safeStorage();
  if (!s) return;
  try {
    s.removeItem(KEY);
    s.removeItem(DIRTY_KEY);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVT));
    }
  } catch {
    /* ignore */
  }
  hydrated = false;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => read());

  useEffect(() => {
    // Hydrate from backend on first mount when authenticated.
    void initCartSync();

    const sync = () => setItems(read());
    window.addEventListener(EVT, sync as EventListener);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync as EventListener);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const totalItems = items.reduce((s, x) => s + x.quantity, 0);
  const totalPrice = items.reduce((s, x) => s + x.price * x.quantity, 0);
  const totalSaved = items.reduce(
    (s, x) => s + Math.max(0, (x.realPrice ?? 0) - x.price) * x.quantity,
    0
  );

  const remove = useCallback((productId: string, months: number) => {
    removeFromCart(productId, months);
  }, []);
  const setQty = useCallback(
    (productId: string, months: number, qty: number) => {
      setCartQuantity(productId, months, qty);
    },
    []
  );
  const clear = useCallback(() => clearCart(), []);

  return { items, totalItems, totalPrice, totalSaved, remove, setQty, clear };
}
