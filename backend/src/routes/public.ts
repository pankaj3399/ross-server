import express, { Request, Response } from "express";
import pool from "../config/database";
import { z } from "zod";

const router = express.Router();

const subscribeSchema = z.object({
  email: z.string().email(),
});

router.post("/subscribe", async (req: Request, res: Response) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const source = (req.headers["origin"] as string) || null;
  const userAgent = (req.headers["user-agent"] as string) || null;
  const ipHeader = (req.headers["x-forwarded-for"] as string) || "";
  const ip = (ipHeader.split(",")[0] || req.socket.remoteAddress || "").trim();

  try {
    const result = await pool.query(
      `INSERT INTO waitlist_emails (email, source, user_agent, ip)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [email, source, userAgent, ip],
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "You're already on the list!" });
    }

    return res.status(201).json({ message: "Subscription successful!" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to save email:", err);
    return res.status(500).json({ error: "Failed to save email" });
  }
});

export default router;

