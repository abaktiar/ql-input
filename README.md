# QL Input Component

A comprehensive QL (Query Language) input component built with React, TypeScript, and shadcn/ui. Features intelligent autocomplete, syntax highlighting, query parsing, and validation.

![QL Input Demo](https://via.placeholder.com/800x400/1f2937/ffffff?text=QL+Input+Component+Demo)

## ✨ Features

### Core Functionality
- 🔍 **Context-aware autocomplete** - Smart suggestions based on query context
- 🎨 **Visual feedback** - Query validation status and condition count
- ⌨️ **Keyboard navigation** - Full keyboard support (↑↓ Enter Esc Tab)
- 🔧 **Configurable fields** - Define custom fields, operators, and values
- 📝 **Query parsing** - Complete QL query structure parsing
- 🎯 **Parentheses grouping** - Support for complex condition grouping

### Advanced Features
- 🌐 **Async value suggestions** - Server-side value fetching with debouncing
- 🔄 **Function support** - Built-in functions like `currentUser()`, `now()`, etc.
- 📊 **ORDER BY clauses** - Sorting with ASC/DESC support
- 🌙 **Dark mode** - Full theming support
- ♿ **Accessibility** - ARIA attributes for screen readers
- 📱 **Responsive design** - Works across different screen sizes

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:5173` to see the interactive demo.

## 📖 Usage

```tsx
import { QLInput } from '@/components/ui/ql-input';
import type { QLInputConfig } from '@/lib/ql-types';

const config: QLInputConfig = {
  fields: [
    {
      name: 'project',
      displayName: 'Project',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN'],
      options: [
        { value: 'PROJ1', displayValue: 'Project Alpha' }
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

  const handleAsyncSuggestions = async (field: string, input: string) => {
    // Fetch users from your API
    const users = await fetchUsers(input);
    return users.map(user => ({
      value: user.id,
      displayValue: user.name
    }));
  };

  return (
    <QLInput
      value={query}
      onChange={(value, parsedQuery) => {
        setQuery(value);
        console.log('Parsed:', parsedQuery);
      }}
      onExecute={(query) => {
        console.log('Execute:', query);
      }}
      config={config}
      getAsyncValueSuggestions={handleAsyncSuggestions}
      placeholder="Enter your QL query..."
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

## 🏗️ Architecture

```
src/
├── components/
│   ├── ui/
│   │   ├── ql-input.tsx       # Main QL input component
│   │   ├── input.tsx          # Base input component
│   │   ├── popover.tsx        # Suggestion popover
│   │   └── command.tsx        # Command palette
│   └── ql-demo.tsx            # Demo component
├── lib/
│   ├── ql-types.ts            # TypeScript types
│   ├── ql-parser.ts           # Query parser
│   └── ql-suggestions.ts      # Suggestion engine
├── hooks/
│   ├── use-ql-input.ts        # Main input logic
│   └── use-debounce.ts        # Debouncing utility
docs/
├── README.md                  # Documentation index
├── FINAL_SUMMARY.md           # Project status and features
├── USAGE_EXAMPLES.md          # Implementation examples
├── TESTING.md                 # Testing guide
└── CLEANUP_GUIDE.md           # Maintenance procedures
tests/
├── unit/                      # Unit tests
├── integration/               # Integration tests
└── e2e/                       # End-to-end tests
```

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

Complete documentation is available in the [`docs/`](docs/) directory:

- **[Documentation Index](docs/README.md)** - Complete documentation overview
- **[Final Summary](docs/FINAL_SUMMARY.md)** - Project status and features
- **[Usage Examples](docs/USAGE_EXAMPLES.md)** - Implementation patterns and examples
- **[Testing Guide](docs/TESTING.md)** - Testing setup and procedures
- **[Cleanup Guide](docs/CLEANUP_GUIDE.md)** - Maintenance and cleanup procedures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
