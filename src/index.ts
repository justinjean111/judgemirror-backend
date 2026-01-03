import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { limiter } from "./rateLimit";
import { JudgePayloadSchema } from "./schema";
import { judgeWithOpenAI } from "./openai";
import { safeGenericResult } from "./safety";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: "200kb" }));
app.use(limiter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/judge-result", async (req, res) => {
  const parsed = JudgePayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  // If key missing, return safe fallback (so your app still works)
  if (!process.env.OPENAI_API_KEY) {
    return res.json(safeGenericResult());
  }

  const result = await judgeWithOpenAI(parsed.data);
  return res.json(result);
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`JudgeMirror backend running on :${port}`);
});
