import axios from "@/lib/api";
import { getToken, setToken } from "./TokenService";

export async function login(credentials: {
  email: string;
  password: string;
  device_name: string;
}) {
  const { data } = await axios.post("/mobile/login", credentials);
  await setToken(data.token);
}

export async function register(credentials: {
  username: string;
  tag: string;
  email: string;
  password: string;
  password_confirmation: string;
  device_name: string;
}) {
  const { data } = await axios.post("/mobile/register", {
    name: credentials.username,
    tag: credentials.tag,
    email: credentials.email,
    password: credentials.password,
    password_confirmation: credentials.password_confirmation,
    device_name: credentials.device_name,
  });
  await setToken(data.token);
  return data;
}

export async function logout() {
  await axios.post("/mobile/logout");
}

export async function loadUser() {
  const { data } = await axios.get("/user");
  return data.data;
}

export async function resendVerification(email: string) {
  await axios.post("/email/resend", { email });
}
