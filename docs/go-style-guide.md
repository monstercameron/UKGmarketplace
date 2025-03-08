# Go-Style Syntax Guide for JavaScript

This document outlines the Go-style syntax rules we're enforcing in our JavaScript codebase using ESLint. These rules are designed to make our JavaScript code more consistent and follow patterns similar to Go's syntax style.

## Key Principles

1. **Simplicity**: Prefer simple, straightforward code over complex constructs
2. **Consistency**: Follow consistent patterns throughout the codebase
3. **Readability**: Optimize for readability and maintainability
4. **Explicitness**: Be explicit rather than implicit

## Formatting Rules

### Indentation and Spacing

- Use 2 spaces for indentation (similar to Go's tab-based indentation but with spaces)
- No spaces inside object literals: `{key: value}` not `{ key: value }`
- Always use spaces after commas: `[1, 2, 3]` not `[1,2,3]`
- No space before function parentheses: `function foo() {}` not `function foo () {}`
- Always use a space before blocks: `if (condition) {` not `if (condition){`
- Always use spaces around operators: `a + b` not `a+b`

### Line Length and Breaks

- Maximum line length of 100 characters
- Use trailing commas in multiline object and array literals
- Consistent line breaks after opening and before closing braces

### Semicolons and Braces

- Always use semicolons (Go uses semicolons, though they're often implicit)
- Always use braces for all control structures (Go requires braces)
- Use the "one true brace style" (1TBS) where the opening brace is on the same line

## Naming Conventions

- Use camelCase for variables and functions (Go uses camelCase or PascalCase)
- Use PascalCase for constructor functions and classes (similar to Go's exported identifiers)
- Use descriptive, meaningful names (Go emphasizes clear, concise naming)

## Code Structure

- Prefer `const` over `let` when variables won't be reassigned
- Use template literals instead of string concatenation
- Use destructuring where appropriate
- Use rest parameters instead of `arguments`
- Use spread operators instead of `.apply()`

## Error Handling

- Always handle errors explicitly (similar to Go's explicit error handling)
- Use consistent error callback patterns

## Import/Export

- Sort imports consistently
- Group imports logically

## Running the Linter

To check your code against these rules:

```bash
npm run lint:backend
```

To automatically fix issues where possible:

```bash
npm run lint:backend:fix
```

## Examples

### Go-Style JavaScript

```javascript
// Imports grouped and sorted
import fs from 'fs';
import path from 'path';
import {doSomething} from './utils.js';

// Constants at the top
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 1000;

/**
 * Processes a file with Go-style syntax.
 * @param {string} filePath - Path to the file
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Processing result
 */
async function processFile(filePath, options) {
  const {timeout = DEFAULT_TIMEOUT, retries = MAX_RETRIES} = options;
  
  // Error handling similar to Go's explicit approach
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return {
      success: true,
      data: content,
      timestamp: Date.now(),
    };
  } catch (err) {
    // Explicit error handling
    console.error(`Failed to process file: ${err.message}`);
    return {
      success: false,
      error: err.message,
    };
  }
}

// Export at the end
export default processFile;
```

This style guide helps maintain consistency across our codebase and makes it easier for developers familiar with Go to work with our JavaScript code. 