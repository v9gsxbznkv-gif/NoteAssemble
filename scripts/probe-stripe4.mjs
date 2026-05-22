import https from "https";

const key = process.env.STRIPE_SECRET_KEY;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? new URLSearchParams(body).toString() : "";
    const req = https.request({
      hostname: "api.stripe.com",
      path,
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": "2026-04-22.dahlia",
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

// The 2026 dahlia API requires a 'promotion' object ID for promotion_codes.create
// A 'promotion' is a new object type. Let's try creating one.
// Based on the error "Missing required param: promotion" and "Invalid object" for coupon ID,
// the promotion object must be created separately.

// Try GET /v1/promotions with older API version to see if it exists
const r1 = await request("GET", "/v1/promotions?limit=3");
console.log("GET /v1/promotions:", JSON.stringify(r1.error?.message || r1.object));

// Try POST /v1/promotions to create a promotion
const r2 = await request("POST", "/v1/promotions", {
  percent_off: "100",
  duration: "forever",
  name: "FOUNDER 100% Off",
});
console.log("POST /v1/promotions:", JSON.stringify(r2.error?.message || r2.id));

// Try the billing/promotions endpoint
const r3 = await request("POST", "/v1/billing/promotions", {
  percent_off: "100",
  duration: "forever",
});
console.log("POST /v1/billing/promotions:", JSON.stringify(r3.error?.message || r3.id));

// What if we use the coupon ID directly as the promotion param?
// The error says "Invalid object" which means it found the param but the object type is wrong
// Let's check if there's a way to convert a coupon to a promotion
const r4 = await request("GET", "/v1/coupons/HrhKBTfI");
console.log("Coupon object type:", r4.object, "id:", r4.id);

// Try creating promotion code with older API version (no dahlia)
const r5 = await new Promise((resolve, reject) => {
  const data = new URLSearchParams({code: "FOUNDER", coupon: "HrhKBTfI"}).toString();
  const req = https.request({
    hostname: "api.stripe.com",
    path: "/v1/promotion_codes",
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2024-06-20", // older stable version
      "Content-Length": Buffer.byteLength(data),
    },
  }, (res) => {
    let d = "";
    res.on("data", (c) => (d += c));
    res.on("end", () => resolve(JSON.parse(d)));
  });
  req.on("error", reject);
  req.write(data);
  req.end();
});
console.log("With old API version 2024-06-20:", JSON.stringify(r5.error?.message || r5.id));
