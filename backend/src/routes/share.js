import { Router } from "express";
import { randomUUID, randomBytes } from "node:crypto";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../lib/errors.js";

const router = Router();

// Create a shareable request or collection snapshot
router.post("/", asyncHandler(async (req, res) => {
  const { snapshot, type = "request" } = req.body || {};

  if (!snapshot || typeof snapshot !== "object") {
    return res.status(400).json({
      error: "A valid snapshot is required."
    });
  }

  if (!["request", "collection"].includes(type)) {
    return res.status(400).json({
      error: "Type must be request or collection."
    });
  }

  const token = randomBytes(24).toString("hex");
  const id = randomUUID();

  // Share links expire after 30 days
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  );

  const savedSnapshot = {
    type,
    ...snapshot
  };

  await pool.query(
    `INSERT INTO shared_links
      (id, token, snapshot, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [id, token, JSON.stringify(savedSnapshot), expiresAt]
  );

  const frontendOrigin =
  req.get("origin") ||
  process.env.FRONTEND_URL ||
  "http://localhost:3001";

const shareUrl = `${frontendOrigin}/share/${token}`;
const apiUrl = `http://localhost:5000/api/share/${token}`;

const curlCommand = `curl.exe "${apiUrl}"`;

  res.status(201).json({
    success: true,
    token,
    shareUrl,
    apiUrl,
    curlCommand,
    expiresAt
  });
}));

// Retrieve a shared snapshot
router.get("/:token", asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT snapshot, expires_at
     FROM shared_links
     WHERE token = $1
     AND (expires_at IS NULL OR expires_at > NOW())`,
    [req.params.token]
  );

  if (!rows.length) {
    return res.status(404).json({
      error: "This share link is invalid or expired."
    });
  }

  res.json({
    success: true,
    snapshot: rows[0].snapshot,
    expiresAt: rows[0].expires_at
  });
}));

export default router;
