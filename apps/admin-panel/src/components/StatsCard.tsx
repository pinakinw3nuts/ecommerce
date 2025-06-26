import { LucideIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

// Define card variants for different color schemes
const cardVariants = cva(
  // Base styles
  "relative overflow-hidden rounded-lg bg-white p-4 sm:p-6 shadow",
  {
    variants: {
      color: {
        default: "bg-white",
        blue: "bg-blue-50",
        green: "bg-green-50",
        yellow: "bg-yellow-50",
        red: "bg-red-50",
      }
    },
    defaultVariants: {
      color: "default"
    }
  }
);

interface StatsCardProps extends VariantProps<typeof cardVariants> {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  changePct?: number;
  className?: string;
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  changePct,
  color,
  className = "",
}: StatsCardProps) {
  // Determine if change percentage is positive, negative, or zero
  const isPositiveChange = changePct && changePct > 0;
  const isNegativeChange = changePct && changePct < 0;

  return (
    <div className={cardVariants({ color, className })}>
      <div className="flex justify-between items-center">
        {/* Label and value section */}
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium leading-6 text-gray-600 truncate">
            {label}
          </p>
          <div className="mt-1 sm:mt-2 flex items-baseline gap-x-1 sm:gap-x-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 truncate">
              {value}
            </span>
            {changePct !== undefined && (
              <span
                className={`text-xs sm:text-sm ${
                  isPositiveChange
                    ? "text-green-600"
                    : isNegativeChange
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {isPositiveChange && "+"}
                {changePct.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Icon section */}
        {Icon && (
          <div className="flex items-center ml-2">
            <Icon
              className={`h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 ${
                color === "default"
                  ? "text-gray-200"
                  : color === "blue"
                  ? "text-blue-200"
                  : color === "green"
                  ? "text-green-200"
                  : color === "yellow"
                  ? "text-yellow-200"
                  : "text-red-200"
              }`}
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Optional decorative element */}
      <div
        className="absolute bottom-0 left-0 w-full h-1"
        style={{
          background: `linear-gradient(to right, ${
            color === "blue"
              ? "#60A5FA"
              : color === "green"
              ? "#34D399"
              : color === "yellow"
              ? "#FBBF24"
              : color === "red"
              ? "#F87171"
              : "#E5E7EB"
          }, transparent)`,
          opacity: 0.3,
        }}
      />
    </div>
  );
} 