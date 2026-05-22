/**
 * Creates FOUNDER and BETA promo codes in Stripe.
 * Uses API version 2024-06-20 because the 2026 dahlia API changed the
 * promotion_codes.create 'coupon' param to a new 'promotion' object type.
 *
 * FOUNDER — 100% off forever, unlimited redemptions (share with trusted testers)
 * BETA    — 100% off forever, 50 redemptions, expires in 90 days (wider beta)
 *
 * Run: node scripts/create-promo.mjs
 */

import https from "https";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("ERROR: STRIPE_SECRET_KEY not set");
  process.exit(1);
}

function request(method, path, body = null, apiVersion = "2024-06-20") {
  return new Promise((resolve, reject) => {
    const data = body ? new URLSearchParams(body).toString() : "";
    const req = https.request({
      hostname: "api.stripe.com",
      path,
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": apiVersion,
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve(JSON.parse(d)));
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log("Setting up NoteAssemble promo codes...\n");

  // 1. Find or create the 100% off forever coupon
  let couponId;
  const coupons = await request("GET", "/v1/coupons?limit=100");
  const existing = coupons.data?.find((c) => c.name === "FOUNDER - 100% Off Forever");

  if (existing) {
    couponId = existing.id;
    console.log(`✓ Coupon already exists: ${couponId}`);
  } else {
    const coupon = await request("POST", "/v1/coupons", {
      name: "FOUNDER - 100% Off Forever",
      percent_off: "100",
      duration: "forever",
      currency: "usd",
    });
    if (coupon.error) {
      console.error("Failed to create coupon:", coupon.error.message);
      process.exit(1);
    }
    couponId = coupon.id;
    console.log(`✓ Coupon created: ${couponId}`);
  }

  // 2. Create FOUNDER promo code (unlimited, never expires)
  const existingFounder = await request("GET", "/v1/promotion_codes?code=FOUNDER&limit=5");
  if (existingFounder.data?.length > 0) {
    const pc = existingFounder.data[0];
    console.log(`✓ FOUNDER code already exists: ${pc.id} (active: ${pc.active}, redeemed: ${pc.times_redeemed})`);
  } else {
    const founder = await request("POST", "/v1/promotion_codes", {
      coupon: couponId,
      code: "FOUNDER",
    });
    if (founder.error) {
      console.error("Failed to create FOUNDER code:", founder.error.message);
    } else {
      console.log(`✓ FOUNDER promo code created: ${founder.id}`);
    }
  }

  // 3. Create BETA promo code (50 uses, expires in 90 days)
  const betaExpiry = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;
  const existingBeta = await request("GET", "/v1/promotion_codes?code=BETA&limit=5");
  if (existingBeta.data?.length > 0) {
    const pc = existingBeta.data[0];
    console.log(`✓ BETA code already exists: ${pc.id} (active: ${pc.active}, redeemed: ${pc.times_redeemed})`);
  } else {
    const beta = await request("POST", "/v1/promotion_codes", {
      coupon: couponId,
      code: "BETA",
      max_redemptions: "50",
      expires_at: String(betaExpiry),
    });
    if (beta.error) {
      console.error("Failed to create BETA code:", beta.error.message);
    } else {
      console.log(`✓ BETA promo code created: ${beta.id} (50 uses, expires in 90 days)`);
    }
  }

  console.log("\n=== DONE ===");
  console.log("Share these codes at checkout:");
  console.log("  FOUNDER — 100% off Pro/Team forever, unlimited uses (your personal code)");
  console.log("  BETA    — 100% off Pro/Team forever, 50 uses, expires in 90 days");
  console.log("\nUsers enter the code on the Stripe checkout page.");
  console.log("View codes: https://dashboard.stripe.com/test/promotion-codes");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
