import { Loader2 } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
  centered?: boolean;
  inline?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

const LoadingSpinner = ({
  size = "md",
  message,
  className,
  centered = true,
  inline = false,
}: LoadingSpinnerProps) => {
  const spinner = (
    <Loader2
      className={cn(
        "animate-spin text-indigo-600",
        sizeClasses[size],
        className
      )}
    />
  );

  if (inline) {
    return (
      <div className="inline-flex items-center gap-2">
        {spinner}
        {message && <span className="text-sm text-gray-500">{message}</span>}
      </div>
    );
  }

  if (centered) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-2">
          {spinner}
          {message && <span className="text-gray-500">{message}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {spinner}
      {message && <span className="text-gray-500">{message}</span>}
    </div>
  );
};

export default LoadingSpinner;

// Specialized loading components for common patterns
export const TableLoadingSpinner = ({
  message = "Loading data...",
}: {
  message?: string;
}) => (
  <div className="flex justify-center items-center py-12">
    <LoadingSpinner size="lg" message={message} />
  </div>
);

export const PageLoadingSpinner = ({
  message = "Loading...",
}: {
  message?: string;
}) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" message={message} />
  </div>
);

export const ButtonLoadingSpinner = ({ message }: { message?: string }) => (
  <LoadingSpinner size="sm" message={message} inline />
);

export const ModalLoadingSpinner = ({
  message = "Processing...",
}: {
  message?: string;
}) => (
  <div className="flex items-center justify-center py-6">
    <LoadingSpinner size="md" message={message} />
  </div>
);
