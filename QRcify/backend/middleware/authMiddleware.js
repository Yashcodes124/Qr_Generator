import { verifyAuthToken } from "../utils/authUtils.js";
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];

  try {
    req.user = verifyAuthToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token or expired" });
  }
}
