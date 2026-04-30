import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Steadfast Proxy Route
  app.post("/api/courier/steadfast", async (req, res) => {
    console.log("Steadfast Proxy Request received");
    try {
      const { apiKey, secretKey, payload } = req.body;

      if (!apiKey || !secretKey) {
        console.error("Missing Steadfast API credentials");
        return res.status(400).json({ status: 400, message: "Missing API credentials" });
      }

      console.log("Calling Steadfast API for invoice:", payload.invoice);
      
      // Discovery logic: Try combinations of domains and endpoints
      const domains = [
        "https://steadfast.com.bd",
        "https://api.steadfast.com.bd",
        "https://portal.steadfast.com.bd"
      ];
      
      const endpoints = [
        "/api/v1/create_order",
        "/api/v1/create_parcel"
      ];
      
      let response = null;
      let lastError = null;
      let usedUrl = "";

      for (const domain of domains) {
        for (const endpoint of endpoints) {
          const apiUrl = `${domain}${endpoint}`;
          console.log(`[Steadfast Discovery] Attempting: ${apiUrl}`);
          
          try {
            // @ts-ignore - Support for AbortSignal.timeout
            const signal = AbortSignal.timeout ? AbortSignal.timeout(6000) : null;
            
            const tempResponse = await fetch(apiUrl, {
              method: "POST",
              headers: {
                "Api-Key": apiKey,
                "Secret-Key": secretKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
              // @ts-ignore
              signal
            });
            
            console.log(`[Steadfast Discovery] ${apiUrl} returned status: ${tempResponse.status}`);
            
            // If it's success (200), or auth error (401/403), or bad request (400), 
            // it means the endpoint exists on this domain.
            if (tempResponse.ok || (tempResponse.status >= 400 && tempResponse.status < 404) || tempResponse.status > 404) {
              response = tempResponse;
              usedUrl = apiUrl;
              break;
            }
          } catch (error: any) {
            console.error(`[Steadfast Discovery] ${apiUrl} failed: ${error.message}`);
            lastError = error;
            // Continue if DNS error or Timeout
            if (error.code === 'ENOTFOUND' || error.message.includes('ENOTFOUND') || error.name === 'TimeoutError' || error.message.includes('timeout')) {
              continue; 
            }
            // Other network error, try next domain/endpoint
            continue;
          }
        }
        if (response) break;
      }

      if (!response && lastError) {
        throw lastError;
      }
      
      if (!response) {
        throw new Error("Could not connect to any Steadfast API endpoints.");
      }

      const responseText = await response.text();
      console.log(`Steadfast API (${usedUrl}) Response:`, responseText);

      try {
        const data = JSON.parse(responseText);
        res.status(response.status).json(data);
      } catch (e) {
        res.status(response.status).send(responseText);
      }
    } catch (error: any) {
      console.error("Steadfast Proxy Error:", error);
      res.status(500).json({ status: 500, message: error.message || "Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
