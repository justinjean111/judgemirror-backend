import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 60_000,
  max: 60, // 60 req / minute per IP (enough for MVP)
  standardHeaders: "draft-7",
  legacyHeaders: false
});
