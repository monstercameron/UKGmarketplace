/**
 * @fileoverview ESLint rule to enforce consistent error handling in asynchronous code
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce consistent error handling in asynchronous code',
      category: 'Best Practices',
      recommended: true
    },
    fixable: null,
    schema: []
  },
  create: function(context) {
    return {
      // Check for try/catch blocks in async functions
      'FunctionDeclaration[async=true]': function(node) {
        let hasTryCatch = false;
        
        // Check if the function has a try/catch block
        if (node.body && node.body.type === 'BlockStatement') {
          const bodyStatements = node.body.body || [];
          
          for (const statement of bodyStatements) {
            if (statement.type === 'TryStatement') {
              hasTryCatch = true;
              break;
            }
          }
        }
        
        // If no try/catch found, report an error
        if (!hasTryCatch) {
          context.report({
            node: node,
            message: 'Async functions should include try/catch blocks for error handling'
          });
        }
      },
      
      // Check for try/catch blocks in async arrow functions
      'ArrowFunctionExpression[async=true]': function(node) {
        let hasTryCatch = false;
        
        // Check if the function has a try/catch block
        if (node.body && node.body.type === 'BlockStatement') {
          const bodyStatements = node.body.body || [];
          
          for (const statement of bodyStatements) {
            if (statement.type === 'TryStatement') {
              hasTryCatch = true;
              break;
            }
          }
          
          // If no try/catch found, report an error
          if (!hasTryCatch) {
            context.report({
              node: node,
              message: 'Async arrow functions should include try/catch blocks for error handling'
            });
          }
        }
      },
      
      // Check for proper error handling in catch clauses
      'CatchClause': function(node) {
        const body = node.body.body || [];
        let hasErrorHandling = false;
        
        // Check if the catch block has proper error handling
        for (const statement of body) {
          // Check for console.error or logger.error
          if (statement.type === 'ExpressionStatement' && 
              statement.expression.type === 'CallExpression') {
            const callee = statement.expression.callee;
            
            if (callee.type === 'MemberExpression') {
              const object = callee.object.name;
              const property = callee.property.name;
              
              if ((object === 'console' && property === 'error') ||
                  (object === 'logger' && property === 'error')) {
                hasErrorHandling = true;
                break;
              }
            }
          }
        }
        
        // If no error handling found, report an error
        if (!hasErrorHandling) {
          context.report({
            node: node,
            message: 'Catch clauses should include proper error handling (e.g., logger.error)'
          });
        }
      },
      
      // Check for await expressions without try/catch
      'AwaitExpression': function(node) {
        let isInTryCatch = false;
        let current = node;
        
        // Traverse up the AST to check if the await expression is inside a try/catch block
        while (current.parent) {
          current = current.parent;
          
          if (current.type === 'TryStatement') {
            isInTryCatch = true;
            break;
          }
          
          // Stop traversing at function boundaries
          if (current.type === 'FunctionDeclaration' || 
              current.type === 'ArrowFunctionExpression' ||
              current.type === 'FunctionExpression') {
            break;
          }
        }
        
        // If not in a try/catch block, report an error
        if (!isInTryCatch) {
          context.report({
            node: node,
            message: 'Await expressions should be wrapped in try/catch blocks'
          });
        }
      }
    };
  }
}; 