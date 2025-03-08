/**
 * @fileoverview ESLint plugin to enforce the use of logger module in server files
 */

module.exports = {
  rules: {
    'require-logger': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Enforce the use of logger module in server files',
          category: 'Best Practices',
          recommended: true
        },
        fixable: null,
        schema: []
      },
      create: function(context) {
        return {
          Program(node) {
            // Look for logger import
            let hasLoggerImport = false;
            
            // Check all import declarations
            const importDeclarations = node.body.filter(
              n => n.type === 'ImportDeclaration'
            );
            
            for (const importDecl of importDeclarations) {
              // Check if importing from logger module
              if (
                importDecl.source.value.includes('logger.js') || 
                importDecl.source.value.includes('utils/logger')
              ) {
                // Check if logger is being imported
                const specifiers = importDecl.specifiers || [];
                for (const specifier of specifiers) {
                  if (
                    (specifier.type === 'ImportSpecifier' && 
                     specifier.imported.name === 'logger') ||
                    (specifier.type === 'ImportDefaultSpecifier' && 
                     specifier.local.name === 'logger')
                  ) {
                    hasLoggerImport = true;
                    break;
                  }
                }
              }
              
              if (hasLoggerImport) break;
            }
            
            if (!hasLoggerImport) {
              context.report({
                node: node,
                message: 'Server files must import and use the logger module from src/api/utils/logger.js'
              });
            }
          },
          
          // Detect direct console usage
          CallExpression(node) {
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'console'
            ) {
              context.report({
                node: node,
                message: 'Use the logger module instead of console directly'
              });
            }
          }
        };
      }
    },
    'no-direct-console': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Disallow direct use of console methods',
          category: 'Best Practices',
          recommended: true
        },
        fixable: null,
        schema: []
      },
      create: function(context) {
        return {
          CallExpression(node) {
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'console'
            ) {
              context.report({
                node: node,
                message: 'Use the logger module instead of console directly'
              });
            }
          }
        };
      }
    }
  }
}; 