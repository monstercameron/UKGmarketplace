/**
 * @fileoverview ESLint rule to enforce Go-style error handling pattern
 * @author UKG Marketplace Team
 */

/**
 * Rule to enforce Go-style error handling pattern where function calls follow 
 * the const [result, err] = someFunc() style.
 */
export const requireGoStyleErrorHandling = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce Go-style error handling pattern',
      category: 'Best Practices',
      recommended: true
    },
    fixable: null,
    schema: []
  },
  create: function(context) {
    // Functions that should return a Result tuple
    const resultFunctions = [
      'handle',
      'Result',
      'validate',
      'validateAsync',
      'httpError',
      'findItemById',
      'findItemsByCategory',
      'searchItems',
      'updateItem',
      'deleteItem',
      'addItemImage',
      'removeItemImage',
      'incrementItemViews',
      'reportItem',
      'addSubscriber',
      'addWatcher',
      'findWatchers',
      'findAllItems',
      'validateManagementKey',
      'countItems',
      'updateItemSoldStatus',
      'countItemsByCategory',
      'countItemsBySearch',
      'getAllItems',
      'createItem',
      'createCategory',
      'findCategoryById',
      'findAllCategories',
      'getCategoryTree',
      'createUser',
      'findUserByEmail',
      'sendMessage'
    ];

    return {
      // Check await expressions
      AwaitExpression(node) {
        // Get the parent node
        const parent = node.parent;
        
        // Check if the await expression is part of a variable declaration
        if (parent && parent.type === 'VariableDeclarator') {
          const awaitedExpression = node.argument;
          
          // Check if we're awaiting a function call
          if (awaitedExpression.type === 'CallExpression') {
            const callee = awaitedExpression.callee;
            let functionName = '';
            
            // Get the function name
            if (callee.type === 'Identifier') {
              functionName = callee.name;
            } else if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
              functionName = callee.property.name;
            }
            
            // Check if this is a function that should return a Result tuple
            if (resultFunctions.includes(functionName)) {
              // Check if the variable declaration uses destructuring with error as the second parameter
              const id = parent.id;
              if (id.type !== 'ArrayPattern' || id.elements.length !== 2) {
                context.report({
                  node: parent,
                  message: `Function '${functionName}' should be used with Go-style error handling: const [result, error] = await ${functionName}(...)`
                });
              } else {
                // Check if the second element is named 'error', 'err', or similar
                const secondElement = id.elements[1];
                if (secondElement && secondElement.type === 'Identifier') {
                  const name = secondElement.name.toLowerCase();
                  if (!name.includes('err') && !name.includes('error')) {
                    context.report({
                      node: secondElement,
                      message: 'Second element in destructuring should be named "error", "err", or similar to follow Go-style error handling'
                    });
                  }
                }
              }
            }
          }
        } else if (parent && parent.type !== 'VariableDeclarator') {
          // Check if we're awaiting a function call that should return a Result tuple
          // but not capturing the result
          const awaitedExpression = node.argument;
          if (awaitedExpression.type === 'CallExpression') {
            const callee = awaitedExpression.callee;
            let functionName = '';
            
            // Get the function name
            if (callee.type === 'Identifier') {
              functionName = callee.name;
            } else if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
              functionName = callee.property.name;
            }
            
            // Check if this is a function that should return a Result tuple
            if (resultFunctions.includes(functionName)) {
              context.report({
                node: node,
                message: `Function '${functionName}' returns a Result tuple that should be captured: const [result, error] = await ${functionName}(...)`
              });
            }
          }
        }
      },
      
      // Check non-await function calls
      CallExpression(node) {
        // Skip if this is part of an await expression
        if (node.parent.type === 'AwaitExpression') {
          return;
        }
        
        const callee = node.callee;
        let functionName = '';
        
        // Get the function name
        if (callee.type === 'Identifier') {
          functionName = callee.name;
        } else if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
          functionName = callee.property.name;
        }
        
        // Check if this is a function that should return a Result tuple
        if (resultFunctions.includes(functionName)) {
          // Check if the function call is part of a variable declaration with destructuring
          const parent = node.parent;
          if (parent.type === 'VariableDeclarator') {
            const id = parent.id;
            if (id.type !== 'ArrayPattern' || id.elements.length !== 2) {
              context.report({
                node: parent,
                message: `Function '${functionName}' should be used with Go-style error handling: const [result, error] = ${functionName}(...)`
              });
            } else {
              // Check if the second element is named 'error', 'err', or similar
              const secondElement = id.elements[1];
              if (secondElement && secondElement.type === 'Identifier') {
                const name = secondElement.name.toLowerCase();
                if (!name.includes('err') && !name.includes('error')) {
                  context.report({
                    node: secondElement,
                    message: 'Second element in destructuring should be named "error", "err", or similar to follow Go-style error handling'
                  });
                }
              }
            }
          } else if (parent.type !== 'VariableDeclarator') {
            // Function call is not part of a variable declaration
            context.report({
              node: node,
              message: `Function '${functionName}' returns a Result tuple that should be captured: const [result, error] = ${functionName}(...)`
            });
          }
        }
      }
    };
  }
};

export default {
  rules: {
    'require-go-style-error-handling': requireGoStyleErrorHandling
  }
}; 