/**
 * ESLint rule to enforce consistent loading spinner usage
 * Add this to your .eslintrc.js custom rules
 */

module.exports = {
  "consistent-loading-spinner": {
    meta: {
      type: "suggestion",
      docs: {
        description: "Enforce consistent loading spinner component usage",
        category: "Best Practices",
      },
      fixable: "code",
      schema: [],
    },
    create(context) {
      return {
        // Check for old CSS spinner patterns
        JSXElement(node) {
          if (node.openingElement.name.name === "div") {
            const classNameAttr = node.openingElement.attributes.find(
              attr => attr.name && attr.name.name === "className"
            );
            
            if (classNameAttr && classNameAttr.value) {
              const className = classNameAttr.value.value || "";
              
              // Check for old CSS spinner pattern
              if (className.includes("animate-spin") && 
                  className.includes("border-b-2") &&
                  className.includes("rounded-full")) {
                context.report({
                  node,
                  message: "Use LoadingSpinner component instead of custom CSS spinner",
                  fix(fixer) {
                    return fixer.replaceText(
                      node, 
                      "<TableLoadingSpinner message=\"Loading...\" />"
                    );
                  }
                });
              }
            }
          }
          
          // Check for Loader2 usage outside of LoadingSpinner component
          if (node.openingElement.name.name === "Loader2") {
            context.report({
              node,
              message: "Use LoadingSpinner component instead of direct Loader2 usage",
              suggest: [
                {
                  desc: "Replace with TableLoadingSpinner",
                  fix(fixer) {
                    return fixer.replaceText(
                      node,
                      "<TableLoadingSpinner message=\"Loading...\" />"
                    );
                  }
                }
              ]
            });
          }
        },
        
        // Check imports
        ImportDeclaration(node) {
          if (node.source.value === "lucide-react") {
            const loader2Import = node.specifiers.find(
              spec => spec.imported && spec.imported.name === "Loader2"
            );
            
            if (loader2Import) {
              context.report({
                node: loader2Import,
                message: "Import LoadingSpinner component instead of Loader2 directly",
                fix(fixer) {
                  return fixer.insertTextAfter(
                    node,
                    '\nimport { TableLoadingSpinner, PageLoadingSpinner, ButtonLoadingSpinner } from "@/app/components/ui/loading-spinner";'
                  );
                }
              });
            }
          }
        }
      };
    },
  },
};