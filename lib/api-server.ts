import axios from "axios";
import { siteConfig } from "@/config/site.config";

export const API_BASE_URL = siteConfig.apiBaseUrl;
export const apiServer = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});
