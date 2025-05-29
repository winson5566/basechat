export default function WarningMessage({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
      <p className="text-yellow-800">{children}</p>
    </div>
  );
}
