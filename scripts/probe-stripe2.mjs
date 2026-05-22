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

// 1. List existing promotions
console.log("=== GET /v1/promotions ===");
const list = await request("GET", "/v1/promotions?limit=5");
console.log(JSON.stringify(list, null, 2));

// 2. Try creating a promotion (new 2026 object)
console.log("\n=== POST /v1/promotions (create) ===");
const create = await request("POST", "/v1/promotions", {
  name: "FOUNDER - 100% Off Forever",
  percent_off: "100",
  duration: "forever",
});
console.log(JSON.stringify(create, null, 2));
