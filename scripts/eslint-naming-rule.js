/**
 * @fileoverview ESLint rule to enforce consistent naming conventions
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce consistent naming conventions',
      category: 'Stylistic Issues',
      recommended: true
    },
    fixable: null,
    schema: []
  },
  create: function(context) {
    // Regular expressions for naming conventions
    const CONST_PATTERN = /^[A-Z][A-Z0-9_]*$/;
    const CAMEL_CASE_PATTERN = /^[a-z][a-zA-Z0-9]*$/;
    const PRIVATE_PATTERN = /^_[a-z][a-zA-Z0-9]*$/;
    const CLASS_PATTERN = /^[A-Z][a-zA-Z0-9]*$/;
    
    return {
      // Check variable declarations
      'VariableDeclaration': function(node) {
        const kind = node.kind;
        
        for (const declaration of node.declarations) {
          const id = declaration.id;
          
          // Skip destructuring patterns
          if (id.type !== 'Identifier') {
            continue;
          }
          
          const name = id.name;
          
          // Check constants
          if (kind === 'const' && !CONST_PATTERN.test(name) && !CAMEL_CASE_PATTERN.test(name)) {
            context.report({
              node: id,
              message: 'Constants should use either UPPER_CASE or camelCase naming convention'
            });
          }
          
          // Check variables
          if ((kind === 'let' || kind === 'var') && 
              !CAMEL_CASE_PATTERN.test(name) && 
              !PRIVATE_PATTERN.test(name)) {
            context.report({
              node: id,
              message: 'Variables should use camelCase naming convention'
            });
          }
        }
      },
      
      // Check function declarations
      'FunctionDeclaration': function(node) {
        const name = node.id.name;
        
        if (!CAMEL_CASE_PATTERN.test(name)) {
          context.report({
            node: node.id,
            message: 'Functions should use camelCase naming convention'
          });
        }
      },
      
      // Check class declarations
      'ClassDeclaration': function(node) {
        const name = node.id.name;
        
        if (!CLASS_PATTERN.test(name)) {
          context.report({
            node: node.id,
            message: 'Classes should use PascalCase naming convention'
          });
        }
      },
      
      // Check method definitions
      'MethodDefinition': function(node) {
        const name = node.key.name;
        
        // Skip computed properties and non-identifier keys
        if (!name) {
          return;
        }
        
        // Check private methods
        if (node.key.type === 'PrivateIdentifier') {
          if (!CAMEL_CASE_PATTERN.test(name)) {
            context.report({
              node: node.key,
              message: 'Private methods should use camelCase naming convention'
            });
          }
          return;
        }
        
        // Check regular methods
        if (!CAMEL_CASE_PATTERN.test(name) && !PRIVATE_PATTERN.test(name)) {
          context.report({
            node: node.key,
            message: 'Methods should use camelCase naming convention'
          });
        }
      },
      
      // Check property definitions
      'Property': function(node) {
        // Skip computed properties and non-identifier keys
        if (node.computed || node.key.type !== 'Identifier') {
          return;
        }
        
        const name = node.key.name;
        
        // Skip methods
        if (node.method) {
          return;
        }
        
        // Check properties
        if (!CAMEL_CASE_PATTERN.test(name) && !PRIVATE_PATTERN.test(name)) {
          context.report({
            node: node.key,
            message: 'Properties should use camelCase naming convention'
          });
        }
      },
      
      // Check parameters
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression': function(node) {
        for (const param of node.params) {
          // Skip destructuring patterns and non-identifier parameters
          if (param.type !== 'Identifier') {
            continue;
          }
          
          const name = param.name;
          
          if (!CAMEL_CASE_PATTERN.test(name)) {
            context.report({
              node: param,
              message: 'Parameters should use camelCase naming convention'
            });
          }
        }
      }
    };
  }
}; 