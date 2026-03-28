export const dynamic = "force-dynamic";

import { getSettings } from "../actions/settings";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div style={{ padding: "40px 48px" }} className="fade-in">
      <div className="display-font" style={{ fontSize: "38px", fontWeight: 800, lineHeight: 1, letterSpacing: "0.01em", marginBottom: "8px" }}>
        SETTINGS
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "40px" }}>
        SMTP configuration and database backup.
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
