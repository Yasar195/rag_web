# SmartSave Login API Reference

## Components

### LoginForm
Main form component for authentication.

```svelte
<script>
  import LoginForm from '$lib/components/LoginForm.svelte';
  
  function handleLogin(credentials) {
    // credentials: LoginCredentials | SignupCredentials
    console.log(credentials);
  }
</script>

<LoginForm onSubmit={handleLogin} />
```

**Props:**
- `onSubmit?: (data: LoginCredentials | SignupCredentials) => void`

**Events:**
- `submit`: Dispatched with credential data on form submission

---

### TabButtons
Tab switcher component between Sign In and Sign Up.

```svelte
<script>
  import TabButtons from '$lib/components/TabButtons.svelte';
  let tab = 'signin';
</script>

<TabButtons 
  activeTab={tab} 
  onTabChange={(newTab) => { tab = newTab; }}
/>
```

**Props:**
- `activeTab: 'signin' | 'signup'`
- `onTabChange: (tab: AuthTab) => void`

---

### SocialLogin
Social authentication buttons.

```svelte
<script>
  import SocialLogin from '$lib/components/SocialLogin.svelte';
</script>

<SocialLogin />
```

No props required. Logs provider to console on click.

---

## Types

### LoginCredentials
```typescript
interface LoginCredentials {
  email: string;
}
```

### SignupCredentials
```typescript
interface SignupCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}
```

### AuthTab
```typescript
type AuthTab = 'signin' | 'signup';
```

---

## Form Validation Rules

### Sign In Mode
- Email is required
- Must be valid email format (browser validation)

### Sign Up Mode
- Full Name: Required, non-empty
- Email: Required, valid format
- Password: Required, minimum 6 characters
- Confirm Password: Must match password field

### Error Messages
- "Please enter your email"
- "Please enter your name"
- "Password must be at least 6 characters"
- "Passwords do not match"

---

## Styling

### CSS Variables (for customization)
```css
--color-primary: #2563eb;
--color-primary-dark: #1d4ed8;
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;
```

### Responsive Breakpoints
- Mobile: < 768px (stacked layout)
- Desktop: >= 768px (side-by-side layout)

---

## Example: Full Login Implementation

```svelte
<script>
  import LoginForm from '$lib/components/LoginForm.svelte';
  import type { LoginCredentials, SignupCredentials } from '$lib/types/auth';
  
  let message = '';
  let error = '';

  async function handleSubmit(credentials: LoginCredentials | SignupCredentials) {
    try {
      const endpoint = 'password' in credentials ? '/api/signup' : '/api/login';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) throw new Error('Authentication failed');
      
      const data = await response.json();
      message = 'Success! Redirecting...';
      
      // Handle successful login (save token, redirect, etc.)
      setTimeout(() => window.location.href = '/dashboard', 1000);
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Authentication error';
    }
  }
</script>

<LoginForm onSubmit={handleSubmit} />
{#if message}<p class="success">{message}</p>{/if}
{#if error}<p class="error">{error}</p>{/if}
```

---

## Social Login Implementation

Add this to handle social login:

```typescript
// In SocialLogin.svelte (handleSocialLogin function)
async function handleSocialLogin(provider: string) {
  try {
    const response = await fetch(`/api/auth/${provider}/login`, {
      method: 'POST'
    });
    
    const data = await response.json();
    // Handle OAuth redirect or token
    window.location.href = data.authUrl;
  } catch (error) {
    console.error(`${provider} login failed:`, error);
  }
}
```

---

## Keyboard Navigation

- **Tab**: Move between fields
- **Enter**: Submit form (when on submit button)
- **Tab** in tab buttons: Switch between Sign In/Sign Up

---

## Accessibility Features

✅ Semantic HTML structure
✅ Proper label associations with `<label for="id">`
✅ Error messages linked to form state
✅ Loading states with visual feedback
✅ Keyboard navigation support
✅ Color contrast meets WCAG standards

---

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile-friendly
- CSS Grid and Flexbox support required
