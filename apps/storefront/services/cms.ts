import { createApiClient } from '../lib/apiClient';

const cmsServiceApi = createApiClient(process.env.NEXT_PUBLIC_CMS_SERVICE_URL || 'http://localhost:3015/api/v1');

export const fetchContent = async (slug: string) => {
  return cmsServiceApi.get(`/content/${slug}`);
};

export const fetchAllContent = async () => {
  return cmsServiceApi.get('/content');
};

export const createContent = async (contentData: any) => {
  return cmsServiceApi.post('/content', contentData);
};

export const updateContent = async (slug: string, contentData: any) => {
  return cmsServiceApi.put(`/content/${slug}`, contentData);
};

export const deleteContent = async (slug: string) => {
  return cmsServiceApi.delete(`/content/${slug}`);
}; 