export default function Spinner({ className = '' }) {
  return (
    <div
      className={`h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
