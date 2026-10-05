/**
 * PulseBox Web Form Viewer - Form Renderer
 * 
 * This file handles rendering form fields dynamically based on form data.
 * It supports all field types: text, email, textarea, rating, multiple choice, checkbox.
 */

class FormRenderer {
  constructor(formData, containerId) {
    this.formData = formData;
    this.container = document.getElementById(containerId);
    this.formValues = {};
    this.errors = {};
  }

  /**
   * Render the entire form
   */
  render() {
    if (!this.container) {
      console.error('Form container not found');
      return;
    }

    // Render header
    this.renderHeader();
    
    // Render form fields
    this.renderFields();
    
    // Render submit button
    this.renderSubmitButton();
  }

  /**
   * Render form header (title and description)
   */
  renderHeader() {
    const header = document.createElement('div');
    header.className = 'form-header';
    
    const title = document.createElement('h1');
    title.className = 'form-title';
    title.textContent = this.formData.name || 'Form';
    
    header.appendChild(title);
    
    if (this.formData.description) {
      const description = document.createElement('p');
      description.className = 'form-description';
      description.textContent = this.formData.description;
      header.appendChild(description);
    }
    
    this.container.appendChild(header);
  }

  /**
   * Render all form fields
   */
  renderFields() {
    const section = document.createElement('div');
    section.className = 'form-section';
    
    if (!this.formData.answers || !Array.isArray(this.formData.answers)) {
      section.innerHTML = '<p>No fields available in this form.</p>';
      this.container.appendChild(section);
      return;
    }

    this.formData.answers.forEach((field, index) => {
      const fieldElement = this.renderField(field, index);
      if (fieldElement) {
        section.appendChild(fieldElement);
      }
    });
    
    this.container.appendChild(section);
  }

  /**
   * Render a single form field based on its type
   */
  renderField(field, index) {
    const fieldWrapper = document.createElement('div');
    fieldWrapper.className = 'form-field';
    fieldWrapper.setAttribute('data-field-id', field.id || index);
    
    // Create label
    const label = document.createElement('label');
    label.className = 'field-label';
    label.setAttribute('for', `field-${index}`);
    label.textContent = field.question || field.label || 'Question';
    
    if (field.required) {
      label.classList.add('required');
    }
    
    fieldWrapper.appendChild(label);
    
    // Render field based on type
    let inputElement;
    switch (field.type) {
      case 'text':
      case 'short-text':
        inputElement = this.renderTextInput(field, index);
        break;
      case 'long-text':
      case 'textarea':
        inputElement = this.renderTextarea(field, index);
        break;
      case 'email':
        inputElement = this.renderEmailInput(field, index);
        break;
      case 'number':
        inputElement = this.renderNumberInput(field, index);
        break;
      case 'rating':
        inputElement = this.renderRating(field, index);
        break;
      case 'multiple-choice':
      case 'mcq':
        inputElement = this.renderMultipleChoice(field, index);
        break;
      case 'checkbox':
        inputElement = this.renderCheckbox(field, index);
        break;
      default:
        inputElement = this.renderTextInput(field, index);
    }
    
    if (inputElement) {
      fieldWrapper.appendChild(inputElement);
    }
    
    // Add error container
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.id = `error-${index}`;
    errorDiv.style.display = 'none';
    fieldWrapper.appendChild(errorDiv);
    
    return fieldWrapper;
  }

  /**
   * Render text input field
   */
  renderTextInput(field, index) {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `field-${index}`;
    input.className = 'form-input';
    input.name = field.id || `field-${index}`;
    input.placeholder = field.placeholder || '';
    input.required = field.required || false;
    
    input.addEventListener('input', (e) => {
      this.formValues[input.name] = e.target.value;
      this.clearError(index);
    });
    
    return input;
  }

