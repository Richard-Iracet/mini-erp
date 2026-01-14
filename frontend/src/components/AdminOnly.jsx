import { isAdmin } from "../utils/permissions";

export default function AdminOnly({ children, fallback = null }) {
  if (!isAdmin()) return fallback;
  return children;
}
