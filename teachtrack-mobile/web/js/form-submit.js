/**
 * PulseBox Web Form Viewer - Form Submission Handler
 * 
 * This file handles form submission, validation, and API calls.
 * Modify the API_ENDPOINT to point to your backend.
 */

class FormSubmitter {
  constructor(formRenderer, formId) {
    this.formRenderer = formRenderer;
    this.formId = formId;
    this.apiEndpoint = this.getApiEndpoint();
  }

  /**
   * Get API endpoint from environment or default
   * Modify this to point to your backend API
   */
  getApiEndpoint() {
    // Option 1: Use environment variable (for production)
    // return process.env.API_ENDPOINT || 'https://api.pulsebox.app';
    
    // Option 2: Use relative path (for same domain)
    // return '/api';
    
    // Option 3: Use full URL (modify this)
    return 'https://api.pulsebox.app/submit'; // CHANGE THIS TO YOUR API ENDPOINT
    
    // Option 4: For local development
    // return 'http://localhost:3000/api/submit';
  }

  /**
   * Handle form submission
   */
  async submitForm() {
    // Validate form
    if (!this.formRenderer.validate()) {
      this.scrollToFirstError();
      return false;
    }

    const submitButton = document.getElementById('submit-button');
    if (!submitButton) return false;

    // Show loading state
    this.setLoadingState(submitButton, true);

    try {
      const formValues = this.formRenderer.getFormValues();
      
      // Prepare submission data
      const submissionData = {
        formId: this.formId,
        answers: formValues,
        submittedAt: new Date().toISOString(),
      };

      // Submit to API
      const response = await this.sendToAPI(submissionData);

      if (response.success) {
        this.showSuccessPage();
      } else {
        throw new Error(response.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      this.showError(error.message || 'Failed to submit form. Please try again.');
      this.setLoadingState(submitButton, false);
      return false;
    }
  }

  /**
   * Send form data to API
   */
  async sendToAPI(data) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Show success/thank you page
   */
  showSuccessPage() {
    const formWrapper = document.getElementById('form-wrapper');
    if (!formWrapper) return;

    formWrapper.innerHTML = `
      <div class="thank-you-container">
        <div class="thank-you-icon">✅</div>
        <h1 class="thank-you-title">Thank You!</h1>
        <p class="thank-you-message">
          Your response has been submitted successfully. We appreciate your feedback!
        </p>
      </div>
    `;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Show error message
   */
  showError(message) {
    // You can customize this to show a toast notification or alert
    alert(message); // Simple alert - replace with better UI
    
    // Alternative: Show error banner at top of form
    // this.showErrorBanner(message);
  }

  /**
   * Show error banner (alternative to alert)
   */
  showErrorBanner(message) {
    const formWrapper = document.getElementById('form-wrapper');
    if (!formWrapper) return;

    // Remove existing error banner if any
    const existingBanner = document.getElementById('error-banner');
    if (existingBanner) {
      existingBanner.remove();
    }

    const errorBanner = document.createElement('div');
    errorBanner.id = 'error-banner';
    errorBanner.style.cssText = `
      background-color: var(--color-error);
      color: var(--color-text-inverse);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-lg);
      text-align: center;
    `;
    errorBanner.textContent = message;

    formWrapper.insertBefore(errorBanner, formWrapper.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      errorBanner.remove();
    }, 5000);
  }

  /**
   * Set loading state on submit button
   */
  setLoadingState(button, isLoading) {
    if (isLoading) {
      button.disabled = true;
      button.classList.add('loading');
      button.innerHTML = '<span class="loading-spinner"></span> Submitting...';
    } else {
      button.disabled = false;
      button.classList.remove('loading');
      button.textContent = 'Submit Form';
    }
  }

  /**
   * Scroll to first error field
   */
  scrollToFirstError() {
    const firstError = document.querySelector('.field-error[style*="display: block"]');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormSubmitter;
}


