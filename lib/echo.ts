import Echo from "laravel-echo";
import Pusher from "pusher-js";
// import { Pusher } from "@pusher/pusher-websocket-react-native";
import type { Channel } from "pusher-js";
import axios from "./api";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

const initializeEcho = () => {
  global.Pusher = Pusher;

  return new Echo({
    broadcaster: "reverb",
    key: "a0vzxemyeuf7lrjvrrhd",
    wsHost: "localhost",
    wsPort: 8080,
    wssPort: 8080,
    forceTLS: false,
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
