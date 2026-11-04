import express from "express";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 10000);

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: "24kb" }));

app.get("/api/health", (_req, res) => {
  res.set("Cache-Control", "no-store").json({
    ok: true, service: "oneupay", mode: "preview",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/gateway/status", (_req, res) => {
  res.set("Cache-Control", "no-store").json({
    providerConfigured: false, livePaymentsEnabled: false, mode: "preview",
    message: "No authorised payment-provider adapter is configured. Checkout session creation is disabled."
  });
});

// Fail closed until a payment provider has approved the platform, merchants,
// backend authentication, order lifecycle and signed webhook integration.
app.post("/api/payment-sessions", (_req, res) => {
  res.set("Cache-Control", "no-store").status(503).json({
    error: "PAYMENT_PROVIDER_NOT_CONFIGURED",
    message: "Live payment processing is not enabled in this OneUPay preview."
  });
});

app.post("/api/webhooks/:provider", (_req, res) => {
  res.set("Cache-Control", "no-store").status(503).json({
    error: "WEBHOOK_ADAPTER_NOT_CONFIGURED",
    message: "No payment-provider webhook adapter is enabled."
  });
});

const distPath = path.resolve(__dirname, "../dist");
app.use(express.static(distPath, { index: false, maxAge: process.env.NODE_ENV === "production" ? "1h" : 0 }));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "NOT_FOUND" });
  res.sendFile(path.join(distPath, "index.html"), err => { if (err) next(err); });
});
app.use((err, _req, res, _next) => {
  console.error("OneUPay server error:", err?.message || "Unknown error");
  res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
});

app.listen(port, "0.0.0.0", () => console.log("OneUPay preview service listening on " + port));