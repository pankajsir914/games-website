// src/hooks/useCasinoSocket.ts   

import { useEffect, useRef, useState } from "react";
import { getCasinoSocket } from "@/lib/socket";


export const useCasinoTimerSocket = (tableId?: string) => {
  const [timer, setTimer] = useState(0);
  const runningRef = useRef(false);

  // local countdown
  useEffect(() => {
    if (!runningRef.current || timer <= 0) return;

    const id = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, [timer]);

  // socket
  useEffect(() => {
    if (!tableId) return;

    const socket = getCasinoSocket();
    socket.emit("join", { tableId });

    socket.on("timer:start", (payload: any) => {
      if (payload.tableId !== tableId) return;
      setTimer(payload.duration);
      runningRef.current = true;
    });

    return () => {
      socket.emit("leave", { tableId });
      socket.off("timer:start");
    };
  }, [tableId]);

  return { timer };
};


export const useCasinoBetStatusSocket = (
  tableId: string | undefined,
  setBetStatus: (v: "OPEN" | "CLOSED") => void
) => {
  useEffect(() => {
    if (!tableId) return;

    const socket = getCasinoSocket();
    socket.emit("join", { tableId });

    socket.on("bet:status", (payload: any) => {
      if (payload.tableId !== tableId) return;
      setBetStatus(payload.status);
    });

    return () => {
      socket.emit("leave", { tableId });
      socket.off("bet:status");
    };
  }, [tableId]);
};

export const useCasinoOddsSocket = (
  tableId: string | undefined,
  onUpdate: (data: any) => void
) => {
  useEffect(() => {
    if (!tableId) return;

    const socket = getCasinoSocket();
    socket.emit("join", { tableId });

    socket.on("odds:update", (payload: any) => {
      if (payload.tableId !== tableId) return;
      onUpdate(payload.data);
    });

    return () => {
      socket.emit("leave", { tableId });
      socket.off("odds:update");
    };
  }, [tableId]);
};


export const useCasinoResultSocket = (
  tableId: string | undefined,
  onUpdate: (data: any) => void
) => {
  useEffect(() => {
    if (!tableId) return;

    const socket = getCasinoSocket();
    socket.emit("join", { tableId });

    socket.on("result:update", (payload: any) => {
      if (payload.tableId !== tableId) return;
      onUpdate(payload.data);
    });

    return () => {
      socket.emit("leave", { tableId });
      socket.off("result:update");
    };
  }, [tableId]);
};


export const useCasinoTableSocket = (onRefresh: () => void) => {
  useEffect(() => {
    const socket = getCasinoSocket();

    socket.on("table:update", () => {
      onRefresh();
    });

    return () => {
      socket.off("table:update");
    };
  }, []);
};
