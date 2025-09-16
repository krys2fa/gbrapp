#!/bin/bash
# Migration script to update all loading spinners to use the consistent component

echo "🔄 Migrating loading spinners to consistent component..."

# Files that need updating (add more as needed)
files=(
  "app/valuations/page.tsx"
  "app/sealing-certification/page.tsx" 
  "app/dashboard/page.tsx"
  "app/job-cards/components/job-card-list.tsx"
  "app/job-cards/large-scale/components/job-card-list.tsx"
  "app/settings/page.tsx"
)

# Pattern replacements
declare -A patterns=(
  # Old CSS spinner pattern
  ["<div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto\"><\/div>"]="<TableLoadingSpinner \/>"
  
  # Old Loader2 with custom styling
  ["<Loader2 className=\"h-8 w-8 animate-spin text-indigo-600.*?\"\/>"]="<TableLoadingSpinner \/>"
  
  # Update imports
  ["import.*Loader2.*from \"lucide-react\""]="import { TableLoadingSpinner, PageLoadingSpinner, ButtonLoadingSpinner } from \"@/app/components/ui/loading-spinner\""
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Updating $file..."
    
    # Add import if not present
    if ! grep -q "loading-spinner" "$file"; then
      # Add import after existing lucide-react imports
      sed -i '/from "lucide-react"/a import { TableLoadingSpinner, PageLoadingSpinner, ButtonLoadingSpinner } from "@/app/components/ui/loading-spinner";' "$file"
    fi
    
    echo "✅ Updated $file"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "🎉 Loading spinner migration complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review each updated file"
echo "2. Choose appropriate spinner component (Table/Page/Button/Modal)"
echo "3. Update loading messages to be context-specific"
echo "4. Test loading states in each component"
echo "5. Remove unused Loader2 imports"