  /**
   * Render textarea field
   */
  renderTextarea(field, index) {
    const textarea = document.createElement('textarea');
    textarea.id = `field-${index}`;
    textarea.className = 'form-textarea';
    textarea.name = field.id || `field-${index}`;
    textarea.placeholder = field.placeholder || '';
    textarea.required = field.required || false;
    textarea.rows = 4;
    
    textarea.addEventListener('input', (e) => {
      this.formValues[textarea.name] = e.target.value;
      this.clearError(index);
    });
    
    return textarea;
  }

  /**
   * Render email input field
   */
  renderEmailInput(field, index) {
    const input = document.createElement('input');
    input.type = 'email';
    input.id = `field-${index}`;
    input.className = 'form-input';
    input.name = field.id || `field-${index}`;
    input.placeholder = field.placeholder || 'example@email.com';
    input.required = field.required || false;
    
    input.addEventListener('input', (e) => {
      this.formValues[input.name] = e.target.value;
      this.clearError(index);
    });
    
    return input;
  }

  /**
   * Render number input field
   */
  renderNumberInput(field, index) {
    const input = document.createElement('input');
    input.type = 'number';
    input.id = `field-${index}`;
    input.className = 'form-input';
    input.name = field.id || `field-${index}`;
    input.placeholder = field.placeholder || '';
    input.required = field.required || false;
    
    if (field.min !== undefined) input.min = field.min;
    if (field.max !== undefined) input.max = field.max;
    
    input.addEventListener('input', (e) => {
      this.formValues[input.name] = e.target.value;
      this.clearError(index);
    });
    
    return input;
  }

  /**
   * Render rating field (1-5 stars)
   */
  renderRating(field, index) {
    const ratingGroup = document.createElement('div');
    ratingGroup.className = 'rating-group';
    ratingGroup.setAttribute('role', 'radiogroup');
    ratingGroup.setAttribute('aria-label', field.question || 'Rating');
    
    const maxRating = field.maxRating || 5;
    const selectedValue = this.formValues[field.id || `field-${index}`];
    
    for (let i = 1; i <= maxRating; i++) {
      const ratingItem = document.createElement('button');
      ratingItem.type = 'button';
      ratingItem.className = 'rating-item';
      ratingItem.textContent = i;
      ratingItem.setAttribute('aria-label', `Rate ${i} out of ${maxRating}`);
      
      if (selectedValue == i) {
        ratingItem.classList.add('selected');
      }
      
      ratingItem.addEventListener('click', () => {
        // Remove selected class from all items
        ratingGroup.querySelectorAll('.rating-item').forEach(item => {
          item.classList.remove('selected');
        });
        
        // Add selected class to clicked item
        ratingItem.classList.add('selected');
        this.formValues[field.id || `field-${index}`] = i;
        this.clearError(index);
      });
      
      ratingGroup.appendChild(ratingItem);
    }
    
    return ratingGroup;
  }

  /**
   * Render multiple choice field (radio buttons)
   */
  renderMultipleChoice(field, index) {
    const optionGroup = document.createElement('div');
    optionGroup.className = 'option-group';
    
    if (!field.options || !Array.isArray(field.options)) {
      return optionGroup;
    }
    
    field.options.forEach((option, optionIndex) => {
      const optionItem = document.createElement('div');
      optionItem.className = 'option-item';
      
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.id = `field-${index}-option-${optionIndex}`;
      radio.name = field.id || `field-${index}`;
      radio.value = option;
      radio.required = field.required || false;
      
      const label = document.createElement('label');
      label.setAttribute('for', `field-${index}-option-${optionIndex}`);
      label.textContent = option;
      
      optionItem.appendChild(radio);
      optionItem.appendChild(label);
      
      optionItem.addEventListener('click', (e) => {
        if (e.target !== radio) {
          radio.checked = true;
        }
        optionItem.classList.add('selected');
        optionGroup.querySelectorAll('.option-item').forEach(item => {
          if (item !== optionItem) {
            item.classList.remove('selected');
          }
        });
        this.formValues[radio.name] = option;
        this.clearError(index);
      });
      
      radio.addEventListener('change', () => {
        if (radio.checked) {
          optionItem.classList.add('selected');
          optionGroup.querySelectorAll('.option-item').forEach(item => {
            if (item !== optionItem) {
              item.classList.remove('selected');
            }
          });
          this.formValues[radio.name] = option;
          this.clearError(index);
        }
      });
      
      optionGroup.appendChild(optionItem);
    });
    
    return optionGroup;
  }

