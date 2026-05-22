import Stripe from "stripe";
import { ENV } from "./_core/env";

export const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2026-04-22.dahlia",
});

// Plan definitions — single source of truth
export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceId: null as string | null,
    sessionLimit: 10, // sessions per month
    features: [
      "10 sessions per month",
      "AI analysis & action items",
      "Photo & file import",
      "Fireflies integration",
      "Share links",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 12,
    priceId: null as string | null, // populated at runtime via ensureProducts()
    sessionLimit: null, // unlimited
    features: [
      "Unlimited sessions",
      "AI analysis & action items",
      "Photo & file import",
      "All integrations",
      "Share links",
      "Weekly digest email",
      "Priority support",
    ],
  },
  team: {
    id: "team",
    name: "Team",
    price: 29,
    priceId: null as string | null,
    sessionLimit: null,
    features: [
      "Everything in Pro",
      "Team collaboration (coming soon)",
      "Admin dashboard (coming soon)",
      "Custom integrations",
      "Dedicated support",
    ],
  },
} as const;

export type PlanId = "free" | "pro" | "team";

// Cache for price IDs resolved at runtime
let _priceIds: Record<string, string> = {};

/**
 * Ensure Stripe products and prices exist, return price IDs.
 * Idempotent — safe to call on every server start.
 */
export async function ensureProducts(): Promise<Record<string, string>> {
  if (Object.keys(_priceIds).length > 0) return _priceIds;

  const planDefs = [
    { key: "pro", name: "NoteAssemble Pro", amount: 1200 },
    { key: "team", name: "NoteAssemble Team", amount: 2900 },
  ];

  for (const def of planDefs) {
    // Look for existing product by metadata key
    const existing = await stripe.products.search({
      query: `metadata['plan_key']:'${def.key}'`,
    });

    let product: Stripe.Product;
    if (existing.data.length > 0) {
      product = existing.data[0];
    } else {
      product = await stripe.products.create({
        name: def.name,
        metadata: { plan_key: def.key },
      });
    }

    // Look for active price on this product
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      recurring: { interval: "month" },
    });

    let price: Stripe.Price;
    if (prices.data.length > 0) {
      price = prices.data[0];
    } else {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: def.amount,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { plan_key: def.key },
      });
    }

    _priceIds[def.key] = price.id;
  }

  return _priceIds;
}

export function getPriceIds() {
  return _priceIds;
}
