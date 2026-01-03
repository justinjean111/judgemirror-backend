import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { limiter } from "./rateLimit";
import { JudgePayloadSchema } from "./schema";
import { isPayloadSafe, safeFallbackResult } from "./safety";
import { judgeWithOpenAI } from "./openai";

const app = express();

// If you want to lock CORS later, do it after you deploy the app URL.
// For now keep it simple for MVP.
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: "256kb" }));

// Basic rate limit
app.use(limiter);

// Health check (Render uses this sometimes)
app.get("/", (_req, res) => {
  res.status(200).json({ ok: true, service: "judgemirror-backend" });
});

app.post("/api/judge-result", async (req, res) => {
  try {
    const parsed = JudgePayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        label: "Too messy",
        roast: "I tried to understand your choices… but your data is doing parkour.",
        cta: "Play again",
        safetyLevel: "fallback",
        resultTags: ["invalid_payload"]
      });
    }

    const payload = parsed.data;

    // Safety filter: if payload contains disallowed stuff, return safe generic roast
    if (!isPayloadSafe(payload)) {
      return res.status(200).json(safeFallbackResult("blocked"));
    }

    // If no key on server, return fallback (so it never crashes)
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json(safeFallbackResult("missing_key"));
    }

    const result = await judgeWithOpenAI(payload);
    return res.status(200).json(result);
  } catch (err) {
    console.error("judge-result error:", err);
    return res.status(200).json(safeFallbackResult("server_error"));
  }
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, "0.0.0.0", () => {
  console.log(`JudgeMirror backend running on port ${port}`);
});
