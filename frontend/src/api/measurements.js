import apiClient from "./client";

export async function getMeasurements(projectId, siteId) {
  const response = await apiClient.get(
    `/api/v1/projects/${projectId}/sites/${siteId}/measurements`,
  );

  return response.data;
}

export async function createMeasurement(projectId, siteId, data) {
  const response = await apiClient.post(
    `/api/v1/projects/${projectId}/sites/${siteId}/measurements`,
    data,
  );

  return response.data;
}