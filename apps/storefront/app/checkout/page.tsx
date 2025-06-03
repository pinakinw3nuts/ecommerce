import { redirect } from 'next/navigation';

export default function CheckoutPage() {
  // Redirect to the first step of the checkout process
  redirect('/checkout/address');
  
  // This won't be rendered, but Next.js requires a component to be returned
  return null;
} 