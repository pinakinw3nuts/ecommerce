import Link from 'next/link';
import { Button } from '../ui/Button';
// import { motion } from 'framer-motion'; // Uncomment if framer-motion is available

export function PromoBanner() {
  // For animation, wrap section in <motion.section ...> if framer-motion is installed
  return (
    <section className="w-full py-16 px-4 flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-4xl w-full text-center flex flex-col items-center">
        <div className="bg-[#4285F4] text-white py-6 px-8 mb-4 w-full md:w-auto">
          <h2 className="text-3xl sm:text-4xl font-bold">Summer Sale – Up to 50% Off</h2>
        </div>
        
        <div className="bg-[#4285F4] text-white py-2 px-6 mb-8">
          <p className="text-lg">Limited time only. Don't miss out on our hottest deals!</p>
        </div>
        
        <Button 
          asChild 
          className="bg-black text-white hover:bg-black/90 px-8 py-3 rounded-none"
        >
          <Link href="/products?sale=true">Shop Now</Link>
        </Button>
      </div>
    </section>
  );
}

export default PromoBanner; 