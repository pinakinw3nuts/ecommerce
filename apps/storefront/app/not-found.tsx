import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold mb-2">404 – Page Not Found</h1>
      <p className="text-gray-600 mb-6">Sorry, we couldn't find the page you were looking for.</p>
      <Link href="/" className="text-blue-600 underline text-sm">← Go back to homepage</Link>
    </div>
  );
} 