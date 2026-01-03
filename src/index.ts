import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimitMiddleware } from "./rateLimit";
import { isBlockedPayload, safeFallbackResult } from "./safety";
import { judgeWithOpenAI } from "./openai";
import { JudgePayloadSchema } from "./schema";

const app = express();

app.use(helmet());
app.use(cors({ origin: "*"}));
app.use(express.json({ limit: "200kb" }));
app.use(rateLimitMiddleware);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/judge-result", async (req, res) => {
  const parsed = JudgePayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  if (isBlockedPayload(parsed.data)) {
    return res.json(safeFallbackResult());
  }

  const result = await judgeWithOpenAI(parsed.data);
  return res.json(result);
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`JudgeMirror backend running on port ${port}`);
});
