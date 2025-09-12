import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useViewFromUrl(onViewChange: (view: string) => void) {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const view = searchParams.get('view');
    if (view) {
      onViewChange(view);
    }
  }, [searchParams, onViewChange]);
}