import { redirect } from 'next/navigation';

export default function AccountPage() {
  // Redirect to the profile section by default
  redirect('/account/profile');
} 