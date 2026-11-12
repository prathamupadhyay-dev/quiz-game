import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title = 'No items found',
  description = 'There are currently no records to display.',
  actionLabel,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center content-card border-dashed">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center text-label-2 mb-4 border border-separator/40">
          <Icon size={28} strokeWidth={1.75} />
        </div>
      )}
      <h3 className="text-headline text-label mb-1">{title}</h3>
      <p className="text-subheadline text-label-2 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
