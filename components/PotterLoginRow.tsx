"use client";

import { useState } from "react";
import { resetPotterPassword, setForcePasswordReset } from "@/app/actions/admin";

interface PotterLoginRowProps {
  potterId: string;
  potterName: string;
  email: string;
  forcePasswordReset: boolean;
}

export function PotterLoginRow({
  potterId,
  potterName,
  email,
  forcePasswordReset,
}: PotterLoginRowProps) {
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(false);
    setResetting(true);
    const result = await resetPotterPassword(potterId, newPassword);
    setResetting(false);
    if (result && "error" in result) {
      setResetError(result.error);
    } else {
      setResetSuccess(true);
      setShowReset(false);
      setNewPassword("");
    }
  }

  return (
    <tr>
      <td className="px-4 py-3 text-sm font-medium text-stone-900">{potterName}</td>
      <td className="px-4 py-3 text-sm text-stone-600 font-mono">{email}</td>
      <td className="px-4 py-3">
        {!showReset ? (
          <button
            type="button"
            onClick={() => setShowReset(true)}
            className="text-sm font-medium text-clay-600 hover:text-clay-700"
          >
            Reset password
          </button>
        ) : (
          <form onSubmit={handleResetPassword} className="flex items-center gap-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              minLength={6}
              required
              className="input-field w-40 text-sm py-2"
            />
            <button
              type="submit"
              disabled={resetting}
              className="btn-primary text-sm py-2"
            >
              {resetting ? "Set…" : "Set"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReset(false);
                setNewPassword("");
                setResetError(null);
              }}
              className="text-sm text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>
          </form>
        )}
        {resetError && <p className="mt-1 text-xs text-red-600">{resetError}</p>}
        {resetSuccess && <p className="mt-1 text-xs text-green-600">Password updated.</p>}
      </td>
      <td className="px-4 py-3">
        <ForcePasswordResetCheckbox
          potterId={potterId}
          initialChecked={forcePasswordReset}
        />
      </td>
    </tr>
  );
}

function ForcePasswordResetCheckbox({
  potterId,
  initialChecked,
}: {
  potterId: string;
  initialChecked: boolean;
}) {
  const [checked, setChecked] = useState(initialChecked);
  const [updating, setUpdating] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newChecked = e.target.checked;
    setUpdating(true);
    await setForcePasswordReset(potterId, newChecked);
    setChecked(newChecked);
    setUpdating(false);
  }

  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={updating}
        className="h-4 w-4 rounded border-stone-300 text-clay-600 focus:ring-clay-500"
      />
      <span className="text-sm text-stone-700">Force password reset</span>
    </label>
  );
}
