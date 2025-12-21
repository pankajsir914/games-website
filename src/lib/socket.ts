// src/lib/socket.ts

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getCasinoSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
    });
  }
  return socket;
};
   
