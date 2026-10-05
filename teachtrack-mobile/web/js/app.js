/**
 * PulseBox Web Form Viewer - Main Application
 * 
 * This file initializes the form viewer and handles form data fetching.
 * Modify the API_ENDPOINT to point to your backend for fetching form data.
 */

// Configuration
const CONFIG = {
  // API endpoint for fetching form data
  // Modify this to point to your backend
  API_ENDPOINT: 'https://api.pulsebox.app/form', // CHANGE THIS TO YOUR API ENDPOINT
  
  // Alternative: Use relative path
  // API_ENDPOINT: '/api/form',
  
  // Alternative: For local development
  // API_ENDPOINT: 'http://localhost:3000/api/form',
  
  // Get form ID from URL parameter (e.g., ?formId=abc123)
  getFormIdFromURL: () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('formId') || urlParams.get('id');
  },
  
  // Alternative: Get form ID from URL path (e.g., /form/abc123)
  getFormIdFromPath: () => {
    const path = window.location.pathname;
    const match = path.match(/\/form\/([^\/]+)/);
    return match ? match[1] : null;
  },
};

// Global instances
let formRenderer;
let formSubmitter;

/**
 * Initialize the application
 */
async function init() {
  try {
    // Get form ID from URL
    const formId = CONFIG.getFormIdFromURL() || CONFIG.getFormIdFromPath();
    
    if (!formId) {
      showError('Form ID not found in URL');
      return;
    }

    // Fetch form data
    const formData = await fetchFormData(formId);
    
    if (!formData) {
      showError('Form not found');
      return;
    }

    // Initialize form renderer
    formRenderer = new FormRenderer(formData, 'form-wrapper');
    formRenderer.render();

    // Initialize form submitter
    formSubmitter = new FormSubmitter(formRenderer, formId);

    // Attach submit handler
    attachSubmitHandler();

    // Hide loading
    hideLoading();
  } catch (error) {
    console.error('Initialization error:', error);
    showError('Failed to load form. Please try again later.');
  }
}

/**
 * Fetch form data from API
 */
async function fetchFormData(formId) {
  try {
    const response = await fetch(`${CONFIG.API_ENDPOINT}/${formId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching form data:', error);
    
    // For development/testing: Use mock data if API fails
    // Remove this in production
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.warn('Using mock data for development');
      return getMockFormData(formId);
    }
    
    throw error;
  }
}

/**
 * Attach submit button handler
 */
function attachSubmitHandler() {
  const submitButton = document.getElementById('submit-button');
  if (submitButton) {
    submitButton.addEventListener('click', async (e) => {
      e.preventDefault();
      await formSubmitter.submitForm();
    });
  }

  // Also handle form submission via Enter key in form
  const formWrapper = document.getElementById('form-wrapper');
  if (formWrapper) {
    formWrapper.addEventListener('submit', async (e) => {
      e.preventDefault();
      await formSubmitter.submitForm();
    });
  }
}

/**
 * Show error message
 */
function showError(message) {
  const formWrapper = document.getElementById('form-wrapper');
  if (!formWrapper) return;

  hideLoading();

  formWrapper.innerHTML = `
    <div style="text-align: center; padding: 48px;">
      <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
      <h2 style="color: var(--color-error); margin-bottom: 12px;">Error</h2>
      <p style="color: var(--color-text-secondary);">${message}</p>
    </div>
  `;
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.remove();
  }
}

/**
 * Mock form data for development/testing
 * Remove this function in production
 */
function getMockFormData(formId) {
  return {
    id: formId,
    name: 'Sample Feedback Form',
    description: 'Please provide your feedback using the form below.',
    answers: [
      {
        id: 'q1',
        type: 'text',
        question: 'What is your name?',
        required: true,
        placeholder: 'Enter your name',
      },
      {
        id: 'q2',
        type: 'email',
        question: 'What is your email?',
        required: true,
        placeholder: 'your.email@example.com',
      },
      {
        id: 'q3',
        type: 'rating',
        question: 'How would you rate your experience?',
        required: true,
        maxRating: 5,
      },
      {
        id: 'q4',
        type: 'multiple-choice',
        question: 'What is your preferred contact method?',
        required: false,
        options: ['Email', 'Phone', 'SMS', 'WhatsApp'],
      },
      {
        id: 'q5',
        type: 'long-text',
        question: 'Any additional comments?',
        required: false,
        placeholder: 'Share your thoughts...',
      },
    ],
  };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


