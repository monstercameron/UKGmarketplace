/**
 * @fileoverview Rule to enforce the use of logger module in server files
 * @author UKG Classifieds Team
 */

export const requireLogger = {
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
    // Check if we're in a server file
    const filename = context.getFilename();
    const isServerFile = 
      filename.includes('/src/api/') || 
      filename.includes('/scripts/') || 
      filename.endsWith('server.js');
    
    // If not a server file, don't apply this rule
    if (!isServerFile) {
      return {};
    }
    
    return {
      Program(node) {
        // Look for logger import
        let hasLoggerImport = false;
        
        // Check all import declarations
        const importDeclarations = node.body.filter(
          node => node.type === 'ImportDeclaration'
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
};

export default {
  rules: {
    'require-logger': requireLogger
  }
}; 