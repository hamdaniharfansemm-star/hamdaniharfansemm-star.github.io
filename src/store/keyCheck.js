// Tiny helper shared by the store and the admin (no data imports).
/** Never use a secret / service-role key in the browser. */
export function isSecretKey(k = "") {
  if (/^sb_secret_/i.test(k)) return true;
  if (/^eyJ/.test(k)) {
    try {
      const payload = JSON.parse(atob(k.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.role === "service_role";
    } catch {
      return false;
    }
  }
  return false;
}

