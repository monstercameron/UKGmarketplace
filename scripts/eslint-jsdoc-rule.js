/**
 * @fileoverview ESLint rule to enforce consistent JSDoc comments
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce consistent JSDoc comments',
      category: 'Stylistic Issues',
      recommended: true
    },
    fixable: null,
    schema: []
  },
  create: function(context) {
    const sourceCode = context.getSourceCode();
    
    /**
     * Check if a node has a JSDoc comment
     * @param {Object} node - The AST node to check
     * @returns {boolean} True if the node has a JSDoc comment
     */
    function hasJSDoc(node) {
      const comments = sourceCode.getCommentsBefore(node);
      return comments.some(comment => comment.type === 'Block' && comment.value.startsWith('*'));
    }
    
    /**
     * Check if a JSDoc comment has a description
     * @param {Object} node - The AST node to check
     * @returns {boolean} True if the JSDoc comment has a description
     */
    function hasJSDocDescription(node) {
      const comments = sourceCode.getCommentsBefore(node);
      for (const comment of comments) {
        if (comment.type === 'Block' && comment.value.startsWith('*')) {
          // Check if there's content after the first line (which usually contains tags)
          const lines = comment.value.split('\n');
          if (lines.length > 1) {
            // Check if any line has a description (not just tags)
            for (const line of lines) {
              const trimmedLine = line.trim().replace(/^\*\s*/, '');
              if (trimmedLine && !trimmedLine.startsWith('@')) {
                return true;
              }
            }
          }
        }
      }
      return false;
    }
    
    /**
     * Check if a JSDoc comment has param tags for all parameters
     * @param {Object} node - The AST node to check
     * @returns {boolean} True if the JSDoc comment has param tags for all parameters
     */
    function hasParamTags(node) {
      const comments = sourceCode.getCommentsBefore(node);
      const params = node.params || [];
      
      if (params.length === 0) {
        return true; // No parameters to document
      }
      
      for (const comment of comments) {
        if (comment.type === 'Block' && comment.value.startsWith('*')) {
          const paramTags = comment.value.match(/@param/g) || [];
          return paramTags.length >= params.length;
        }
      }
      
      return false;
    }
    
    /**
     * Check if a JSDoc comment has a return tag for functions that return values
     * @param {Object} node - The AST node to check
     * @returns {boolean} True if the JSDoc comment has a return tag
     */
    function hasReturnTag(node) {
      // Skip functions with no return statement
      if (!hasReturnStatement(node.body)) {
        return true;
      }
      
      const comments = sourceCode.getCommentsBefore(node);
      
      for (const comment of comments) {
        if (comment.type === 'Block' && comment.value.startsWith('*')) {
          return comment.value.includes('@return') || comment.value.includes('@returns');
        }
      }
      
      return false;
    }
    
    /**
     * Check if a function body has a return statement
     * @param {Object} body - The function body to check
     * @returns {boolean} True if the function body has a return statement
     */
    function hasReturnStatement(body) {
      if (!body || !body.body) {
        return false;
      }
      
      for (const statement of body.body) {
        if (statement.type === 'ReturnStatement' && statement.argument) {
          return true;
        }
      }
      
      return false;
    }
    
    return {
      // Check function declarations
      'FunctionDeclaration': function(node) {
        if (!hasJSDoc(node)) {
          context.report({
            node: node,
            message: 'Function declarations should have JSDoc comments'
          });
          return;
        }
        
        if (!hasJSDocDescription(node)) {
          context.report({
            node: node,
            message: 'JSDoc comments should include a description'
          });
        }
        
        if (!hasParamTags(node)) {
          context.report({
            node: node,
            message: 'JSDoc comments should document all parameters'
          });
        }
        
        if (!hasReturnTag(node)) {
          context.report({
            node: node,
            message: 'JSDoc comments should include a @returns tag for functions that return values'
          });
        }
      },
      
      // Check class declarations
      'ClassDeclaration': function(node) {
        if (!hasJSDoc(node)) {
          context.report({
            node: node,
            message: 'Class declarations should have JSDoc comments'
          });
          return;
        }
        
        if (!hasJSDocDescription(node)) {
          context.report({
            node: node,
            message: 'JSDoc comments should include a description'
          });
        }
      },
      
      // Check method definitions
      'MethodDefinition': function(node) {
        // Skip constructors and private methods
        if (node.kind === 'constructor' || (node.key.type === 'PrivateIdentifier')) {
          return;
        }
        
        if (!hasJSDoc(node)) {
          context.report({
            node: node,
            message: 'Method definitions should have JSDoc comments'
          });
          return;
        }
        
        if (!hasJSDocDescription(node)) {
          context.report({
            node: node,
            message: 'JSDoc comments should include a description'
          });
        }
        
        if (!hasParamTags(node.value)) {
          context.report({
            node: node,
            message: 'JSDoc comments should document all parameters'
          });
        }
        
        if (!hasReturnTag(node.value)) {
          context.report({
            node: node,
            message: 'JSDoc comments should include a @returns tag for methods that return values'
          });
        }
      },
      
      // Check exported functions and variables
      'ExportNamedDeclaration': function(node) {
        if (!node.declaration) {
          return;
        }
        
        if (node.declaration.type === 'FunctionDeclaration' || 
            node.declaration.type === 'ClassDeclaration') {
          if (!hasJSDoc(node.declaration)) {
            context.report({
              node: node.declaration,
              message: 'Exported declarations should have JSDoc comments'
            });
          }
        } else if (node.declaration.type === 'VariableDeclaration') {
          for (const declarator of node.declaration.declarations) {
            if (declarator.init && 
                (declarator.init.type === 'FunctionExpression' || 
                 declarator.init.type === 'ArrowFunctionExpression')) {
              if (!hasJSDoc(node.declaration)) {
                context.report({
                  node: declarator,
                  message: 'Exported function variables should have JSDoc comments'
                });
              }
            }
          }
        }
      }
    };
  }
}; 