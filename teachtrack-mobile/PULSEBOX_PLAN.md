# PulseBox Feedback Collection App - System Design

## Architecture Overview

**Tech Stack:**

- Frontend: React Native (iOS & Android)
- Backend: Firebase (Firestore, Authentication, Cloud Functions, Hosting)
- Navigation: React Navigation (Bottom Tabs + Stack)
- Form Sharing: Firebase Hosting for web form viewer

## Data Model (Firestore Structure)

```
users/
  {userId}/
    - email: string
    - name: string
    - createdAt: timestamp
    - businessName?: string
    - avatarUrl?: string

forms/
  {formId}/
    - userId: string (owner)
    - title: string
    - description: string
    - fields: array of field objects
      - id: string
      - type: 'text' | 'rating' | 'multipleChoice' | 'checkbox' | 'email'
      - label: string
      - required: boolean
      - options?: string[] (for multipleChoice/checkbox)
    - isActive: boolean
    - createdAt: timestamp
    - updatedAt: timestamp
    - responseCount: number
    - shareableLink: string

responses/
  {responseId}/
    - formId: string
    - submittedAt: timestamp
    - answers: object (fieldId -> answer)
    - respondentEmail?: string
```

## Screen Structure & Navigation

### Phase 1: Core Screens (Tab Navigator after login)

**Bottom Tabs (Main App):**

1. **Dashboard** - Overview of all forms and recent activity
2. **Forms** - List and manage all forms
3. **Responses** - View responses across all forms
4. **Profile** - User settings and account management

**Stack Screens:**

- `CreateForm` - Build a new form
- `EditForm` - Edit existing form
- `FormDetails` - View form stats and share link
- `FormBuilder` - Drag-and-drop field editor
- `ResponseDetails` - View individual response
- `FormResponses` - All responses for a specific form

### Existing Screens (Pre-login flow)

- `GetStarted` → `Onboarding01-03` → `Login/SignUp` → **MainTabs**

## Key Features Implementation

### 1. Dashboard Screen

- Welcome message with user's name
- Quick stats cards (total forms, total responses, active forms)
- Recent responses list (last 5)
- Quick action button: "Create New Form"
- Chart showing response trends (Phase 2)

### 2. Forms Screen

- List of all user's forms with card design
- Each card shows: title, response count, active status, share button
- Floating action button: "+" to create new form
- Pull to refresh
- Search/filter forms
- Actions: Edit, View Responses, Share, Duplicate, Delete

### 3. Form Builder

- Form title and description inputs
- Add field button with type selector
- Field types: Text Input, Email, Rating (1-5 stars), Multiple Choice, Checkbox
- Each field configurable: label, required toggle, placeholder
- Reorder fields (drag handle)
- Preview mode
- Save and generate shareable link

### 4. Responses Screen

- Tab view: "All Responses" / "Recent" / "By Form"
- Response cards showing: form name, submission date, preview of first answer
- Tap to view full response
- Export to CSV button (Phase 2)
- Filter by date range and form

### 5. Form Sharing System

- Generate unique short URL (Firebase Dynamic Links or custom short codes)
- Web viewer hosted on Firebase Hosting
- Web form: Beautiful responsive design matching app theme
- Submit button sends data to Firestore
- Thank you page after submission
- Share via: Copy link, QR code, WhatsApp, Email

### 6. Profile Screen

- User info with avatar
- Business details
- Subscription/plan info (for Phase 2)
- Settings: Notifications, Theme (future)
- Logout button

## Firebase Setup Requirements

### Packages to Install:

```json
"@react-native-firebase/app"
"@react-native-firebase/auth"
"@react-native-firebase/firestore"
"@react-native-firebase/functions"
"@react-native-firebase/storage" (for avatars later)
"@react-navigation/bottom-tabs"
"react-native-vector-icons" (for tab icons)
"react-native-qrcode-svg" (for QR generation)
"react-native-share" (for sharing links)
```

### Firebase Console Setup:

1. Create Firebase project
2. Enable Email/Password authentication
3. Configure Firestore with security rules
4. Set up Firebase Hosting for web form viewer
5. Create indexes for queries

## Component Structure

### New Components to Create:

- `FormCard.tsx` - Display form in list
- `ResponseCard.tsx` - Display response in list
- `StatCard.tsx` - Dashboard stat widget
- `FieldEditor.tsx` - Individual field configuration
- `FormField.tsx` - Render field in form preview/web
- `TabBarIcon.tsx` - Custom tab bar icons
- `EmptyState.tsx` - No data placeholder
- `LoadingSpinner.tsx` - Loading state
- `ConfirmDialog.tsx` - Confirmation modals

### Services/Hooks to Create:

- `src/services/firebase.ts` - Firebase initialization
- `src/services/auth.ts` - Auth operations
- `src/services/forms.ts` - Form CRUD operations
- `src/services/responses.ts` - Response operations
- `src/hooks/useAuth.ts` - Auth state management
- `src/hooks/useForms.ts` - Forms data fetching
- `src/hooks/useResponses.ts` - Responses data fetching
- `src/utils/linkGenerator.ts` - Generate shareable links
- `src/utils/validation.ts` - Form validation

### Type Definitions:

- `src/types/form.ts` - Form and field types
- `src/types/response.ts` - Response types
- `src/types/user.ts` - User types
- `src/types/navigation.ts` - Update navigation types

## Web Form Viewer

Create separate web app in `web/` directory:

- Simple HTML/CSS/JS or React web app
- Fetches form structure from Firestore by form ID
- Renders form fields dynamically
- Validates and submits to Firestore
- Responsive design matching app theme
- Deploy to Firebase Hosting

## Security Rules (Firestore)

```javascript
// Users can only read/write their own data
// Forms can be read by anyone (for web viewer)
// Responses can be written by anyone, read by form owner
```

## Phase 1 Priorities (MVP)

1. Set up Firebase and authentication (replace mock login/signup)
2. Create tab navigation structure
3. Build Dashboard with basic stats
4. Implement Forms screen with list view
5. Create Form Builder with basic field types
6. Generate shareable links
7. Build web form viewer and deploy
8. Implement Responses screen with list view
9. Add basic Profile screen
10. Connect all CRUD operations to Firebase

## Phase 2 Enhancements (Future)

- Advanced form fields (file upload, date picker, signature)
- Form templates
- Conditional logic in forms
- Response analytics with charts
- Export to CSV/Excel
- Email notifications on new responses
- Custom branding per form
- Team collaboration
- Subscription plans

### To-dos

- [ ] Install Firebase packages, initialize Firebase config, set up Firestore and Authentication
- [ ] Replace mock auth with real Firebase authentication in Login and SignUp screens
- [ ] Create bottom tab navigation with Dashboard, Forms, Responses, and Profile tabs
- [ ] Build Dashboard screen with stats cards and recent responses
- [ ] Create Forms list screen with FormCard component and FAB for new form
- [ ] Build Form Builder with field types (text, rating, multiple choice, checkbox)
- [ ] Implement Firestore CRUD operations for forms (create, read, update, delete)
- [ ] Create web form viewer app and deploy to Firebase Hosting for shareable links
- [ ] Build Responses screen with list of all responses and detail view
- [ ] Create Profile screen with user info and logout functionality
