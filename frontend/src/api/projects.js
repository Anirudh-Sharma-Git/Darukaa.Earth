import apiClient from "./client";

export async function getProjects() {
  const response = await apiClient.get("/api/v1/projects");
  return response.data;
}

export async function createProject(data) {
  const response = await apiClient.post("/api/v1/projects", data);
  return response.data;
}

export async function getProject(projectId) {
  const response = await apiClient.get(`/api/v1/projects/${projectId}`);
  return response.data;
}