import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 60_000,
  limit: 60, // 60 req/min per IP
  standardHeaders: true,
  legacyHeaders: false
});
