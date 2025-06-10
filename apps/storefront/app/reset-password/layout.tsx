import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | Shopfinity',
  description: 'Create a new password for your Shopfinity account.',
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 