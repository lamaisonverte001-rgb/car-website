"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";

export interface CartItem {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  category: string;
  sku: string;
  colorName: string;
  colorHex: string;
  engineName: string;
  wheelName: string;
  imageUrl: string;
  unitPriceMad: number;
  maxStock: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  isDrawerOpen: boolean;
  drawerStep: "cart" | "checkout";
  totalItems: number;
  totalMad: number;
  openDrawer: (step?: "cart" | "checkout") => void;
  closeDrawer: () => void;
  setDrawerStep: (step: "cart" | "checkout") => void;
  addItem: (item: Omit<CartItem, "quantity">, openCheckoutDirectly?: boolean) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
}

const STORAGE_KEY = "maison-veloce-cart-v1";
const EMPTY_ITEMS: CartItem[] = [];

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedParsed: CartItem[] = EMPTY_ITEMS;

function emitCartChange() {
  for (const l of listeners) l();
}

function subscribeCart(callback: () => void) {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function getCartSnapshot(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedParsed;
    cachedRaw = raw;
    if (!raw) {
      cachedParsed = EMPTY_ITEMS;
      return cachedParsed;
    }
    const parsed = JSON.parse(raw);
    cachedParsed = Array.isArray(parsed) ? (parsed as CartItem[]) : EMPTY_ITEMS;
    return cachedParsed;
  } catch {
    return EMPTY_ITEMS;
  }
}

function getServerCartSnapshot(): CartItem[] {
  return EMPTY_ITEMS;
}

function writeCart(nextItems: CartItem[]) {
  const serialized = JSON.stringify(nextItems);
  cachedRaw = serialized;
  cachedParsed = nextItems;
  try {
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // Ignore storage quota errors
  }
  emitCartChange();
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getServerCartSnapshot
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<"cart" | "checkout">("cart");

  const openDrawer = useCallback((step: "cart" | "checkout" = "cart") => {
    setDrawerStep(step);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const addItem = useCallback(
    (incoming: Omit<CartItem, "quantity">, openCheckoutDirectly = false) => {
      const prev = getCartSnapshot();
      const idx = prev.findIndex((i) => i.variantId === incoming.variantId);
      let next: CartItem[];
      if (idx >= 0) {
        next = [...prev];
        const existing = next[idx];
        const cap = Math.min(3, Math.max(1, incoming.maxStock));
        next[idx] = {
          ...existing,
          ...incoming,
          quantity: Math.min(cap, existing.quantity + 1),
        };
      } else {
        next = [...prev, { ...incoming, quantity: 1 }];
      }
      writeCart(next);
      setDrawerStep(openCheckoutDirectly ? "checkout" : "cart");
      setIsDrawerOpen(true);
    },
    []
  );

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    const prev = getCartSnapshot();
    if (quantity <= 0) {
      writeCart(prev.filter((i) => i.variantId !== variantId));
      return;
    }
    writeCart(
      prev.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.min(Math.min(3, item.maxStock), quantity) }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((variantId: string) => {
    const prev = getCartSnapshot();
    writeCart(prev.filter((i) => i.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => {
    writeCart([]);
  }, []);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalMad = items.reduce((acc, item) => acc + item.unitPriceMad * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isDrawerOpen,
        drawerStep,
        totalItems,
        totalMad,
        openDrawer,
        closeDrawer,
        setDrawerStep,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
