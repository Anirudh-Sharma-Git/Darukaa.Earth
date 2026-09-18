import apiClient from "./client";

export async function registerUser(data) {
  const response = await apiClient.post("/api/v1/auth/register", data);
  return response.data;
}

export async function loginUser(data) {
  const response = await apiClient.post("/api/v1/auth/login", data);
  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get("/api/v1/auth/me");
  return response.data;
}
