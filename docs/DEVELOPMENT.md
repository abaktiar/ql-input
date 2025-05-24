# Development Guide

This comprehensive guide covers development setup, implementation patterns, and advanced usage for both the QL parser and React component packages.

**🌐 [Live Demo](https://ql-input.netlify.app/)** - See the component in action!

## 🚀 Development Setup

### Prerequisites

- **Node.js** 18+ and npm
- **TypeScript** knowledge for type safety
- **React** knowledge for component usage

### Quick Start

```bash
# Clone and install dependencies
git clone <repository-url>
cd ql-input
npm install

# Start development server
npm run dev

# Build packages
npm run build:packages
```

Visit `http://localhost:5173` for local development or try the **[Live Demo](https://ql-input.netlify.app/)** to explore all features.

## 🏗️ Project Architecture

### Package Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── ql-input.tsx       # Main QL input component
│   │   └── icons.tsx          # Icon components
│   └── ql-demo.tsx            # Demo component
├── lib/
│   ├── ql-types.ts            # TypeScript types
│   ├── ql-parser.ts           # Query parser
│   ├── ql-expression-parser.ts # Expression tree builder
│   ├── ql-query-builder.ts    # Query format converters
│   ├── ql-suggestions.ts      # Suggestion engine
│   └── utils.ts               # Utility functions
├── hooks/
│   ├── use-ql-input.ts        # Main input logic
│   └── use-debounce.ts        # Debouncing utility
├── styles.css                 # Component styles
├── index.input.ts             # Input package entry point
└── lib/index.parser.ts        # Parser package entry point
```

### Dual Package Strategy

1. **Parser Package** (`@abaktiar/ql-parser`)
   - Framework-agnostic core parsing logic
   - Zero dependencies
   - Exports: `QLParser`, `QLExpressionParser`, query builders

2. **Input Component Package** (`@abaktiar/ql-input`)
   - React component with full UI
   - Includes parser as dependency
   - Exports: `QLInput`, hooks, and all parser functionality

## 📖 Implementation Examples

### Parser-Only Usage (Framework-Agnostic)

```bash
npm install @abaktiar/ql-parser
```

```typescript
import { QLParser, QLInputConfig } from '@abaktiar/ql-parser';

const config: QLInputConfig = {
  fields: [
    {
      name: 'status',
      displayName: 'Status',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN'],
      options: [
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' }
      ]
    },
    {
      name: 'assignee',
      displayName: 'Assignee',
      type: 'user',
      operators: ['=', '!=', 'IS EMPTY']
    }
  ],
  allowParentheses: true,
  allowOrderBy: true,
  functions: [
    {
      name: 'currentUser',
      displayName: 'Current User',
      description: 'Returns the current logged-in user',
      returnType: 'string'
    }
  ]
};

const parser = new QLParser(config);

// Parse a query
const query = parser.parse('status = "open" AND assignee = currentUser() ORDER BY created DESC');

console.log(query);
// {
//   where: { type: 'logical', operator: 'AND', conditions: [...] },
//   orderBy: [{ field: 'created', direction: 'DESC' }],
//   valid: true,
//   errors: []
// }
```

### React Component Usage (Full UI)

```bash
npm install @abaktiar/ql-input
```

```tsx
import React, { useState } from 'react';
import { QLInput } from '@abaktiar/ql-input';
import '@abaktiar/ql-input/styles.css';
import type { QLInputConfig, QLQuery } from '@abaktiar/ql-input';

const config: QLInputConfig = {
  fields: [
    {
      name: 'project',
      displayName: 'Project',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN'],
      options: [
        { value: 'PROJ1', label: 'Project Alpha' },
        { value: 'PROJ2', label: 'Project Beta' }
      ]
    },
    {
      name: 'assignee',
      displayName: 'Assignee',
      type: 'user',
      operators: ['=', '!=', 'IS EMPTY'],
      asyncValueSuggestions: true
    }
  ],
  allowParentheses: true,
  allowOrderBy: true,
  maxSuggestions: 10
};

function MyComponent() {
  const [query, setQuery] = useState('');

  const handleChange = (value: string, parsedQuery: QLQuery) => {
    setQuery(value);
    console.log('Parsed:', parsedQuery);
  };

  const handleAsyncSuggestions = async (field: string, input: string) => {
    // Fetch users from your API
    const users = await fetchUsers(input);
    return users.map(user => ({
      value: user.id,
      label: user.name
    }));
  };

  return (
    <QLInput
      value={query}
      onChange={handleChange}
      config={config}
      getAsyncValueSuggestions={handleAsyncSuggestions}
      placeholder="Enter your QL query..."
      showSearchIcon={true}  // Optional: default is true
      showClearIcon={true}   // Optional: default is true
    />
  );
}
```

## 🔧 Advanced Configuration

### Field Types and Operators

```typescript
const advancedConfig: QLInputConfig = {
  fields: [
    // Option field with predefined values
    {
      name: 'priority',
      displayName: 'Priority',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN'],
      sortable: true,
      options: [
        { value: 'high', label: 'High Priority' },
        { value: 'medium', label: 'Medium Priority' },
        { value: 'low', label: 'Low Priority' }
      ]
    },

    // User field with async suggestions
    {
      name: 'assignee',
      displayName: 'Assignee',
      type: 'user',
      operators: ['=', '!=', 'IS EMPTY', 'IS NOT EMPTY'],
      asyncValueSuggestions: true
    },

    // Date field
    {
      name: 'created',
      displayName: 'Created Date',
      type: 'date',
      operators: ['=', '!=', '>', '<', '>=', '<='],
      sortable: true
    },

    // Text field
    {
      name: 'description',
      displayName: 'Description',
      type: 'text',
      operators: ['CONTAINS', 'NOT CONTAINS', 'IS EMPTY']
    }
  ],

  // Built-in functions
  functions: [
    {
      name: 'currentUser',
      displayName: 'Current User',
      description: 'Returns the current logged-in user',
      returnType: 'string'
    },
    {
      name: 'now',
      displayName: 'Current Time',
      description: 'Returns the current date and time',
      returnType: 'date'
    }
  ],

  // Configuration options
  allowParentheses: true,
  allowOrderBy: true,
  allowFunctions: true,
  maxSuggestions: 15,
  caseSensitive: false
};
```

### Backend Integration Patterns

#### MongoDB Query Building

```typescript
import { QLParser, QLQueryBuilder } from '@abaktiar/ql-parser';

const parser = new QLParser(config);
const queryBuilder = new QLQueryBuilder();

const parsedQuery = parser.parse('status = "open" AND priority IN ("high", "medium")');

if (parsedQuery.valid) {
  const mongoQuery = queryBuilder.toMongoDB(parsedQuery);
  console.log(mongoQuery);
  // {
  //   $and: [
  //     { status: "open" },
  //     { priority: { $in: ["high", "medium"] } }
  //   ]
  // }
}
```

#### SQL Query Building

```typescript
const sqlQuery = queryBuilder.toSQL(parsedQuery, 'tasks');
console.log(sqlQuery);
// {
//   query: "SELECT * FROM tasks WHERE status = ? AND priority IN (?, ?)",
//   params: ["open", "high", "medium"]
// }
```

#### Custom Query Building

```typescript
const customQuery = queryBuilder.toCustom(parsedQuery, {
  fieldMapping: {
    'assignee': 'assigned_user_id',
    'created': 'created_at'
  },
  operatorMapping: {
    '=': 'equals',
    'IN': 'in_list'
  }
});
```

## 🎨 Styling and Theming

### CSS Custom Properties

The component supports extensive theming through CSS custom properties:

```css
.ql-input {
  /* Colors */
  --ql-bg-color: #ffffff;
  --ql-border-color: #d1d5db;
  --ql-text-color: #374151;
  --ql-placeholder-color: #9ca3af;

  /* Focus states */
  --ql-focus-border-color: #3b82f6;
  --ql-focus-ring-color: rgba(59, 130, 246, 0.1);

  /* Suggestions */
  --ql-suggestion-bg: #ffffff;
  --ql-suggestion-hover-bg: #f3f4f6;
  --ql-suggestion-selected-bg: #3b82f6;
  --ql-suggestion-selected-color: #ffffff;

  /* Icons */
  --ql-icon-color: #6b7280;
  --ql-icon-hover-color: #374151;
}

/* Dark mode */
.ql-input.dark {
  --ql-bg-color: #1f2937;
  --ql-border-color: #374151;
  --ql-text-color: #f9fafb;
  --ql-placeholder-color: #9ca3af;
  --ql-suggestion-bg: #374151;
  --ql-suggestion-hover-bg: #4b5563;
}
```

### Custom Icon Configuration

```tsx
import { QLInput } from '@abaktiar/ql-input';

function CustomIconExample() {
  return (
    <QLInput
      config={config}
      showSearchIcon={false}  // Hide search icon
      showClearIcon={true}    // Show clear icon
      // Custom icons can be added via CSS
      className="custom-ql-input"
    />
  );
}
```

## 🧪 Development Commands

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Build demo application
npm run preview               # Preview built application

# Package Building
npm run build:parser          # Build parser package
npm run build:input           # Build input component package
npm run build:packages        # Build both packages

# Testing
npm test                      # Run all tests
npm run test:unit             # Run unit tests
npm run test:integration      # Run integration tests
npm run test:e2e              # Run end-to-end tests
npm run test:clean            # Clean test artifacts

# Linting and Formatting
npm run lint                  # Run ESLint
npm run lint:fix              # Fix ESLint issues
npm run type-check            # Run TypeScript checks
```

## 🔍 Debugging and Troubleshooting

### Common Issues

1. **Autocomplete not working**
   - Check field configuration
   - Verify async suggestion function
   - Check console for errors

2. **Styling issues**
   - Import CSS: `import '@abaktiar/ql-input/styles.css'`
   - Check CSS custom properties
   - Verify no conflicting styles

3. **TypeScript errors**
   - Ensure proper type imports
   - Check field configuration types
   - Verify callback function signatures

### Debug Mode

Enable debug logging:

```typescript
const parser = new QLParser(config, { debug: true });
```

### Performance Optimization

```typescript
// Debounce async suggestions
const debouncedSuggestions = useMemo(
  () => debounce(getAsyncValueSuggestions, 300),
  [getAsyncValueSuggestions]
);

// Memoize configuration
const memoizedConfig = useMemo(() => config, [/* dependencies */]);
```
```
