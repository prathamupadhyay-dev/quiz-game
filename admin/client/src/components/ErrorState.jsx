import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this view.',
  onRetry
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center content-card border-red/30">
      <div className="w-16 h-16 rounded-full bg-red/10 flex items-center justify-center text-red mb-4 border border-red/20">
        <AlertCircle size={28} strokeWidth={1.75} />
      </div>
      <h3 className="text-headline text-label mb-1">{title}</h3>
      <p className="text-subheadline text-label-2 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="gap-2">
          <RotateCcw size={16} strokeWidth={1.75} />
          Retry
        </Button>
      )}
    </div>
  );
}
