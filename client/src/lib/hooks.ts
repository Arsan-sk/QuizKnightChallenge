import { useState, useCallback } from 'react';

// Simple toast interface that uses window.alert instead of a UI component
export function useToast() {
  const toast = useCallback(({ title, description }: { title?: string; description?: string; variant?: string }) => {
    const message = title ? (description ? `${title}: ${description}` : title) : description;
    if (message) {
      window.alert(message);
    }
  }, []);

  return { toast };
} 