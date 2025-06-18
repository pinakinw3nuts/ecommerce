import axios from '../lib/api';

const COMPANY_SERVICE_URL = process.env.NEXT_PUBLIC_COMPANY_SERVICE_URL || 'http://localhost:3012/api/v1';

export const fetchCompanyInfo = async (companyId: string) => {
  return axios.get(`${COMPANY_SERVICE_URL}/companies/${companyId}`);
};

export const fetchCompanyBranches = async (companyId: string) => {
  return axios.get(`${COMPANY_SERVICE_URL}/companies/${companyId}/branches`);
};

export const fetchCompanyEmployees = async (companyId: string) => {
  return axios.get(`${COMPANY_SERVICE_URL}/companies/${companyId}/employees`);
}; 