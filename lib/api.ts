import axiosLib from "axios";
import { getToken } from "@/services/TokenService";
import echo from "./echo";

const axios = axiosLib.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    Accept: "application/json",
  },
});

axios.interceptors.request.use(async (req) => {
  const token = await getToken();

  if (token !== null) {
    req.headers["Authorization"] = `Bearer ${token}`;
  }

  if (echo.socketId()) {
    req.headers["X-Socket-ID"] = echo.socketId();
  }

  // if (req.data instanceof FormData) {
  //   req.headers["Content-Type"] = "multipart/form-data";
  // }

  return req;
});

export default axios;
