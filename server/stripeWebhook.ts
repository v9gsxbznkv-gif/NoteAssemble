import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "./stripe";
import { ENV } from "./_core/env";
import { getUserByStripeCustomerId, updateUserBilling } from "./db";
import type { PlanId } from "./db";

// Map Stripe price metadata plan_key → our PlanId
function planFromMetadata(metadata: Stripe.Metadata): PlanId {
  const key = metadata?.plan_key;
  if (key === "pro" || key === "team") return key;
  return "free";
}

export async function stripeWebhookHandler(req: Request, res: Response) {
  // Test event passthrough (for Stripe webhook verification)
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      ENV.stripeWebhookSecret
    );
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }

  // Test event passthrough
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;
        const planKey = (session.metadata?.plan_key ?? "free") as PlanId;
        const customerId = typeof session.customer === "string" ? session.customer : null;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;

        if (userId) {
          await updateUserBilling(userId, {
            plan: planKey,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            planExpiresAt: null, // active subscription — no expiry
          });
          console.log(`[Stripe Webhook] User ${userId} upgraded to ${planKey}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : null;
        if (!customerId) break;

        const user = await getUserByStripeCustomerId(customerId);
        if (!user) break;

        // Determine plan from price metadata
        const priceId = sub.items.data[0]?.price?.id;
        let planKey: PlanId = "free";
        if (priceId) {
          const price = await stripe.prices.retrieve(priceId, { expand: ["metadata"] });
          planKey = planFromMetadata(price.metadata);
        }

        const isActive = sub.status === "active" || sub.status === "trialing";
        // current_period_end lives on the subscription item in newer Stripe API versions
        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
        const expiresAt = isActive ? null : (periodEnd ? periodEnd * 1000 : null);

        await updateUserBilling(user.id, {
          plan: isActive ? planKey : "free",
          stripeSubscriptionId: sub.id,
          planExpiresAt: expiresAt,
        });
        console.log(`[Stripe Webhook] User ${user.id} subscription updated: ${sub.status} → ${planKey}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : null;
        if (!customerId) break;

        const user = await getUserByStripeCustomerId(customerId);
        if (!user) break;

        await updateUserBilling(user.id, {
          plan: "free",
          stripeSubscriptionId: null,
          planExpiresAt: null,
        });
        console.log(`[Stripe Webhook] User ${user.id} subscription cancelled — downgraded to free`);
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }

  return res.json({ received: true });
}
