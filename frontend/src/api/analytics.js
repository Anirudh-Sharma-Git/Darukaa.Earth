import apiClient from "./client";

export async function getSiteAnalytics(siteId) {
  const response = await apiClient.get(`/api/v1/sites/${siteId}/analytics`);

  return response.data;
}
