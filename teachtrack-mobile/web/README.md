# PulseBox Web Form Viewer - Developer Guide

This directory contains the web form viewer that displays forms when clients click on shareable links. This guide explains how to customize the styling, layout, and functionality.

## 📁 Directory Structure

```
web/
├── index.html              # Main HTML file
├── css/
│   ├── theme.css          # CSS variables and theme configuration
│   └── styles.css          # Main styling for all components
├── js/
│   ├── app.js             # Main application initialization
│   ├── form-renderer.js   # Form rendering logic
│   └── form-submit.js     # Form submission handler
├── config/
│   └── theme-config.js     # JavaScript theme configuration (optional)
└── README.md              # This file
```

## 🎨 Customizing Styling

### Method 1: Edit CSS Variables (Recommended)

The easiest way to customize styling is by editing CSS variables in `css/theme.css`. All styles use these variables, so changing them will update the entire form.

**Common Customizations:**

```css
/* In css/theme.css */

:root {
  /* Change Primary Color */
  --color-primary: #A060FF;        /* Your brand color */
  --color-primary-dark: #8A4DE6;
  --color-primary-light: #E0CBFF;
  
  /* Change Spacing */
  --spacing-lg: 24px;              /* Adjust spacing between fields */
  --field-spacing: 24px;           /* Space between form fields */
  --container-padding: 24px;       /* Container padding */
  
  /* Change Fonts */
  --font-family-primary: 'Your Font', sans-serif;
  --font-size-base: 16px;          /* Base font size */
  
  /* Change Border Radius */
  --input-border-radius: 12px;     /* Input field corners */
  --button-border-radius: 12px;    /* Button corners */
  
  /* Change Container Width */
  --container-max-width: 800px;    /* Max form width */
}
```

### Method 2: Override Specific Styles

Create a `css/custom.css` file to override specific styles:

```css
/* css/custom.css */

/* Customize form header */
.form-title {
  color: #your-color;
  font-size: 36px;
}

/* Customize input fields */
.form-input {
  border: 2px solid #your-color;
  padding: 16px;
}

/* Customize buttons */
.form-button {
  background: linear-gradient(to right, #color1, #color2);
}
```

Then include it in `index.html`:

```html
<link rel="stylesheet" href="css/custom.css">
```

## 📐 Spacing & Layout Customization

### Adjust Container Padding

Edit `css/theme.css`:

```css
:root {
  --container-padding: 32px;           /* Desktop padding */
  --container-padding-mobile: 16px;    /* Mobile padding */
}
```

### Adjust Field Spacing

```css
:root {
  --field-spacing: 24px;    /* Space between form fields */
  --section-spacing: 32px;  /* Space between form sections */
}
```

### Adjust Form Width

```css
:root {
  --container-max-width: 800px;  /* Maximum form width */
}
```

## 🎨 Color Customization

### Change Brand Colors

```css
:root {
  --color-primary: #A060FF;        /* Main brand color */
  --color-accent: #00E4E3;        /* Accent color */
  --color-background: #FEFDFF;    /* Page background */
  --color-card-background: #FFFFFF; /* Form card background */
}
```

### Change Text Colors

```css
:root {
  --color-text-primary: #000000;   /* Main text */
  --color-text-secondary: #666666; /* Secondary text */
  --color-text-tertiary: #999999; /* Muted text */
}
```

## 🔤 Typography Customization

### Change Font Family

