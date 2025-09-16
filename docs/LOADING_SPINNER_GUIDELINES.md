# Loading Spinner Consistency Guidelines

## Standard Loading Component Usage

Use the centralized `LoadingSpinner` component for all loading states to maintain consistency.

### Import

```tsx
import LoadingSpinner, {
  TableLoadingSpinner,
  PageLoadingSpinner,
  ButtonLoadingSpinner,
  ModalLoadingSpinner,
} from "@/app/components/ui/loading-spinner";
```

## Usage Patterns

### 1. Table Loading (Data Lists)

For tables and data lists, use `TableLoadingSpinner`:

```tsx
{loading ? (
  <TableLoadingSpinner message="Loading payment data..." />
) : (
  // Table content
)}
```

**Use in:**

- Payment receipting tables
- Job cards lists
- Valuations lists
- Reports tables
- Any data table

### 2. Page Loading (Full Page Content)

For entire page content loading, use `PageLoadingSpinner`:

```tsx
{loading ? (
  <PageLoadingSpinner message="Loading dashboard..." />
) : (
  // Page content
)}
```

**Use in:**

- Dashboard loading
- Settings page loading
- Full page data loading

### 3. Button Loading (Form Submissions)

For button loading states, use `ButtonLoadingSpinner`:

```tsx
<button disabled={loading} className="...">
  {loading ? <ButtonLoadingSpinner message="Saving..." /> : "Save Changes"}
</button>
```

**Use in:**

- Form submissions
- Action buttons
- Payment processing
- Save operations

### 4. Modal Loading

For modal content loading, use `ModalLoadingSpinner`:

```tsx
{loading ? (
  <ModalLoadingSpinner message="Processing payment..." />
) : (
  // Modal content
)}
```

**Use in:**

- Modal dialogs
- Popup forms
- Payment modals

### 5. Custom Loading

For specific cases, use the base `LoadingSpinner`:

```tsx
<LoadingSpinner
  size="lg"
  message="Custom loading message..."
  centered={true}
  className="custom-styles"
/>
```

## Size Guidelines

- **sm (h-4 w-4)**: Buttons, inline elements, small spaces
- **md (h-6 w-6)**: Default size, modals, medium content areas
- **lg (h-8 w-8)**: Tables, pages, large content areas

## Color Standards

- **Primary**: `text-indigo-600` (default brand color)
- **Secondary**: `text-gray-400` (subtle loading states)
- **Success**: `text-green-600` (success loading states)
- **Warning**: `text-yellow-600` (warning loading states)

## Message Guidelines

### Context-Specific Messages

- **Data Loading**: "Loading [context] data..."
- **Form Submission**: "[Action]ing..." (e.g., "Saving...", "Processing...")
- **Authentication**: "Authenticating...", "Logging in..."
- **File Operations**: "Uploading...", "Downloading..."

### Examples

```tsx
// Good - Specific context
<TableLoadingSpinner message="Loading job cards..." />
<ButtonLoadingSpinner message="Saving changes..." />
<PageLoadingSpinner message="Loading dashboard data..." />

// Avoid - Generic messages
<LoadingSpinner message="Loading..." />
<LoadingSpinner message="Please wait..." />
```

## Implementation Checklist

### For New Components:

- [ ] Import the appropriate loading spinner component
- [ ] Use consistent size based on context
- [ ] Provide context-specific loading message
- [ ] Ensure proper centering and spacing
- [ ] Test loading state visibility

### For Existing Components:

- [ ] Replace custom CSS spinners with LoadingSpinner
- [ ] Update size to match guidelines (sm/md/lg)
- [ ] Standardize colors to indigo-600
- [ ] Improve loading messages with context
- [ ] Ensure consistent spacing (py-8, py-12, etc.)

## Component-Specific Patterns

### Tables & Lists

```tsx
<tbody className="...">
  {loading ? (
    <tr>
      <td colSpan={columnCount} className="text-center">
        <TableLoadingSpinner message="Loading [context]..." />
      </td>
    </tr>
  ) : (
    // Table rows
  )}
</tbody>
```

### Conditional Page Content

```tsx
return (
  <div>
    <Header />
    {loading ? (
      <PageLoadingSpinner message="Loading [context]..." />
    ) : error ? (
      <ErrorState />
    ) : (
      <MainContent />
    )}
  </div>
);
```

### Form Buttons

```tsx
<button
  type="submit"
  disabled={loading}
  className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
>
  {loading ? <ButtonLoadingSpinner message="Saving..." /> : "Save Changes"}
</button>
```

## Benefits of This Approach

1. **Visual Consistency**: Same spinner, colors, and sizes everywhere
2. **Easy Maintenance**: Update loading styles in one place
3. **Better UX**: Context-specific messages improve user understanding
4. **Developer Experience**: Simple, predictable API
5. **Accessibility**: Consistent semantic structure
6. **Performance**: Reusable component reduces bundle size
