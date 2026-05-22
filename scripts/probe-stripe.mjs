import https from "https";

const key = process.env.STRIPE_SECRET_KEY;

// Raw POST to see what params promotion_codes create requires in 2026 dahlia API
function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(body).toString();
    const req = https.request({
      hostname: "api.stripe.com",
      path,
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": "2026-04-22.dahlia",
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
}

// Try with 'promotion' param (new 2026 model)
const r1 = await post("/v1/promotion_codes", { code: "FOUNDER", promotion: "HrhKBTfI" });
console.log("promotion param:", JSON.stringify(r1.error || r1.id));

// Try with 'applies_to' 
const r2 = await post("/v1/promotion_codes", { code: "FOUNDER2", applies_to: "HrhKBTfI" });
console.log("applies_to param:", JSON.stringify(r2.error || r2.id));

// Try with no coupon — see what required params are
const r3 = await post("/v1/promotion_codes", {});
console.log("no params:", JSON.stringify(r3.error));
