import { createApiClient } from '../lib/apiClient';

const companyServiceApi = createApiClient(process.env.NEXT_PUBLIC_COMPANY_SERVICE_URL || 'http://localhost:3012/api/v1');

export const fetchCompanyInfo = async (companyId: string) => {
  return companyServiceApi.get(`/companies/${companyId}`);
};

export const fetchCompanyBranches = async (companyId: string) => {
  return companyServiceApi.get(`/companies/${companyId}/branches`);
};

export const fetchCompanyEmployees = async (companyId: string) => {
  return companyServiceApi.get(`/companies/${companyId}/employees`);
}; 