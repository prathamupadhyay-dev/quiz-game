import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading content' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[260px]">
      <Loader2 size={36} strokeWidth={1.75} className="animate-spin text-accent mb-4" />
      <p className="text-subheadline text-label-2 font-medium">{message}</p>
    </div>
  );
}
