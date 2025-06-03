import FormStatusContext from './FormStatusContext';
import { FormStatusProvider } from './FormStatusProvider';
import { useContext } from 'react';

// Custom hook for consuming the FormStatusContext
export const useFormStatus = () => {
  const context = useContext(FormStatusContext);
  if (context === undefined) {
    throw new Error('useFormStatus must be used within a FormStatusProvider');
  }
  return context;
};

export { FormStatusContext, FormStatusProvider };
