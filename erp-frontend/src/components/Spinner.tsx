import type { ReactNode } from 'react';

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="animate-spin rounded-full border-2 border-gray-200 border-t-brand-600"
      style={{ width: size, height: size }}
    />
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