1. Add Google Fonts link in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=YourFont:wght@400;600;700&display=swap" rel="stylesheet">
```

2. Update CSS variables in `css/theme.css`:
```css
:root {
  --font-family-primary: 'YourFont', sans-serif;
  --font-family-heading: 'YourFont', sans-serif;
}
```

### Change Font Sizes

```css
:root {
  --font-size-base: 16px;    /* Body text */
  --font-size-lg: 18px;      /* Large text */
  --font-size-xl: 24px;      /* Extra large */
  --font-size-3xl: 40px;     /* Form title */
}
```

## 🔘 Button Customization

### Change Button Style

```css
.form-button {
  /* Gradient background */
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  
  /* Custom padding */
  padding: 16px 32px;
  
  /* Custom border */
  border: 2px solid var(--color-primary);
  
  /* Shadow */
  box-shadow: 0 4px 12px rgba(160, 96, 255, 0.3);
}
```

## 📱 Responsive Design

The form is responsive by default. Breakpoints are defined in CSS:

```css
/* Mobile: < 480px */
/* Tablet: 480px - 768px */
/* Desktop: > 768px */
```

To customize breakpoints, edit media queries in `css/styles.css`.

## 🔧 API Configuration

### Update API Endpoints

Edit `js/app.js`:

```javascript
const CONFIG = {
  API_ENDPOINT: 'https://your-api.com/form',  // For fetching form data
};
```

Edit `js/form-submit.js`:

```javascript
getApiEndpoint() {
  return 'https://your-api.com/submit';  // For submitting responses
}
```

### API Response Format

**Form Data Endpoint** (`GET /form/{formId}`):
```json
{
  "id": "form123",
  "name": "Feedback Form",
  "description": "Please provide your feedback",
  "answers": [
    {
      "id": "q1",
      "type": "text",
      "question": "What is your name?",
      "required": true,
      "placeholder": "Enter name"
    }
  ]
}
```

**Submit Endpoint** (`POST /submit`):
```json
{
  "formId": "form123",
  "answers": {
    "q1": "John Doe",
    "q2": "john@example.com"
  },
  "submittedAt": "2024-01-01T00:00:00.000Z"
}
```

## 🚀 Deployment

### Option 1: Static Hosting (Recommended)

1. Upload all files to your hosting service:
   - Firebase Hosting
   - Netlify
   - Vercel
   - GitHub Pages
   - AWS S3

2. Configure your hosting to serve `index.html` for all routes:
   ```
   /form/{formId} → index.html
   ```

### Option 2: Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Create `firebase.json`:
```json
{
  "hosting": {
    "public": "web",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/form/**",
        "destination": "/index.html"
      }
    ]
  }
}
```

3. Deploy:
```bash
firebase deploy --only hosting
```

## 📝 Form Field Types Supported

- `text` / `short-text` - Text input
- `long-text` / `textarea` - Multi-line text
- `email` - Email input with validation
- `number` - Number input
- `rating` - 1-5 star rating
- `multiple-choice` / `mcq` - Radio buttons
- `checkbox` - Multiple checkboxes

## 🐛 Troubleshooting

### Form not loading?
- Check browser console for errors
- Verify API endpoint is correct
- Check CORS settings on your API

### Styles not applying?
- Clear browser cache
- Check CSS file paths in `index.html`
- Verify CSS variables are defined

### Form submission failing?
- Check API endpoint in `js/form-submit.js`
- Verify API accepts JSON format
- Check browser console for errors

## 📚 Additional Resources

- [CSS Variables Documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Form Validation Best Practices](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)
- [Responsive Design Guide](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)

## 💡 Tips for Customization

1. **Start with CSS Variables**: Change colors, spacing, and fonts using CSS variables
2. **Use Browser DevTools**: Inspect elements to see which styles to override
3. **Test Responsively**: Always test on mobile, tablet, and desktop
4. **Keep it Simple**: Don't overcomplicate the design - focus on usability
5. **Accessibility**: Ensure good contrast ratios and keyboard navigation

## 🎯 Quick Customization Checklist

- [ ] Update brand colors in `css/theme.css`
- [ ] Adjust spacing/padding as needed
- [ ] Change fonts if desired
- [ ] Update API endpoints in `js/app.js` and `js/form-submit.js`
- [ ] Test form submission
- [ ] Deploy to hosting service

---

**Need Help?** Check the inline comments in each file for detailed explanations of each section.


