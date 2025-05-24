# QL Input & Parser

A comprehensive Query Language (QL) solution with both a framework-agnostic parser and a React input component. Build powerful search interfaces with intelligent autocomplete, syntax highlighting, and robust query parsing.

**🌐 [Live Demo](https://ql-input.netlify.app/)** - Try it out in your browser!

![QL Input Demo](https://via.placeholder.com/800x400/1f2937/ffffff?text=QL+Input+Component+Demo)

## 📦 Dual Package Architecture

This repository provides two complementary packages:

### [@abaktiar/ql-parser](https://www.npmjs.com/package/@abaktiar/ql-parser) - Framework-Agnostic Parser
- 🔍 **Complete Query Parsing** - Parse complex QL queries into structured AST
- 🧮 **Expression Trees** - Build hierarchical expression trees with proper operator precedence
- 🔧 **Query Building** - Convert parsed queries to MongoDB, SQL, or custom formats
- ⚡ **Zero Dependencies** - Lightweight with no external dependencies
- 🌐 **Framework Agnostic** - Works with any JavaScript framework or vanilla JS

### [@abaktiar/ql-input](https://www.npmjs.com/package/@abaktiar/ql-input) - React Component
- 🎨 **Visual Interface** - Beautiful React component with intelligent autocomplete
- ⌨️ **Keyboard Navigation** - Full keyboard support (↑↓ Enter Esc Tab)
- 🔧 **Configurable Fields** - Define custom fields, operators, and values
- 👁️ **Icon Customization** - Control search and clear icon visibility
- 🌙 **Dark Mode** - Full theming support with CSS custom properties
- ♿ **Accessibility** - ARIA attributes for screen readers

## ✨ Core Features

### Query Language Support
- 📝 **WHERE Clauses** - Complex conditions with logical operators (AND, OR, NOT)
- 📊 **ORDER BY Clauses** - Sorting with ASC/DESC support
- 🎯 **Parentheses Grouping** - Support for complex condition grouping
- 🔄 **Function Support** - Built-in functions like `currentUser()`, `now()`, etc.
- 📋 **IN/NOT IN Operators** - List-based filtering with multi-value support
- 🔤 **Auto-quoting** - Automatic quoting of multi-word values

### Developer Experience
- 📝 **TypeScript Support** - Full type safety with comprehensive interfaces
- 🧪 **Comprehensive Testing** - Unit, integration, and E2E test suites
- 📚 **Rich Documentation** - Detailed guides and examples
- 🎯 **Easy Integration** - Simple setup for both packages

## 🚀 Quick Start

### Development Setup

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

Visit `http://localhost:5173` for local development or check out the **[Live Demo](https://ql-input.netlify.app/)** to see it in action!

## 📖 Package Usage

### Using the Parser Only (Lightweight)

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
    }
  ],
  allowParentheses: true,
  allowOrderBy: true
};

const parser = new QLParser(config);
const query = parser.parse('status = "open" AND assignee = currentUser() ORDER BY created DESC');

console.log(query);
// { where: {...}, orderBy: [...], valid: true, errors: [] }
```

### Using the React Component (Full UI)

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
        { value: 'PROJ1', label: 'Project Alpha' }
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

## 🎯 Example Queries

The component supports complex QL queries:

```sql
# Basic field filtering
project = PROJ1 AND status = "In Progress"

# User functions
assignee = currentUser() AND priority IN (High, Highest)

# Date functions with ordering
created >= startOfWeek() ORDER BY priority DESC

# Text search
summary ~ "bug" AND status != Done

# Complex grouping
(project = PROJ1 OR project = PROJ2) AND assignee IS NOT EMPTY
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate through suggestions |
| `Enter` | Select highlighted suggestion or execute query |
| `Tab` | Accept current suggestion |
| `Esc` | Close suggestions dropdown |

## 🔧 Configuration

### Field Types

- `text` - Text fields with `~`, `!~`, `IS EMPTY` operators
- `number` - Numeric fields with comparison operators
- `date`/`datetime` - Date fields with date functions
- `user` - User fields with `currentUser()` function
- `option` - Predefined option lists
- `multiselect` - Multiple value selection

### Available Operators

- **Equality**: `=`, `!=`, `<>`
- **Comparison**: `>`, `<`, `>=`, `<=`
- **Text**: `~` (contains), `!~` (does not contain)
- **Lists**: `IN`, `NOT IN`
- **Null checks**: `IS EMPTY`, `IS NOT EMPTY`, `IS NULL`, `IS NOT NULL`

### Built-in Functions

- `currentUser()` - Current logged-in user
- `now()` - Current date/time
- `startOfDay()` - Start of current day
- `endOfDay()` - End of current day
- `startOfWeek()` - Start of current week
- `endOfWeek()` - End of current week

## 🏗️ Development Guide

### Project Structure

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

### Development Commands

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

# Publishing
npm run publish:parser        # Publish parser package
npm run publish:input         # Publish input component package
npm run publish:all           # Publish both packages
```

### Package Architecture

The project uses a dual-package strategy:

1. **Parser Package** (`@abaktiar/ql-parser`)
   - Framework-agnostic core parsing logic
   - Zero dependencies
   - Exports: `QLParser`, `QLExpressionParser`, query builders

2. **Input Component Package** (`@abaktiar/ql-input`)
   - React component with full UI
   - Includes parser as dependency
   - Exports: `QLInput`, hooks, and all parser functionality

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Development and debugging
npm run test:headed      # Run with browser UI
npm run test:debug       # Debug mode
npm run test:ui          # Playwright UI
npm run test:report      # View HTML report

# Cleanup test artifacts
npm run test:clean       # Remove test results, reports, and cache
```

For detailed testing information, see [Testing Guide](docs/TESTING.md) and [Cleanup Guide](docs/CLEANUP_GUIDE.md).

## 📚 Documentation

### Package Documentation
- **[@abaktiar/ql-parser](README-parser.md)** - Parser package documentation
- **[@abaktiar/ql-input](README-input.md)** - React component documentation

### Development Documentation
- **[Documentation Index](docs/README.md)** - Complete documentation overview
- **[Development Guide](docs/DEVELOPMENT.md)** - Implementation patterns and examples
- **[Testing Guide](docs/TESTING.md)** - Testing setup and procedures
- **[Publishing Guide](docs/PUBLISHING.md)** - Package publishing instructions
- **[Cleanup Guide](docs/CLEANUP_GUIDE.md)** - Maintenance and cleanup procedures

## 🤝 Contributing

### Development Workflow
1. **Fork the repository** and clone locally
2. **Install dependencies**: `npm install`
3. **Start development server**: `npm run dev`
4. **Make your changes** with proper testing
5. **Run tests**: `npm test`
6. **Build packages**: `npm run build:packages`
7. **Submit a pull request**

### Code Standards
- ✅ **TypeScript** - All code must be properly typed
- ✅ **Testing** - Add tests for new features
- ✅ **Documentation** - Update docs for API changes
- ✅ **Linting** - Follow ESLint configuration

### Testing Requirements
- **Unit tests** for core logic changes
- **Integration tests** for component interactions
- **E2E tests** for user workflow changes
- **All tests must pass** before merging

## 📄 License

MIT License - see LICENSE file for details.

---

**Ready to build powerful query interfaces?** Start with the [Quick Start](#-quick-start) guide above! 🚀
