# @abaktiar/ql-parser

A powerful, framework-agnostic QL (Query Language) parser and builder for creating complex queries with support for logical operators, functions, parentheses grouping, and ORDER BY clauses.

**🌐 [Live Demo](https://ql-input.netlify.app/)** - See the parser in action with the React component!

[![npm version](https://badge.fury.io/js/@abaktiar%2Fql-parser.svg)](https://badge.fury.io/js/@abaktiar%2Fql-parser)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🔍 **Complete Query Parsing** - Parse complex QL queries into structured AST
- 🧮 **Expression Trees** - Build hierarchical expression trees with proper operator precedence
- 🔧 **Query Building** - Convert parsed queries to MongoDB, SQL, or custom formats
- 📝 **TypeScript Support** - Full type safety with comprehensive interfaces
- 🎯 **Parentheses Grouping** - Support for complex condition grouping
- 📊 **ORDER BY Support** - Sorting clauses with ASC/DESC directions
- 🔄 **Function Support** - Built-in functions like `currentUser()`, `now()`, etc.
- ⚡ **Zero Dependencies** - Lightweight with no external dependencies
- 🌐 **Framework Agnostic** - Works with any JavaScript framework or vanilla JS

## 📦 Installation

```bash
npm install @abaktiar/ql-parser
```

```bash
yarn add @abaktiar/ql-parser
```

```bash
pnpm add @abaktiar/ql-parser
```

## 🚀 Quick Start

```typescript
import { QLParser, QLInputConfig } from '@abaktiar/ql-parser';

// Define your field configuration
const config: QLInputConfig = {
  fields: [
    {
      name: 'status',
      displayName: 'Status',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN'],
      options: [
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
        { value: 'pending', label: 'Pending' }
      ]
    },
    {
      name: 'assignee',
      displayName: 'Assignee',
      type: 'user',
      operators: ['=', '!=', 'IS EMPTY', 'IS NOT EMPTY']
    },
    {
      name: 'created',
      displayName: 'Created Date',
      type: 'date',
      operators: ['=', '>', '<', '>=', '<='],
      sortable: true
    }
  ],
  maxSuggestions: 10,
  caseSensitive: false,
  allowParentheses: true,
  allowOrderBy: true,
  allowFunctions: true
};

// Create parser instance
const parser = new QLParser(config);

// Parse a query
const query = parser.parse('status = "open" AND (assignee = currentUser() OR assignee IS EMPTY) ORDER BY created DESC');

console.log(query);
// Output: Structured QLQuery object with parsed expressions and order by clause
```

## 📖 Core Concepts

### Query Structure

A QL query consists of:
1. **WHERE clause** - Conditions and logical operators
2. **ORDER BY clause** - Sorting specifications (optional)

```
status = "open" AND assignee = currentUser() ORDER BY created DESC, priority ASC
```

### Supported Operators

#### Comparison Operators
- `=` - Equals
- `!=` - Not equals
- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal
- `<=` - Less than or equal

#### Text Operators
- `~` - Contains (case-insensitive)
- `!~` - Does not contain

#### List Operators
- `IN` - Value in list
- `NOT IN` - Value not in list

#### Null Operators
- `IS EMPTY` - Field is empty/null
- `IS NOT EMPTY` - Field is not empty/null

#### Logical Operators
- `AND` - Logical AND
- `OR` - Logical OR
- `NOT` - Logical NOT (prefix)

### Functions

Built-in functions for dynamic values:
- `currentUser()` - Current user identifier
- `now()` - Current timestamp
- `today()` - Today's date
- `startOfWeek()` - Start of current week
- `endOfWeek()` - End of current week
- `startOfMonth()` - Start of current month
- `endOfMonth()` - End of current month

## 🔧 API Reference

### QLParser

Main parser class for tokenizing and parsing QL queries.

```typescript
class QLParser {
  constructor(config: QLInputConfig)

  // Tokenize input string into tokens
  tokenize(input: string): QLToken[]

  // Parse input string into structured query
  parse(input: string): QLQuery
}
```

### QLExpressionParser

Builds hierarchical expression trees from tokens.

```typescript
class QLExpressionParser {
  // Parse tokens into expression tree
  parse(tokens: QLToken[]): QLExpression | null
}
```

### Query Builder Functions

Convert parsed queries to different formats:

```typescript
// Convert to MongoDB query
function toMongooseQuery(query: QLQuery): object

// Convert to SQL WHERE clause
function toSQLQuery(query: QLQuery): string

// Print expression as readable string
function printExpression(expression: QLExpression): string

// Count total conditions in query
function countConditions(query: QLQuery): number
```

## 💡 Usage Examples

### Basic Parsing

```typescript
const parser = new QLParser(config);

// Simple condition
const simple = parser.parse('status = "open"');

// Multiple conditions with AND
const multiple = parser.parse('status = "open" AND priority = "high"');

// Conditions with OR
const withOr = parser.parse('status = "open" OR status = "pending"');

// Complex grouping with parentheses
const complex = parser.parse('(status = "open" OR status = "pending") AND assignee = currentUser()');
```

### Working with Functions

```typescript
// Using built-in functions
const withFunctions = parser.parse(`
  assignee = currentUser() AND
  created >= startOfWeek() AND
  created <= endOfWeek()
`);

// Functions in lists
const functionList = parser.parse('assignee IN (currentUser(), "john.doe", "jane.smith")');
```

### ORDER BY Clauses

```typescript
// Single sort field
const singleSort = parser.parse('status = "open" ORDER BY created DESC');

// Multiple sort fields
const multiSort = parser.parse('status = "open" ORDER BY priority ASC, created DESC');

// Sort only (no WHERE clause)
const sortOnly = parser.parse('ORDER BY created DESC');
```

### Converting to Different Formats

```typescript
import { toMongooseQuery, toSQLQuery, printExpression } from '@abaktiar/ql-parser';

const query = parser.parse('status = "open" AND assignee = currentUser()');

// Convert to MongoDB query
const mongoQuery = toMongooseQuery(query);
console.log(mongoQuery);
// Output: { status: "open", assignee: "currentUser()" }

// Convert to SQL
const sqlQuery = toSQLQuery(query);
console.log(sqlQuery);
// Output: "status = 'open' AND assignee = 'currentUser()'"

// Print as readable string
if (query.where) {
  const readable = printExpression(query.where);
  console.log(readable);
  // Output: "status = "open" AND assignee = currentUser()"
}
```

### Error Handling

```typescript
const query = parser.parse('invalid query syntax');

if (!query.valid) {
  console.log('Parse errors:', query.errors);
  // Handle parsing errors
}
```

### Working with Tokens

```typescript
// Get detailed token information
const tokens = parser.tokenize('status = "open" AND assignee = currentUser()');

tokens.forEach(token => {
  console.log(`${token.type}: "${token.value}" at position ${token.start}-${token.end}`);
});
```

## 🎯 Advanced Usage

### Custom Field Types

```typescript
const config: QLInputConfig = {
  fields: [
    {
      name: 'customField',
      displayName: 'Custom Field',
      type: 'text', // or 'number', 'date', 'datetime', 'boolean', 'option', 'multiselect', 'user'
      operators: ['=', '!=', '~', '!~'],
      description: 'A custom field for demonstration'
    }
  ],
  // ... other config options
};
```

### Complex Expressions

```typescript
// Nested parentheses
const nested = parser.parse(`
  (status = "open" OR status = "pending") AND
  (assignee = currentUser() OR (assignee IS EMPTY AND priority = "high"))
`);

// Mixed operators
const mixed = parser.parse(`
  status IN ("open", "pending") AND
  title ~ "urgent" AND
  created >= startOfWeek() AND
  assignee IS NOT EMPTY
`);
```

### Expression Tree Traversal

```typescript
function traverseExpression(expr: QLExpression, depth = 0): void {
  const indent = '  '.repeat(depth);

  if (expr.type === 'condition') {
    console.log(`${indent}Condition: ${expr.field} ${expr.operator} ${expr.value}`);
  } else if (expr.type === 'group') {
    console.log(`${indent}Group (${expr.operator}):`);
    expr.conditions.forEach(child => traverseExpression(child, depth + 1));
  }
}

const query = parser.parse('(status = "open" OR status = "pending") AND assignee = currentUser()');
if (query.where) {
  traverseExpression(query.where);
}
```

## 📚 Type Definitions

### Core Types

```typescript
// Field configuration
interface QLField {
  name: string;
  displayName: string;
  type: FieldType;
  operators: OperatorType[];
  sortable?: boolean;
  description?: string;
  options?: QLValue[];
  asyncValueSuggestions?: boolean;
}

// Parsed query result
interface QLQuery {
  where?: QLExpression;
  orderBy?: QLOrderBy[];
  raw: string;
  valid: boolean;
  errors: string[];
}

// Expression tree node
interface QLExpression {
  type: 'condition' | 'group';
  // ... additional properties based on type
}
```

## 🤝 Related Packages

- **[@abaktiar/ql-input](https://www.npmjs.com/package/@abaktiar/ql-input)** - React component with UI for this parser

## 📄 License

MIT © [abaktiar](https://github.com/abaktiar)

## 🐛 Issues & Support

Please report issues on [GitHub Issues](https://github.com/abaktiar/ql-input/issues).
