/**
 * @fileoverview ESLint configuration with basic rules to keep the codebase manageable
 */

module.exports = {
  env: {
    node: true,
    es2021: true,
    browser: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  extends: ['eslint:recommended'],
  rules: {
    // Possible Errors
    'no-console': ['warn', { allow: ['warn', 'error'] }], // Disallow console.log but allow console.warn/error
    'no-debugger': 'error', // Disallow debugger statements
    'no-duplicate-case': 'error', // Disallow duplicate case labels
    'no-irregular-whitespace': 'error', // Disallow irregular whitespace

    // Best Practices
    'curly': ['error', 'all'], // Enforce consistent brace style for all control statements
    'default-case': 'error', // Require default case in switch statements
    'eqeqeq': ['error', 'always'], // Require === and !==
    'no-eval': 'error', // Disallow eval()
    'no-implied-eval': 'error', // Disallow implied eval()
    'no-return-await': 'error', // Disallow unnecessary return await
    'no-throw-literal': 'error', // Require throwing Error objects
    'no-unused-expressions': 'error', // Disallow unused expressions
    'no-useless-return': 'error', // Disallow redundant return statements

    // Variables
    'no-unused-vars': ['error', { 
      vars: 'all', 
      args: 'after-used',
      ignoreRestSiblings: true 
    }], // Disallow unused variables
    'no-use-before-define': ['error', { 
      functions: false, 
      classes: true, 
      variables: true 
    }], // Disallow use before define

    // Stylistic Issues
    'array-bracket-spacing': ['error', 'never'], // Enforce consistent spacing inside array brackets
    'block-spacing': ['error', 'always'], // Enforce consistent spacing inside blocks
    'brace-style': ['error', '1tbs', { allowSingleLine: true }], // Enforce consistent brace style
    'camelcase': ['error', { properties: 'never' }], // Enforce camelcase naming convention
    'comma-dangle': ['error', 'always-multiline'], // Require trailing commas in multiline objects
    'comma-spacing': ['error', { before: false, after: true }], // Enforce spacing around commas
    'comma-style': ['error', 'last'], // Enforce consistent comma style
    'indent': ['error', 2, { SwitchCase: 1 }], // Enforce consistent indentation
    'key-spacing': ['error', { beforeColon: false, afterColon: true }], // Enforce consistent spacing between keys and values in object literals
    'keyword-spacing': ['error', { before: true, after: true }], // Enforce consistent spacing around keywords
    'linebreak-style': ['error', 'windows'], // Enforce consistent linebreak style
    'max-len': ['error', { 
      code: 100, 
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true
    }], // Enforce maximum line length
    'no-mixed-spaces-and-tabs': 'error', // Disallow mixed spaces and tabs for indentation
    'no-multi-spaces': 'error', // Disallow multiple spaces
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }], // Disallow multiple empty lines
    'no-trailing-spaces': 'error', // Disallow trailing whitespace at the end of lines
    'object-curly-spacing': ['error', 'always'], // Enforce consistent spacing inside braces
    'quotes': ['error', 'single', { avoidEscape: true }], // Enforce the consistent use of single quotes
    'semi': ['error', 'always'], // Require semicolons
    'semi-spacing': ['error', { before: false, after: true }], // Enforce consistent spacing before and after semicolons
    'space-before-blocks': 'error', // Enforce consistent spacing before blocks
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }], // Enforce consistent spacing before function parenthesis
    'space-in-parens': ['error', 'never'], // Enforce consistent spacing inside parentheses
    'space-infix-ops': 'error', // Require spacing around infix operators

    // ES6
    'arrow-parens': ['error', 'always'], // Require parentheses around arrow function arguments
    'arrow-spacing': ['error', { before: true, after: true }], // Enforce consistent spacing before and after the arrow in arrow functions
    'no-var': 'error', // Require let or const instead of var
    'prefer-const': 'error', // Require const declarations for variables that are never reassigned
    'prefer-template': 'error', // Require template literals instead of string concatenation
    'template-curly-spacing': ['error', 'never'], // Enforce consistent spacing inside template literals
  }
}; 