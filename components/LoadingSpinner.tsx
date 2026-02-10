type LoadingSpinnerProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark" | "brand";
  stacked?: boolean;
  className?: string;
  labelClassName?: string;
  spinnerClassName?: string;
};

const SIZE_CLASSES: Record<NonNullable<LoadingSpinnerProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-12 w-12",
};

const TONE_CLASSES: Record<NonNullable<LoadingSpinnerProps["tone"]>, string> = {
  light: "text-white",
  dark: "text-gray-600",
  brand: "text-[#1E0B97]",
};

export default function LoadingSpinner({
  label,
  size = "md",
  tone = "brand",
  stacked = false,
  className = "",
  labelClassName = "",
  spinnerClassName = "",
}: LoadingSpinnerProps) {
  const layoutClass = stacked
    ? "flex flex-col items-center gap-4"
    : "inline-flex items-center gap-3";

  return (
    <div className={`${layoutClass} ${className}`.trim()}>
      <svg
        className={`animate-spin ${SIZE_CLASSES[size]} ${TONE_CLASSES[tone]} ${spinnerClassName}`.trim()}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {label ? <span className={labelClassName}>{label}</span> : null}
    </div>
  );
}
