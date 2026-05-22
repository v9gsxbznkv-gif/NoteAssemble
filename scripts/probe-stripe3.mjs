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

// The 2026 dahlia API uses a new "promotion" object. Let's find the right endpoint.
// Try /v1/billing/promotions
const paths = [
  "/v1/billing/promotions",
  "/v1/billing/promotion_codes", 
  "/v1/discounts",
];

for (const p of paths) {
  const r = await request("GET", `${p}?limit=3`);
  console.log(`GET ${p}:`, r.error?.message || `OK (${r.data?.length} items)`);
}

// Try creating a promotion via POST /v1/billing/promotions
console.log("\n=== POST /v1/billing/promotions ===");
const r = await request("POST", "/v1/billing/promotions", {
  name: "FOUNDER",
  percent_off: "100",
  duration: "forever",
});
console.log(JSON.stringify(r, null, 2));
