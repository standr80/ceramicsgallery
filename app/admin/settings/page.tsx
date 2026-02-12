import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsForm } from "@/components/SettingsForm";

export default async function AdminSettingsPage() {
  const admin = createAdminClient();
  const { data: defaultRow } = await admin
    .from("settings")
    .select("value")
    .eq("key", "default_commission_percent")
    .single();

  const defaultCommissionPercent = defaultRow
    ? parseFloat(defaultRow.value)
    : 10;

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-clay-900 mb-4">
        Settings
      </h2>
      <SettingsForm
        defaultCommissionPercent={
          isNaN(defaultCommissionPercent) ? 10 : defaultCommissionPercent
        }
      />
    </div>
  );
}
