# Shopfinity E-commerce Storefront

A modern e-commerce storefront built with Next.js, TypeScript, and Tailwind CSS.

## Project Structure

```
apps/storefront/
├── app/                  # Next.js App Router pages
│   ├── api/              # API routes
│   ├── cart/             # Cart page
│   ├── checkout/         # Checkout flow
│   ├── products/         # Product listings and details
│   └── layout.tsx        # Root layout
├── components/           # Reusable components
│   ├── icons/            # SVG icon components
│   ├── layout/           # Layout components (Header, Footer)
│   ├── ui/               # UI components (Button, Input, etc.)
│   └── cart/             # Cart-specific components
├── contexts/             # React contexts
│   └── CartContext.tsx   # Shopping cart state management
├── lib/                  # Utility functions and libraries
├── public/               # Static assets
└── styles/               # Global styles
```

## Features

- Modern UI with responsive design
- Cart functionality with localStorage persistence
- Checkout flow with address management
- Product catalog with search and filtering
- Dynamic product pages

## Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Technologies

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Context API for state management

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
