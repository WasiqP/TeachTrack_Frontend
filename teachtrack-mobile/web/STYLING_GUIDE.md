# PulseBox Web Form Viewer - Styling Guide

Quick reference guide for customizing the web form viewer appearance.

## 🎨 Color Variables

All colors can be customized in `css/theme.css`:

```css
--color-primary: #A060FF;        /* Main brand color */
--color-primary-dark: #8A4DE6;   /* Hover states */
--color-primary-light: #E0CBFF;   /* Light tint */
--color-accent: #00E4E3;         /* Accent color */
--color-background: #FEFDFF;     /* Page background */
--color-card-background: #FFFFFF; /* Form background */
--color-text-primary: #000000;    /* Main text */
--color-text-secondary: #666666;  /* Secondary text */
--color-border: #E0E0E0;         /* Borders */
```

## 📐 Spacing Variables

```css
--spacing-xs: 8px;     /* Extra small */
--spacing-sm: 12px;    /* Small */
--spacing-md: 16px;    /* Medium */
--spacing-lg: 24px;    /* Large */
--spacing-xl: 32px;    /* Extra large */
--spacing-xxl: 48px;   /* 2X large */

--field-spacing: 24px;      /* Space between fields */
--section-spacing: 32px;    /* Space between sections */
--container-padding: 24px;   /* Container padding */
```

## 🔤 Typography Variables

```css
--font-family-primary: 'Poppins', sans-serif;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-xl: 24px;
--font-size-3xl: 40px;
--font-weight-normal: 400;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

## 📦 Layout Variables

```css
--container-max-width: 800px;     /* Max form width */
--input-height: 48px;             /* Input field height */
--input-border-radius: 12px;      /* Input corners */
--button-height: 48px;            /* Button height */
--button-border-radius: 12px;     /* Button corners */
```

## 🎯 Common Customizations

### Change Form Width
```css
--container-max-width: 900px;  /* Wider */
--container-max-width: 600px;   /* Narrower */
```

### Change Input Padding
```css
--input-padding: 16px 20px;  /* More padding */
```

### Change Button Style
```css
.form-button {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  box-shadow: 0 4px 12px rgba(160, 96, 255, 0.3);
}
```

### Change Border Radius (More Rounded)
```css
--input-border-radius: 16px;
--button-border-radius: 16px;
```

### Change Border Radius (Less Rounded)
```css
--input-border-radius: 4px;
--button-border-radius: 4px;
```

## 📱 Responsive Breakpoints

```css
@media (max-width: 480px) {  /* Mobile */ }
@media (max-width: 768px) {  /* Tablet */ }
```

## 🔍 Quick Find

**Where to edit:**
- Colors → `css/theme.css` (CSS variables)
- Spacing → `css/theme.css` (CSS variables)
- Layout → `css/styles.css` (component styles)
- Fonts → `css/theme.css` + `index.html` (Google Fonts link)


