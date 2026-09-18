import apiClient from "./client";

export async function getSites(projectId) {
  const response = await apiClient.get(
    `/api/v1/projects/${projectId}/sites`,
  );
  return response.data;
}

export async function createSite(projectId, data) {
  const response = await apiClient.post(
    `/api/v1/projects/${projectId}/sites`,
    data,
  );
  return response.data;
}