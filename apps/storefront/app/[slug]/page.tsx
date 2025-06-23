import api from '@lib/api';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

type CMSPage = {
  title: string;
  slug: string;
  content: { type: string; value: any }[];
  metaTitle: string;
  metaDesc: string;
  jsonLd?: string;
};

// Helper function to extract slug safely
async function extractSlug(params: { slug: string }): Promise<string> {
  // In case params is a Promise (though it shouldn't be in Next.js App Router)
  const resolvedParams = params;
  return resolvedParams?.slug || '';
}

export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  try {
    // Extract slug safely
    const slug = await extractSlug(params);
    
    // Fetch CMS data
    const { data }: { data: CMSPage } = await api.get(`/cms/${slug}`);
    
    return {
      title: data.metaTitle || data.title,
      description: data.metaDesc || '',
      openGraph: {
        title: data.metaTitle,
        description: data.metaDesc,
      },
      alternates: { canonical: `/${data.slug}` },
    };
  } catch {
    return {};
  }
}

export default async function CMSPageRenderer({ 
  params 
}: { 
  params: { slug: string } 
}) {
  try {
    // Extract slug safely
    const slug = await extractSlug(params);
    
    // Fetch CMS data
    const { data }: { data: CMSPage } = await api.get(`/cms/${slug}`);

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{data.title}</h1>

        {data.content.map((block, idx) => {
          switch (block.type) {
            case 'text':
              return (
                <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
                  {block.value}
                </p>
              );
            case 'image':
              return (
                <img key={idx} src={block.value.url} alt={block.value.alt} className="mb-6 rounded" />
              );
            case 'faq':
              return (
                <details key={idx} className="mb-4 border rounded p-4">
                  <summary className="font-semibold">{block.value.question}</summary>
                  <p className="text-sm mt-2 text-gray-600">{block.value.answer}</p>
                </details>
              );
            default:
              return null;
          }
        })}

        {data.jsonLd && (
          <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: data.jsonLd }} />
        )}
      </div>
    );
  } catch {
    notFound();
  }
} 