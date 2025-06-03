import { useReducer, useCallback } from 'react';
import PropTypes from 'prop-types'; // Import PropTypes
import FormStatusContext from './FormStatusContext';

// Define initial state for form statuses
// Keys can be unique identifiers for forms or processes
const initialState = {
  // Example: 'form_general_project_123': 'pending'
  // For global processes like project creation:
  project_creation: 'pending', // Initial status for project creation
  // Add other global form/process statuses as needed
  // e.g., 'form_general': 'pending', 'form_alcance': 'pending'
};

// Define action types
const UPDATE_FORM_STATUS = 'UPDATE_FORM_STATUS';
// You could add more specific actions like:
// const SET_FORM_LOADING = 'SET_FORM_LOADING';
// const SET_FORM_SUCCESS = 'SET_FORM_SUCCESS';
// const SET_FORM_ERROR = 'SET_FORM_ERROR';

// Reducer function to manage state updates
function formStatusReducer(state, action) {
  switch (action.type) {
    case UPDATE_FORM_STATUS:
      return {
        ...state,
        [action.payload.formId]: action.payload.status,
      };
    // Handle other actions if defined
    // case SET_FORM_LOADING:
    //   return { ...state, [action.payload.formId]: 'in-progress' };
    // case SET_FORM_SUCCESS:
    //   return { ...state, [action.payload.formId]: 'completed' };
    // case SET_FORM_ERROR:
    //   return { ...state, [action.payload.formId]: 'error' };
    default:
      return state;
  }
}

// Provider component
export function FormStatusProvider({ children }) {
  const [formStatuses, dispatch] = useReducer(formStatusReducer, initialState);

  // Memoized function to update a form's status
  const updateFormStatus = useCallback((formId, status) => {
    dispatch({
      type: UPDATE_FORM_STATUS,
      payload: { formId, status },
    });
  }, []);

  // Value to be provided by the context
  const contextValue = {
    formStatuses,
    updateFormStatus,
  };

  return (
    <FormStatusContext.Provider value={contextValue}>
      {children}
    </FormStatusContext.Provider>
  );
}

// Add prop types validation
FormStatusProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
