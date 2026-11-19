import jwt from "jsonwebtoken";
import database from "../config/database.js";
import { initializeModels } from "../models/index.js";

const { Account, Role } = initializeModels(database);

export async function requireAdmin(request, response, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return response.status(503).json({
      error: "Admin authentication is not configured (JWT_SECRET is required)",
    });
  }

  const authorization = request.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return response.status(401).json({ error: "Bearer token is required" });
  }

  let payload;
  try {
    payload = jwt.verify(match[1], secret);
  } catch {
    return response.status(401).json({ error: "Invalid or expired token" });
  }

  if (!payload || typeof payload !== "object") {
    return response.status(401).json({ error: "Invalid token payload" });
  }

  const accountId = Number(payload.sub ?? payload.id);
  if (!Number.isInteger(accountId) || accountId < 1) {
    return response.status(401).json({ error: "Token does not identify an account" });
  }

  try {
    const account = await Account.findByPk(accountId, {
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
    });

    if (!account || !account.isActive) {
      return response.status(401).json({ error: "Account is not active" });
    }

    if (account.role?.name !== "Admin") {
      return response.status(403).json({ error: "Administrator access is required" });
    }

    request.account = account;
    return next();
  } catch (error) {
    console.error("Administrator authentication failed:", error);
    return response.status(500).json({ error: "Could not authenticate administrator" });
  }
}
