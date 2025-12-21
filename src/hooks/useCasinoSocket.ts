import { useEffect, useRef, useState } from "react";
import { getCasinoSocket } from "@/lib/socket";
     
/**
 * Casino Socket Hook
 * - Handles timer, odds, bet status, result
 * - Safe socket cleanup
 * - Smooth local timer countdown
 */
export const useCasinoSocket = (tableId?: string) => {
  /* ================= TIMER ================= */
  const [timer, setTimer] = useState(0);
  const timerRunningRef = useRef(false);

  // Smooth local countdown (UI purpose only)
  useEffect(() => {
    if (!timerRunningRef.current || timer <= 0) return;

    const intervalId = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timer]);

  /* ================= BET STATUS ================= */
  const [betStatus, setBetStatus] = useState<"OPEN" | "CLOSED">("CLOSED");

  /* ================= ODDS ================= */
  const [odds, setOdds] = useState<any>(null);

  /* ================= RESULT ================= */
  const [result, setResult] = useState<any>(null);

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!tableId) return;

    const socket = getCasinoSocket();

    /* ---------- JOIN ROOM ---------- */
    socket.emit("join", { tableId });

    /* ---------- TIMER UPDATE ---------- */
    const onTimerUpdate = (payload: any) => {
      if (payload?.tableId !== tableId) return;

      const remaining = Number(payload?.remaining ?? 0);

      if (remaining > 0) {
        setTimer(remaining);
        timerRunningRef.current = true;
      } else {
        setTimer(0);
        timerRunningRef.current = false;
      }
    };

    /* ---------- BET STATUS ---------- */
    const onBetStatus = (payload: any) => {
      if (payload?.tableId !== tableId) return;
      setBetStatus(payload?.status === "OPEN" ? "OPEN" : "CLOSED");
    };

    /* ---------- ODDS UPDATE ---------- */
    const onOddsUpdate = (payload: any) => {
      if (payload?.tableId !== tableId) return;
      setOdds(payload?.data ?? null);
    };

    /* ---------- RESULT UPDATE ---------- */
    const onResultUpdate = (payload: any) => {
      if (payload?.tableId !== tableId) return;
      setResult(payload?.data ?? null);
    };

    /* ---------- REGISTER EVENTS ---------- */
    socket.on("timer:update", onTimerUpdate);
    socket.on("bet:status", onBetStatus);
    socket.on("odds:update", onOddsUpdate);
    socket.on("result:update", onResultUpdate);

    /* ---------- CLEANUP ---------- */
    return () => {
      socket.emit("leave", { tableId });

      socket.off("timer:update", onTimerUpdate);
      socket.off("bet:status", onBetStatus);
      socket.off("odds:update", onOddsUpdate);
      socket.off("result:update", onResultUpdate);
    };
  }, [tableId]);

  return {
    timer,
    betStatus,
    odds,
    result,
  };
};

/* =====================================================
   TABLE LIST SOCKET (GLOBAL REFRESH)
===================================================== */
export const useCasinoTableSocket = (onRefresh: () => void) => {
  useEffect(() => {
    const socket = getCasinoSocket();

    const onTableUpdate = () => {
      onRefresh();
    };

    socket.on("table:update", onTableUpdate);

    return () => {
      socket.off("table:update", onTableUpdate);
    };
  }, [onRefresh]);
};
