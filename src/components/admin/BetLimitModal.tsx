import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBetLimits } from "@/hooks/useBetLimits";

interface BetLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName?: string;
}

export const BetLimitModal: React.FC<BetLimitModalProps> = ({ open, onOpenChange, userId, userName }) => {
  const { data: limits, isLoading, refetch, setLimits, isSaving } = useBetLimits(userId);

  const [maxBet, setMaxBet] = useState<number | "">("");
  const [daily, setDaily] = useState<number | "">("");
  const [weekly, setWeekly] = useState<number | "">("");
  const [monthly, setMonthly] = useState<number | "">("");
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  useEffect(() => {
    if (limits) {
      setMaxBet(limits.max_bet_amount ?? "");
      setDaily(limits.daily_limit ?? "");
      setWeekly(limits.weekly_limit ?? "");
      setMonthly(limits.monthly_limit ?? "");
    }
  }, [limits]);

  const handleSave = () => {
    if (!maxBet || Number(maxBet) <= 0) return;
    setLimits({
      userId,
      maxBet: Number(maxBet),
      daily: daily === "" ? null : Number(daily),
      weekly: weekly === "" ? null : Number(weekly),
      monthly: monthly === "" ? null : Number(monthly),
      reason: reason || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Bet Limits {userName ? `for ${userName}` : ""}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxBet">Max single bet (₹)</Label>
              <Input
                id="maxBet"
                type="number"
                min={0}
                value={maxBet}
                onChange={(e) => setMaxBet(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily">Daily limit (₹)</Label>
              <Input
                id="daily"
                type="number"
                min={0}
                placeholder="Auto = 10x max"
                value={daily}
                onChange={(e) => setDaily(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weekly">Weekly limit (₹)</Label>
              <Input
                id="weekly"
                type="number"
                min={0}
                placeholder="Auto = 40x max"
                value={weekly}
                onChange={(e) => setWeekly(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly">Monthly limit (₹)</Label>
              <Input
                id="monthly"
                type="number"
                min={0}
                placeholder="Auto = 100x max"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input
              id="reason"
              placeholder="e.g., Risk control, VIP settings"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          {!isLoading && limits && (
            <p className="text-sm text-muted-foreground">
              Current: Max ₹{limits.max_bet_amount} • Daily ₹{limits.daily_limit ?? "auto"} • Weekly ₹{limits.weekly_limit ?? "auto"} • Monthly ₹{limits.monthly_limit ?? "auto"} {limits.is_custom ? "• Custom" : "• Default"}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || !maxBet}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
