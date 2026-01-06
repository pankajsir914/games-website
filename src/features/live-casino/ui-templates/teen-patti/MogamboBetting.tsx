// src/pages/tables/MogamboBetting.tsx

import { useMemo, useState } from "react";
import { Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ================= TYPES ================= */

interface MogamboBettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
}

/* ================= HELPERS ================= */

const isSuspended = (b: any) =>
  !b || b?.gstatus === "SUSPENDED";

const byNat = (bets: any[], nat: string) =>
  bets.find(
    (b) => (b.nat || "").toLowerCase() === nat.toLowerCase()
  );

/* ================= COMPONENT ================= */

export const MogamboBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
}: MogamboBettingProps) => {
  /* ---------- BETS ---------- */

  const mogambo = byNat(betTypes, "Mogambo");
  const dagaTeja = byNat(betTypes, "Daga / Teja");
  const cardTotal = byNat(betTypes, "3 Card Total");

  /* ---------- MODAL STATE ---------- */

  const [open, setOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [stake, setStake] = useState("");

  /* ---------- OPEN MODAL ---------- */

  const openModal = (bet: any) => {
    if (isSuspended(bet)) return;
    setSelectedBet(bet);
    setStake("");
    setOpen(true);
  };

  /* ---------- SUBMIT ---------- */

  const submitBet = async () => {
    if (!selectedBet || !stake) return;

    await onPlaceBet({
      sid: selectedBet.sid,
      stake: Number(stake),
      odds: selectedBet.b,
      nat: selectedBet.nat,
    });

    setOpen(false);
  };

  /* ---------- QUICK STAKES ---------- */

  const quickStakes = [25, 50, 100, 200, 500, 1000];

  /* ================= UI ================= */

  return (
    <>
      {/* ================= MAIN BETS ================= */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* DAGA / TEJA */}
        <button
          onClick={() => openModal(dagaTeja)}
          className={`p-2 text-sm rounded border flex justify-between items-center
            ${
              isSuspended(dagaTeja)
                ? "bg-gray-200 text-gray-500"
                : "bg-blue-100 hover:bg-blue-200"
            }`}
        >
          <span>Daga / Teja</span>
          <span className="font-bold">
            {isSuspended(dagaTeja) ? (
              <Lock size={14} />
            ) : (
              dagaTeja?.b?.toFixed(2)
            )}
          </span>
        </button>

        {/* MOGAMBO */}
        <button
          onClick={() => openModal(mogambo)}
          className={`p-2 text-sm rounded border flex justify-between items-center
            ${
              isSuspended(mogambo)
                ? "bg-gray-200 text-gray-500"
                : "bg-blue-100 hover:bg-blue-200"
            }`}
        >
          <span>Mogambo</span>
          <span className="font-bold">
            {isSuspended(mogambo) ? (
              <Lock size={14} />
            ) : (
              mogambo?.b?.toFixed(2)
            )}
          </span>
        </button>
      </div>

      {/* ================= 3 CARD TOTAL ================= */}
      <button
        onClick={() => openModal(cardTotal)}
        className={`w-full p-2 mb-3 text-sm rounded border flex justify-between items-center
          ${
            isSuspended(cardTotal)
              ? "bg-gray-200 text-gray-500"
              : "bg-pink-100 hover:bg-pink-200"
          }`}
      >
        <span>3 Card Total</span>
        <span className="font-bold">
          {isSuspended(cardTotal) ? (
            <Lock size={14} />
          ) : (
            cardTotal?.b
          )}
        </span>
      </button>

      {/* ================= BET MODAL ================= */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="bg-slate-800 text-white px-4 py-2 flex flex-row justify-between items-center">
            <DialogTitle className="text-sm">
              Place Bet
            </DialogTitle>
            <button onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </DialogHeader>

          <div className="bg-pink-200 p-3 text-sm">
            <div className="flex justify-between mb-2">
              <span>{selectedBet?.nat}</span>
              <span>Range: {selectedBet?.min} to {selectedBet?.max}</span>
            </div>

            {/* INPUTS */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Input
                disabled
                value={selectedBet?.b || ""}
                placeholder="Odds"
              />
              <Input
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="Stake"
              />
              <Input
                disabled
                value={
                  stake && selectedBet
                    ? (Number(stake) * selectedBet.b).toFixed(2)
                    : ""
                }
                placeholder="Profit"
              />
            </div>

            {/* QUICK STAKES */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {quickStakes.map((v) => (
                <button
                  key={v}
                  onClick={() => setStake(String(v))}
                  className="bg-gray-300 py-1 rounded text-xs hover:bg-gray-400"
                >
                  +{v}
                </button>
              ))}
            </div>

            {/* ACTIONS */}
            <div className="flex justify-between items-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStake("")}
              >
                Reset
              </Button>

              <Button
                size="sm"
                disabled={loading}
                onClick={submitBet}
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
