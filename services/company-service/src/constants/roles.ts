/**
 * Company service user roles
 */

// Define role constants as a string literal union type
export type CompanyRoleType = 
  | 'OWNER'       // Can manage company profile and all users
  | 'ADMIN'       // Can manage users and settings but not company profile
  | 'BUYER'       // Can place orders and manage product catalogs
  | 'FINANCE'     // Can manage invoices, payments, and credit
  | 'APPROVER'    // Can approve purchase orders and expenses
  | 'VIEWER';     // Read-only access to company data

// Define the roles as a string array for iteration
export const COMPANY_ROLES: CompanyRoleType[] = [
  'OWNER',
  'ADMIN',
  'BUYER',
  'FINANCE',
  'APPROVER',
  'VIEWER'
];

// Define role permissions map with role descriptions
export const ROLE_DESCRIPTIONS: Record<CompanyRoleType, string> = {
  'OWNER': 'Full access to manage company profile, users, and all operations',
  'ADMIN': 'Can manage users and settings but cannot modify company profile',
  'BUYER': 'Can browse products, create and manage orders',
  'FINANCE': 'Can manage invoices, payments, credit limits, and financial settings',
  'APPROVER': 'Can review and approve purchase orders and expenses',
  'VIEWER': 'Read-only access to company information and transactions'
};

// Export default role for new companies
export const DEFAULT_OWNER_ROLE: CompanyRoleType = 'OWNER';

// Export a function to check if a role has specific permissions
export function hasPermission(role: CompanyRoleType, requiredRole: CompanyRoleType): boolean {
  const roleHierarchy: Record<CompanyRoleType, number> = {
    'OWNER': 50,
    'ADMIN': 40,
    'FINANCE': 30,
    'APPROVER': 20,
    'BUYER': 10,
    'VIEWER': 0
  };

  return roleHierarchy[role] >= roleHierarchy[requiredRole];
}

/**
 * Enum for company user roles - used in entity definition
 */
export enum CompanyRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  BUYER = 'BUYER',
  FINANCE = 'FINANCE',
  APPROVER = 'APPROVER',
  VIEWER = 'VIEWER'
} 