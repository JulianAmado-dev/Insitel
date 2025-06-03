import { createContext } from 'react';

// Create the context with a default value (optional, but good practice)
// The default value shape can hint at what the context will provide.
const FormStatusContext = createContext({
  formStatuses: {}, // Object to hold statuses of various forms/processes
  updateFormStatus: () => {}, // Placeholder for the update function
  // You might add more specific functions later, e.g., setFormLoading, setFormSuccess, etc.
});

export default FormStatusContext;