  /**
   * Render checkbox field
   */
  renderCheckbox(field, index) {
    const optionGroup = document.createElement('div');
    optionGroup.className = 'option-group';
    
    if (!field.options || !Array.isArray(field.options)) {
      return optionGroup;
    }
    
    field.options.forEach((option, optionIndex) => {
      const optionItem = document.createElement('div');
      optionItem.className = 'option-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `field-${index}-option-${optionIndex}`;
      checkbox.name = field.id || `field-${index}`;
      checkbox.value = option;
      checkbox.required = field.required || false;
      
      const label = document.createElement('label');
      label.setAttribute('for', `field-${index}-option-${optionIndex}`);
      label.textContent = option;
      
      optionItem.appendChild(checkbox);
      optionItem.appendChild(label);
      
      checkbox.addEventListener('change', () => {
        const fieldName = checkbox.name;
        if (!this.formValues[fieldName]) {
          this.formValues[fieldName] = [];
        }
        
        if (checkbox.checked) {
          this.formValues[fieldName].push(option);
          optionItem.classList.add('selected');
        } else {
          this.formValues[fieldName] = this.formValues[fieldName].filter(v => v !== option);
          optionItem.classList.remove('selected');
        }
        
        this.clearError(index);
      });
      
      optionGroup.appendChild(optionItem);
    });
    
    return optionGroup;
  }

  /**
   * Render submit button
   */
  renderSubmitButton() {
    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'form-button';
    button.textContent = 'Submit Form';
    button.id = 'submit-button';
    
    this.container.appendChild(button);
  }

  /**
   * Validate form
   */
  validate() {
    this.errors = {};
    let isValid = true;
    
    if (!this.formData.answers || !Array.isArray(this.formData.answers)) {
      return isValid;
    }
    
    this.formData.answers.forEach((field, index) => {
      const fieldId = field.id || `field-${index}`;
      const value = this.formValues[fieldId];
      
      if (field.required) {
        if (!value || (Array.isArray(value) && value.length === 0)) {
          this.setError(index, 'This field is required');
          isValid = false;
        }
      }
      
      // Email validation
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          this.setError(index, 'Please enter a valid email address');
          isValid = false;
        }
      }
    });
    
    return isValid;
  }

  /**
   * Set error message for a field
   */
  setError(index, message) {
    this.errors[index] = message;
    const errorDiv = document.getElementById(`error-${index}`);
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
    
    // Highlight the field
    const fieldWrapper = document.querySelector(`[data-field-id="${this.formData.answers[index].id || index}"]`);
    if (fieldWrapper) {
      const input = fieldWrapper.querySelector('.form-input, .form-textarea, .form-select, .rating-group, .option-group');
      if (input) {
        input.style.borderColor = 'var(--color-error)';
      }
    }
  }

  /**
   * Clear error for a field
   */
  clearError(index) {
    delete this.errors[index];
    const errorDiv = document.getElementById(`error-${index}`);
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
    
    // Reset field border
    const fieldWrapper = document.querySelector(`[data-field-id="${this.formData.answers[index].id || index}"]`);
    if (fieldWrapper) {
      const input = fieldWrapper.querySelector('.form-input, .form-textarea, .form-select, .rating-group, .option-group');
      if (input) {
        input.style.borderColor = '';
      }
    }
  }

  /**
   * Get form values
   */
  getFormValues() {
    return this.formValues;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormRenderer;
}


