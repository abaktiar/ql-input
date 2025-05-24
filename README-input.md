# @abaktiar/ql-input

A comprehensive React QL (Query Language) input component with intelligent autocomplete, syntax highlighting, query validation, and a beautiful UI built with TypeScript and shadcn/ui components.

[![npm version](https://badge.fury.io/js/@abaktiar%2Fql-input.svg)](https://badge.fury.io/js/@abaktiar%2Fql-input)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

## 📦 Installation

```bash
npm install @abaktiar/ql-input
```

```bash
yarn add @abaktiar/ql-input
```

```bash
pnpm add @abaktiar/ql-input
```

### Peer Dependencies

Make sure you have the required peer dependencies installed:

```bash
npm install react react-dom
```

## 🚀 Quick Start

### Basic Setup

```tsx
import React from 'react';
import { QLInput } from '@abaktiar/ql-input';
import '@abaktiar/ql-input/styles.css';
import type { QLInputConfig, QLQuery } from '@abaktiar/ql-input';

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

function MyComponent() {
  const handleChange = (value: string, query: QLQuery) => {
    console.log('Query changed:', value);
    console.log('Parsed query:', query);
  };

  const handleExecute = (query: QLQuery) => {
    console.log('Query executed:', query);
    // Handle query execution (e.g., API call)
  };

  return (
    <QLInput
      config={config}
      placeholder="Enter your query..."
      onChange={handleChange}
      onExecute={handleExecute}
    />
  );
}
```

### With Tailwind CSS

If you're using Tailwind CSS, make sure to include the component styles in your CSS:

```css
@import '@abaktiar/ql-input/styles.css';
```

## 🎯 Component Props

### QLInput Props

```typescript
interface QLInputProps {
  // Configuration
  config: QLInputConfig;

  // Value control
  value?: string;
  onChange?: (value: string, query: QLQuery) => void;
  onExecute?: (query: QLQuery) => void;

  // Appearance
  placeholder?: string;
  disabled?: boolean;
  className?: string;

  // Async suggestions
  getAsyncValueSuggestions?: (field: string, typedValue: string) => Promise<QLValue[]>;
  getPredefinedValueSuggestions?: (field: string) => QLValue[];
}
```

### Configuration Options

```typescript
interface QLInputConfig {
  fields: QLField[];
  maxSuggestions?: number;
  caseSensitive?: boolean;
  allowParentheses?: boolean;
  allowOrderBy?: boolean;
  allowFunctions?: boolean;
  functions?: QLFunction[];
}
```

## 💡 Usage Examples

### Controlled Component

```tsx
import React, { useState } from 'react';
import { QLInput } from '@abaktiar/ql-input';

function ControlledExample() {
  const [query, setQuery] = useState('status = "open"');

  return (
    <QLInput
      config={config}
      value={query}
      onChange={(value) => setQuery(value)}
      placeholder="Search issues..."
    />
  );
}
```

### With Async Value Suggestions

```tsx
import React from 'react';
import { QLInput } from '@abaktiar/ql-input';

function AsyncExample() {
  const getAsyncValueSuggestions = async (field: string, typedValue: string) => {
    if (field === 'assignee') {
      // Fetch users from API
      const response = await fetch(`/api/users?search=${typedValue}`);
      const users = await response.json();
      return users.map(user => ({
        value: user.id,
        label: user.name
      }));
    }
    return [];
  };

  return (
    <QLInput
      config={config}
      getAsyncValueSuggestions={getAsyncValueSuggestions}
      placeholder="Search with async suggestions..."
    />
  );
}
```

### With Custom Functions

```tsx
import React from 'react';
import { QLInput } from '@abaktiar/ql-input';

const configWithFunctions: QLInputConfig = {
  fields: [
    // ... your fields
  ],
  allowFunctions: true,
  functions: [
    {
      name: 'currentUser',
      displayName: 'Current User',
      description: 'The currently logged-in user',
      returnType: 'user'
    },
    {
      name: 'myCustomFunction',
      displayName: 'My Custom Function',
      description: 'A custom function for demo',
      returnType: 'text'
    }
  ]
};

function CustomFunctionsExample() {
  return (
    <QLInput
      config={configWithFunctions}
      placeholder="Use functions like currentUser()..."
    />
  );
}
```

### Form Integration

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { QLInput } from '@abaktiar/ql-input';

interface FormData {
  query: string;
  // ... other fields
}

function FormExample() {
  const { register, handleSubmit, setValue, watch } = useForm<FormData>();
  const queryValue = watch('query');

  const onSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <QLInput
        config={config}
        value={queryValue}
        onChange={(value) => setValue('query', value)}
        placeholder="Enter search query..."
      />
      <button type="submit">Search</button>
    </form>
  );
}
```

### Dark Mode Support

```tsx
import React from 'react';
import { QLInput } from '@abaktiar/ql-input';

function DarkModeExample() {
  return (
    <div className="dark"> {/* or your dark mode class */}
      <QLInput
        config={config}
        placeholder="Dark mode supported..."
        className="dark:bg-gray-800 dark:text-white"
      />
    </div>
  );
}
```

## 🎨 Styling & Customization

### CSS Custom Properties

The component uses CSS custom properties for theming:

```css
:root {
  --ql-input-border: hsl(214.3 31.8% 91.4%);
  --ql-input-background: hsl(0 0% 100%);
  --ql-input-foreground: hsl(222.2 84% 4.9%);
  --ql-input-muted: hsl(210 40% 96%);
  --ql-input-muted-foreground: hsl(215.4 16.3% 46.9%);
  --ql-input-ring: hsl(222.2 84% 4.9%);
}

.dark {
  --ql-input-border: hsl(217.2 32.6% 17.5%);
  --ql-input-background: hsl(222.2 84% 4.9%);
  --ql-input-foreground: hsl(210 40% 98%);
  --ql-input-muted: hsl(217.2 32.6% 17.5%);
  --ql-input-muted-foreground: hsl(215 20.2% 65.1%);
  --ql-input-ring: hsl(212.7 26.8% 83.9%);
}
```

### Custom Styling

```tsx
import React from 'react';
import { QLInput } from '@abaktiar/ql-input';

function StyledExample() {
  return (
    <QLInput
      config={config}
      className="
        border-2 border-blue-500
        focus:border-blue-600
        rounded-lg
        shadow-lg
      "
      placeholder="Custom styled input..."
    />
  );
}
```

## 🔧 Advanced Usage

### Using the Hook Directly

```tsx
import React from 'react';
import { useQLInput } from '@abaktiar/ql-input';

function CustomInputComponent() {
  const { state, handleInputChange, handleKeyDown, selectSuggestion } = useQLInput({
    config,
    onChange: (value, query) => console.log(value, query)
  });

  return (
    <div>
      <input
        value={state.value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      {state.showSuggestions && (
        <div>
          {state.suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => selectSuggestion(suggestion)}
              className={index === state.selectedSuggestionIndex ? 'selected' : ''}
            >
              {suggestion.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Custom Suggestion Rendering

```tsx
import React from 'react';
import { QLInput, QLSuggestion } from '@abaktiar/ql-input';

function CustomSuggestionExample() {
  const renderSuggestion = (suggestion: QLSuggestion) => (
    <div className="flex items-center gap-2">
      <span className="font-medium">{suggestion.label}</span>
      {suggestion.description && (
        <span className="text-sm text-gray-500">{suggestion.description}</span>
      )}
    </div>
  );

  // Note: This is a conceptual example - actual implementation may vary
  return (
    <QLInput
      config={config}
      placeholder="Custom suggestions..."
    />
  );
}
```

## 🧪 Testing

### Testing with React Testing Library

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QLInput } from '@abaktiar/ql-input';

test('renders QL input component', () => {
  render(<QLInput config={config} placeholder="Test input" />);

  const input = screen.getByPlaceholderText('Test input');
  expect(input).toBeInTheDocument();
});

test('handles input changes', () => {
  const handleChange = jest.fn();

  render(
    <QLInput
      config={config}
      onChange={handleChange}
      placeholder="Test input"
    />
  );

  const input = screen.getByPlaceholderText('Test input');
  fireEvent.change(input, { target: { value: 'status = "open"' } });

  expect(handleChange).toHaveBeenCalled();
});
```

## 🤝 Related Packages

- **[@abaktiar/ql-parser](https://www.npmjs.com/package/@abaktiar/ql-parser)** - The underlying parser (included as dependency)

## 📄 License

MIT © [abaktiar](https://github.com/abaktiar)

## 🎯 Field Types & Operators

### Supported Field Types

```typescript
type FieldType = 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'option' | 'multiselect' | 'user';
```

#### Text Fields
```typescript
{
  name: 'title',
  displayName: 'Title',
  type: 'text',
  operators: ['=', '!=', '~', '!~', 'IS EMPTY', 'IS NOT EMPTY']
}
```

#### Number Fields
```typescript
{
  name: 'priority',
  displayName: 'Priority',
  type: 'number',
  operators: ['=', '!=', '>', '<', '>=', '<=']
}
```

#### Date/DateTime Fields
```typescript
{
  name: 'created',
  displayName: 'Created Date',
  type: 'date', // or 'datetime'
  operators: ['=', '!=', '>', '<', '>=', '<='],
  sortable: true
}
```

#### Option Fields
```typescript
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
```

#### Boolean Fields
```typescript
{
  name: 'isPublic',
  displayName: 'Is Public',
  type: 'boolean',
  operators: ['=', '!=']
}
```

#### User Fields
```typescript
{
  name: 'assignee',
  displayName: 'Assignee',
  type: 'user',
  operators: ['=', '!=', 'IS EMPTY', 'IS NOT EMPTY'],
  asyncValueSuggestions: true
}
```

### Complete Configuration Example

```typescript
import { QLInputConfig } from '@abaktiar/ql-input';

const fullConfig: QLInputConfig = {
  fields: [
    {
      name: 'title',
      displayName: 'Title',
      type: 'text',
      operators: ['=', '!=', '~', '!~', 'IS EMPTY', 'IS NOT EMPTY'],
      description: 'Issue title or summary'
    },
    {
      name: 'status',
      displayName: 'Status',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN'],
      options: [
        { value: 'open', label: 'Open' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'closed', label: 'Closed' },
        { value: 'pending', label: 'Pending Review' }
      ]
    },
    {
      name: 'priority',
      displayName: 'Priority',
      type: 'number',
      operators: ['=', '!=', '>', '<', '>=', '<='],
      sortable: true,
      options: [
        { value: '1', label: 'Low' },
        { value: '2', label: 'Medium' },
        { value: '3', label: 'High' },
        { value: '4', label: 'Critical' }
      ]
    },
    {
      name: 'assignee',
      displayName: 'Assignee',
      type: 'user',
      operators: ['=', '!=', 'IS EMPTY', 'IS NOT EMPTY'],
      asyncValueSuggestions: true
    },
    {
      name: 'created',
      displayName: 'Created Date',
      type: 'date',
      operators: ['=', '!=', '>', '<', '>=', '<='],
      sortable: true
    },
    {
      name: 'tags',
      displayName: 'Tags',
      type: 'multiselect',
      operators: ['IN', 'NOT IN'],
      options: [
        { value: 'bug', label: 'Bug' },
        { value: 'feature', label: 'Feature' },
        { value: 'enhancement', label: 'Enhancement' }
      ]
    }
  ],
  maxSuggestions: 15,
  caseSensitive: false,
  allowParentheses: true,
  allowOrderBy: true,
  allowFunctions: true,
  functions: [
    {
      name: 'currentUser',
      displayName: 'Current User',
      description: 'The currently logged-in user',
      returnType: 'user'
    },
    {
      name: 'now',
      displayName: 'Now',
      description: 'Current date and time',
      returnType: 'datetime'
    },
    {
      name: 'today',
      displayName: 'Today',
      description: 'Today\'s date',
      returnType: 'date'
    }
  ]
};
```

## 🚀 Real-World Examples

### Issue Tracking System

```tsx
import React, { useState } from 'react';
import { QLInput, QLQuery } from '@abaktiar/ql-input';

function IssueTracker() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: QLQuery) => {
    if (!query.valid) return;

    setLoading(true);
    try {
      const response = await fetch('/api/issues/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.raw })
      });
      const data = await response.json();
      setIssues(data.issues);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsers = async (field: string, search: string) => {
    if (field !== 'assignee') return [];

    const response = await fetch(`/api/users?search=${search}`);
    const users = await response.json();
    return users.map(user => ({
      value: user.id,
      label: `${user.name} (${user.email})`
    }));
  };

  return (
    <div>
      <QLInput
        config={issueConfig}
        placeholder='Search issues... e.g., status = "open" AND assignee = currentUser()'
        onExecute={handleSearch}
        getAsyncValueSuggestions={getUsers}
      />

      {loading && <div>Searching...</div>}

      <div>
        {issues.map(issue => (
          <div key={issue.id} className="issue-card">
            <h3>{issue.title}</h3>
            <p>Status: {issue.status}</p>
            <p>Assignee: {issue.assignee}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### E-commerce Product Search

```tsx
import React from 'react';
import { QLInput } from '@abaktiar/ql-input';

const productConfig = {
  fields: [
    {
      name: 'name',
      displayName: 'Product Name',
      type: 'text',
      operators: ['~', '!~', 'IS EMPTY', 'IS NOT EMPTY']
    },
    {
      name: 'category',
      displayName: 'Category',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN'],
      options: [
        { value: 'electronics', label: 'Electronics' },
        { value: 'clothing', label: 'Clothing' },
        { value: 'books', label: 'Books' }
      ]
    },
    {
      name: 'price',
      displayName: 'Price',
      type: 'number',
      operators: ['=', '>', '<', '>=', '<='],
      sortable: true
    },
    {
      name: 'inStock',
      displayName: 'In Stock',
      type: 'boolean',
      operators: ['=', '!=']
    }
  ],
  allowOrderBy: true,
  allowParentheses: true
};

function ProductSearch() {
  const handleProductSearch = (value: string, query: QLQuery) => {
    console.log('Searching products:', query);
    // Implement product search logic
  };

  return (
    <QLInput
      config={productConfig}
      placeholder='Search products... e.g., category = "electronics" AND price < 500 ORDER BY price ASC'
      onChange={handleProductSearch}
    />
  );
}
```

## 🎨 Theming Examples

### Custom Theme

```css
/* Custom theme variables */
.my-custom-theme {
  --ql-input-border: #e2e8f0;
  --ql-input-background: #ffffff;
  --ql-input-foreground: #1a202c;
  --ql-input-muted: #f7fafc;
  --ql-input-muted-foreground: #718096;
  --ql-input-ring: #3182ce;
}

.my-custom-theme .ql-input {
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.my-custom-theme .ql-suggestion-item {
  padding: 12px;
  border-radius: 8px;
}

.my-custom-theme .ql-suggestion-item:hover {
  background-color: #ebf8ff;
}
```

### Material Design Theme

```css
.material-theme {
  --ql-input-border: #e0e0e0;
  --ql-input-background: #ffffff;
  --ql-input-foreground: #212121;
  --ql-input-muted: #f5f5f5;
  --ql-input-muted-foreground: #757575;
  --ql-input-ring: #2196f3;
}

.material-theme .ql-input {
  border-radius: 4px;
  border-bottom: 2px solid var(--ql-input-ring);
  border-top: none;
  border-left: none;
  border-right: none;
  background: transparent;
}
```

## 🔧 Performance Optimization

### Debounced Async Suggestions

```tsx
import React, { useMemo } from 'react';
import { QLInput, useDebounce } from '@abaktiar/ql-input';

function OptimizedComponent() {
  const debouncedGetSuggestions = useMemo(
    () => useDebounce(async (field: string, search: string) => {
      // Expensive API call
      const response = await fetch(`/api/suggestions/${field}?q=${search}`);
      return response.json();
    }, 300),
    []
  );

  return (
    <QLInput
      config={config}
      getAsyncValueSuggestions={debouncedGetSuggestions}
    />
  );
}
```

### Memoized Configuration

```tsx
import React, { useMemo } from 'react';
import { QLInput } from '@abaktiar/ql-input';

function MemoizedConfig({ fields, options }) {
  const config = useMemo(() => ({
    fields: fields.map(field => ({
      ...field,
      options: options[field.name] || []
    })),
    maxSuggestions: 10,
    allowParentheses: true,
    allowOrderBy: true
  }), [fields, options]);

  return <QLInput config={config} />;
}
```

## 🧪 Testing Examples

### Complete Test Suite

```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QLInput } from '@abaktiar/ql-input';

const testConfig = {
  fields: [
    {
      name: 'status',
      displayName: 'Status',
      type: 'option',
      operators: ['=', '!='],
      options: [
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' }
      ]
    }
  ]
};

describe('QLInput Component', () => {
  test('shows suggestions when typing', async () => {
    render(<QLInput config={testConfig} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'sta');

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  test('executes query on Enter', async () => {
    const handleExecute = jest.fn();
    render(<QLInput config={testConfig} onExecute={handleExecute} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'status = "open"');
    await userEvent.keyboard('{Enter}');

    expect(handleExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        raw: 'status = "open"',
        valid: true
      })
    );
  });

  test('handles async suggestions', async () => {
    const getAsyncSuggestions = jest.fn().mockResolvedValue([
      { value: 'user1', label: 'User 1' }
    ]);

    render(
      <QLInput
        config={testConfig}
        getAsyncValueSuggestions={getAsyncSuggestions}
      />
    );

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'assignee = "u');

    await waitFor(() => {
      expect(getAsyncSuggestions).toHaveBeenCalledWith('assignee', 'u');
    });
  });
});
```

## 🐛 Issues & Support

Please report issues on [GitHub Issues](https://github.com/abaktiar/ql-input/issues).
