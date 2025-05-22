import { LucideIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

// Define card variants for different color schemes
const cardVariants = cva(
  // Base styles
  "relative overflow-hidden rounded-lg bg-white p-6 shadow",
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
      <div className="flex justify-between">
        {/* Label and value section */}
        <div>
          <p className="text-sm font-medium leading-6 text-gray-600">
            {label}
          </p>
          <p className="mt-2 flex items-baseline gap-x-2">
            <span className="text-3xl font-semibold tracking-tight text-gray-900">
              {value}
            </span>
            {changePct !== undefined && (
              <span
                className={`text-sm ${
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
          </p>
        </div>

        {/* Icon section */}
        {Icon && (
          <div className="flex items-center">
            <Icon
              className={`h-12 w-12 ${
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