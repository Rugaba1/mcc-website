import axios from "axios";
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
export const apiServer = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});
