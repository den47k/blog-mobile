import Echo from "laravel-echo";
import Pusher from "pusher-js";
import type { Channel } from "pusher-js";
import axios from "./api";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

const initializeEcho = () => {
  window.Pusher = Pusher;

  return new Echo({
    broadcaster: "reverb",
    key: process.env.EXPO_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.EXPO_PUBLIC_REVERB_HOST,
    wsPort: process.env.EXPO_PUBLIC_REVERB_PORT,
    wssPort: process.env.EXPO_PUBLIC_REVERB_PORT,
    forceTLS: (process.env.EXPO_PUBLIC_REVERB_SCHEME ?? "https") === "https",
    enabledTransports: ["ws", "wss"],
    authorizer: (channel: Channel, options: any) => {
      return {
        authorize: (
          socketId: string,
          callback: (error: Error | null, data?: any) => void,
        ) => {
          axios
            .post("/broadcasting/auth", {
              socket_id: socketId,
              channel_name: channel.name,
            })
            .then((response) => {
              callback(null, response.data);
            })
            .catch((error) => {
              callback(error);
            });
        },
      };
    },
  });
};

const echo = initializeEcho();
export default echo;
