# Loading Spinner Consistency Checklist

## ✅ Implementation Checklist

### Phase 1: Component Creation (COMPLETED)

- [x] Create reusable `LoadingSpinner` component
- [x] Create specialized variants (Table, Page, Button, Modal)
- [x] Define consistent size standards (sm/md/lg)
- [x] Establish color standards (indigo-600)
- [x] Create usage guidelines documentation

### Phase 2: Migration Plan

#### High Priority Pages (Main User Flows)

- [ ] **Dashboard** (`app/dashboard/page.tsx`)

  - [ ] Replace CSS spinner with `PageLoadingSpinner`
  - [ ] Update message: "Loading dashboard data..."
  - [ ] Remove unused Loader2 import

- [ ] **Payment Receipting** (`app/payment-receipting/page.tsx`)

  - [x] ✅ Updated to use `TableLoadingSpinner`
  - [x] ✅ Consistent table loading pattern
  - [x] ✅ Context-specific message

- [ ] **Valuations** (`app/valuations/page.tsx`)

  - [ ] Replace CSS spinner with `TableLoadingSpinner`
  - [ ] Update message: "Loading valuations..."
  - [ ] Remove unused Loader2 import

- [ ] **Sealing Certification** (`app/sealing-certification/page.tsx`)
  - [ ] Replace CSS spinner with `TableLoadingSpinner`
  - [ ] Update message: "Loading sealing data..."
  - [ ] Remove unused Loader2 import

#### Medium Priority (Component Lists)

- [ ] **Job Cards List** (`app/job-cards/components/job-card-list.tsx`)

  - [ ] Replace CSS spinners with `TableLoadingSpinner`
  - [ ] Update messages: "Loading job cards..."
  - [ ] Add loading-spinner import

- [ ] **Large Scale Job Cards** (`app/job-cards/large-scale/components/job-card-list.tsx`)

  - [ ] Replace CSS spinner with `TableLoadingSpinner`
  - [ ] Update message: "Loading large scale job cards..."
  - [ ] Add loading-spinner import

- [ ] **Settings** (`app/settings/page.tsx`)
  - [ ] Replace CSS spinner with `PageLoadingSpinner`
  - [ ] Update message: "Loading profile..."
  - [ ] Update Loader import to Loader2

#### Low Priority (Setup Pages)

- [ ] Setup pages with loading states
- [ ] Individual job card pages
- [ ] Assay-related pages
- [ ] Modal loading states

### Phase 3: Quality Assurance

#### Code Review Checklist

- [ ] All loading states use consistent component
- [ ] Messages are context-specific and helpful
- [ ] Sizes follow guidelines (sm/md/lg)
- [ ] Colors use indigo-600 brand color
- [ ] Proper imports (no unused Loader2)
- [ ] Consistent spacing and centering

#### Testing Checklist

- [ ] Loading states display correctly
- [ ] Spinners are properly centered
- [ ] Messages are readable and helpful
- [ ] No console errors about missing imports
- [ ] Consistent visual appearance across pages

#### Performance Checklist

- [ ] No duplicate loading component imports
- [ ] Tree shaking working (unused imports removed)
- [ ] Bundle size not increased significantly
- [ ] Loading states render quickly

### Phase 4: Maintenance

#### Developer Guidelines

- [ ] Update component documentation
- [ ] Add to style guide/design system
- [ ] Include in code review checklist
- [ ] Add to onboarding materials

#### Monitoring

- [ ] Set up linting rules for consistency
- [ ] Regular audits of new loading states
- [ ] Track user feedback on loading experience
- [ ] Monitor performance metrics

## 🚀 Quick Migration Commands

### 1. Update a single file:

```bash
# Replace the old pattern
sed -i 's/animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600/TableLoadingSpinner/g' path/to/file.tsx

# Add import if missing
grep -q "loading-spinner" path/to/file.tsx || sed -i '1i import { TableLoadingSpinner } from "@/app/components/ui/loading-spinner";' path/to/file.tsx
```

### 2. Find all files needing updates:

```bash
# Find files with old CSS spinner patterns
grep -r "animate-spin.*border-b-2" app/ --include="*.tsx"

# Find files with direct Loader2 usage
grep -r "Loader2.*animate-spin" app/ --include="*.tsx"
```

### 3. Verify consistency:

```bash
# Check all loading spinner imports
grep -r "loading-spinner" app/ --include="*.tsx"

# Check for remaining old patterns
grep -r "border-b-2.*border-indigo-600" app/ --include="*.tsx"
```

## 📝 Quick Reference

### Import Statement

```tsx
import {
  TableLoadingSpinner,
  PageLoadingSpinner,
  ButtonLoadingSpinner,
  ModalLoadingSpinner,
} from "@/app/components/ui/loading-spinner";
```

### Usage Examples

```tsx
// Table loading
{
  loading && <TableLoadingSpinner message="Loading data..." />;
}

// Page loading
{
  loading && <PageLoadingSpinner message="Loading dashboard..." />;
}

// Button loading
{
  loading ? <ButtonLoadingSpinner message="Saving..." /> : "Save";
}

// Modal loading
{
  loading && <ModalLoadingSpinner message="Processing..." />;
}
```

## 🎯 Success Metrics

- [ ] **Visual Consistency**: All loading states look identical
- [ ] **Message Quality**: All messages provide clear context
- [ ] **Performance**: No loading state performance regressions
- [ ] **Developer Experience**: Easy to implement new loading states
- [ ] **User Experience**: Clear feedback during loading operations
- [ ] **Maintainability**: Single source of truth for loading styles
