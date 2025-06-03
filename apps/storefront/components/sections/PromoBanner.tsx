import Link from 'next/link';
import { Button } from '../ui/Button';
// import { motion } from 'framer-motion'; // Uncomment if framer-motion is available

export function PromoBanner() {
  // For animation, wrap section in <motion.section ...> if framer-motion is installed
  return (
    <section
      className="w-full bg-primary text-white py-12 px-4 flex items-center justify-center"
      // as={motion.section} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}
    >
      <div className="max-w-2xl w-full text-center flex flex-col items-center gap-4">
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">Summer Sale – Up to 50% Off</h2>
        <p className="text-lg opacity-90 mb-6">Limited time only. Don't miss out on our hottest deals!</p>
        <Button asChild size="lg" className="px-8 py-3 text-base font-semibold">
          <Link href="/products">Shop Now</Link>
        </Button>
      </div>
    </section>
  );
}

export default PromoBanner; 