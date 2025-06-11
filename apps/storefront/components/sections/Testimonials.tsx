import { User, Star } from 'lucide-react';
// import { motion } from 'framer-motion'; // Uncomment if framer-motion is available

const testimonials = [
  {
    name: 'Sarah M.',
    avatar: '', // Use random avatar or leave blank for icon
    rating: 5,
    quote: 'Absolutely love shopping here! The products always arrive quickly and the quality is fantastic. Highly recommend to everyone.',
  },
  {
    name: 'James L.',
    avatar: '',
    rating: 5,
    quote: 'Customer service is top-notch. I had an issue with my order and it was resolved within hours. Will shop again!',
  },
  {
    name: 'Priya S.',
    avatar: '',
    rating: 5,
    quote: 'Great selection and amazing deals. The website is easy to use and checkout is a breeze.',
  },
  {
    name: 'Carlos R.',
    avatar: '',
    rating: 5,
    quote: 'I found exactly what I needed and the prices were unbeatable. Five stars from me!',
  },
  {
    name: 'Emily T.',
    avatar: '',
    rating: 5,
    quote: 'The best online shopping experience I have had in years. Fast shipping and excellent products.',
  },
];

export function Testimonials() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">What our customers say</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            // For animation, wrap in <motion.div ...> if framer-motion is installed
            <div
              key={i}
              className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center transition-transform hover:scale-[1.02]"
            >
              <div className="mb-4">
                {t.avatar ? (
                  <img
                    src={t.avatar}
                    alt={`${t.name}'s profile picture`}
                    className="w-14 h-14 rounded-full object-cover border border-gray-200 mx-auto"
                  />
                ) : (
                  <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                    <User className="w-7 h-7" />
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center mb-2">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-0.5" />
                ))}
              </div>
              <div className="font-semibold text-gray-900 mb-1">{t.name}</div>
              <blockquote className="text-gray-600 text-sm leading-relaxed mt-1">“{t.quote}”</blockquote>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials; 