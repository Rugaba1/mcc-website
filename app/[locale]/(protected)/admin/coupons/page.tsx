"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage, type Coupon, type CouponInput } from "@/lib/api";
import { PERM } from "@/lib/permissions/catalog";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-picker";
import { generateCouponCode } from "@/lib/coupon-code";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormatters } from "@/contexts/format-context";

type CouponDraft = {
  code: string;
  description: string;
  type: Coupon["type"];
  value: string;
  minOrderAmount: string;
  maxUses: string;
  startsAt: string;
  expiresAt: string;
};

const emptyCoupon: CouponDraft = {
  code: "",
  description: "",
  type: "PERCENT",
  value: "",
  minOrderAmount: "",
  maxUses: "",
  startsAt: "",
  expiresAt: "",
};

export default function AdminCouponsPage() {
  const { money, date } = useFormatters();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [draft, setDraft] = useState<CouponDraft>(emptyCoupon);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getAdminCoupons();
      setCoupons(result.coupons);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not load coupons."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  async function createCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: CouponInput = {
        code: draft.code,
        description: draft.description.trim() || null,
        type: draft.type,
        value: Number(draft.value),
        minOrderAmount:
          draft.minOrderAmount === "" ? null : Number(draft.minOrderAmount),
        maxUses: draft.maxUses === "" ? null : Number(draft.maxUses),
        startsAt: draft.startsAt
          ? new Date(draft.startsAt).toISOString()
          : null,
        expiresAt: draft.expiresAt
          ? new Date(draft.expiresAt).toISOString()
          : null,
      };
      await api.createCoupon(payload);
      setDraft(emptyCoupon);
      toast.success("Coupon created.");
      await loadCoupons();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not create coupon."));
    } finally {
      setSaving(false);
    }
  }

  function generateCode() {
    try {
      setDraft((current) => ({ ...current, code: generateCouponCode() }));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not generate a secure coupon code.",
      );
    }
  }

  async function setActive(coupon: Coupon, active: boolean) {
    setSaving(true);
    try {
      await api.updateCoupon(coupon.id, { active });
      toast.success(`${coupon.code} ${active ? "activated" : "deactivated"}.`);
      await loadCoupons();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not update coupon."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl space-y-8">
      <header>
        <h2 className="text-2xl font-semibold">Coupons</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Create discount codes with minimum order, usage limits and scheduling.
          Discounts are applied to products before tax.
        </p>
      </header>

      <PermissionGate required={PERM.COUPONS_MANAGE} mode="hide">
        <form
          onSubmit={createCoupon}
          className="grid min-w-0 gap-5 border p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="min-w-0 space-y-2">
            <Label htmlFor="coupon-code">Code</Label>
            <div className="flex gap-2">
              <Input
                id="coupon-code"
                required
                minLength={2}
                maxLength={50}
                value={draft.code}
                onChange={(event) =>
                  setDraft({ ...draft, code: event.target.value.toUpperCase() })
                }
              />
              <Button
                type="button"
                variant="outline"
                aria-label="Generate secure coupon code"
                title="Generate secure coupon code"
                onClick={generateCode}
              >
                <RefreshCw />
              </Button>
            </div>
          </div>
          <div className="min-w-0 space-y-2 sm:col-span-2">
            <Label htmlFor="coupon-description">Description (optional)</Label>
            <Textarea
              id="coupon-description"
              maxLength={255}
              className="min-h-20"
              value={draft.description}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label>Discount type</Label>
            <Select
              value={draft.type}
              onValueChange={(type: Coupon["type"]) =>
                setDraft({ ...draft, type })
              }
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENT">Percentage</SelectItem>
                <SelectItem value="FIXED">Fixed amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="coupon-value">
              Value {draft.type === "PERCENT" ? "(%)" : "(base currency)"}
            </Label>
            <Input
              id="coupon-value"
              required
              type="number"
              min="0.01"
              max={draft.type === "PERCENT" ? "100" : undefined}
              step="0.01"
              value={draft.value}
              onChange={(event) =>
                setDraft({ ...draft, value: event.target.value })
              }
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="coupon-minimum">Minimum subtotal</Label>
            <Input
              id="coupon-minimum"
              type="number"
              min="0"
              step="0.01"
              value={draft.minOrderAmount}
              onChange={(event) =>
                setDraft({ ...draft, minOrderAmount: event.target.value })
              }
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="coupon-max-uses">Maximum uses</Label>
            <Input
              id="coupon-max-uses"
              type="number"
              min="1"
              step="1"
              value={draft.maxUses}
              onChange={(event) =>
                setDraft({ ...draft, maxUses: event.target.value })
              }
            />
          </div>
          <div className="min-w-0 space-y-2 lg:col-span-2">
            <Label htmlFor="coupon-starts">Starts at (optional)</Label>
            <DateTimePicker
              id="coupon-starts"
              placeholder="Choose start date"
              value={draft.startsAt}
              onChange={(startsAt) => setDraft({ ...draft, startsAt })}
            />
          </div>
          <div className="min-w-0 space-y-2 lg:col-span-2">
            <Label htmlFor="coupon-expires">Expires at (optional)</Label>
            <DateTimePicker
              id="coupon-expires"
              placeholder="Choose expiry date"
              value={draft.expiresAt}
              onChange={(expiresAt) => setDraft({ ...draft, expiresAt })}
            />
          </div>
          <div className="flex justify-end border-t pt-4 sm:col-span-2 lg:col-span-4">
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? <Loader2 className="animate-spin" /> : <Plus />}
              Create coupon
            </Button>
          </div>
        </form>
      </PermissionGate>

      <div className="overflow-x-auto border">
        <table className="w-full min-w-212.5 text-left text-sm">
          <thead className="bg-muted">
            <tr>
              {["Code", "Discount", "Minimum", "Usage", "Schedule", "Status", "Action"].map((heading) => (
                <th key={heading} className="p-3">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="mx-auto animate-spin" /></td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No coupons created yet.</td></tr>
            ) : coupons.map((coupon) => (
              <tr key={coupon.id} className="border-t">
                <td className="p-3">
                  <strong>{coupon.code}</strong>
                  {coupon.description && <p className="text-xs text-muted-foreground">{coupon.description}</p>}
                </td>
                <td className="p-3">
                  {coupon.type === "PERCENT" ? `${coupon.value}%` : money(coupon.value)}
                </td>
                <td className="p-3">{coupon.minOrderAmount === null ? "—" : money(coupon.minOrderAmount)}</td>
                <td className="p-3">{coupon.usedCount}{coupon.maxUses === null ? " / ∞" : ` / ${coupon.maxUses}`}</td>
                <td className="p-3">
                  <span>{coupon.startsAt ? date(coupon.startsAt) : "Now"}</span>
                  <span> – {coupon.expiresAt ? date(coupon.expiresAt) : "No expiry"}</span>
                </td>
                <td className="p-3">{coupon.active ? "Active" : "Inactive"}</td>
                <td className="p-3">
                  <PermissionGate required={PERM.COUPONS_MANAGE} mode="hide">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => void setActive(coupon, !coupon.active)}
                    >
                      {coupon.active ? "Deactivate" : "Activate"}
                    </Button>
                  </PermissionGate>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
