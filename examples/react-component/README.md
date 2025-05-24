# React Component Example

This example demonstrates how to use `@abaktiar/ql-input` in a React application with full interactive features.

## 🎯 What This Example Shows

- Complete React integration with TypeScript
- Interactive query building with autocomplete
- Real-time query validation and feedback
- Async value suggestions (simulated API calls)
- Query parsing and conversion to different formats
- Example queries for common use cases
- Responsive design and modern UI

## 📦 Installation

```bash
cd examples/react-component
npm install
```

## 🚀 Running the Example

```bash
npm run dev
```

The application will open at `http://localhost:3000`

## 🔧 Key Features Demonstrated

### 1. Basic Integration
```tsx
import { QLInput, QLQuery, QLInputConfig } from '@abaktiar/ql-input';
import '@abaktiar/ql-input/styles.css';

<QLInput
  config={config}
  value={currentQuery}
  onChange={handleQueryChange}
  onExecute={handleQueryExecute}
  placeholder="Enter your query..."
  showSearchIcon={true}  // Optional: default is true
  showClearIcon={true}   // Optional: default is true
/>
```

### 2. Async Value Suggestions
```tsx
const getAsyncValueSuggestions = async (field: string, typedValue: string) => {
  // Simulate API call
  const response = await fetch(`/api/suggestions/${field}?q=${typedValue}`);
  return response.json();
};

<QLInput
  config={config}
  getAsyncValueSuggestions={getAsyncValueSuggestions}
/>
```

### 3. Real-time Query Processing
```tsx
const handleQueryChange = (value: string, query: QLQuery) => {
  setCurrentQuery(value);
  setParsedQuery(query);

  if (query.valid) {
    // Convert to different formats
    const mongoQuery = toMongooseQuery(query);
    const sqlQuery = toSQLQuery(query);

    // Process the query
    processQuery(query);
  }
};
```

### 4. Field Configuration
The example includes a comprehensive field configuration:

```tsx
const config: QLInputConfig = {
  fields: [
    {
      name: 'status',
      displayName: 'Status',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN'],
      options: [/* predefined options */]
    },
    {
      name: 'assignee',
      displayName: 'Assignee',
      type: 'user',
      operators: ['=', '!=', 'IS EMPTY', 'IS NOT EMPTY'],
      asyncValueSuggestions: true // Enable async suggestions
    },
    // ... more fields
  ],
  allowParentheses: true,
  allowOrderBy: true,
  allowFunctions: true
};
```

## 🎨 UI Features

### Interactive Query Builder
- **Autocomplete**: Smart suggestions based on context
- **Syntax Highlighting**: Visual feedback for query structure
- **Validation**: Real-time error detection and reporting
- **Keyboard Navigation**: Full keyboard support

### Query Output Display
- **Validation Status**: Visual indicators for valid/invalid queries
- **Readable Expression**: Human-friendly query representation
- **MongoDB Format**: Ready-to-use MongoDB query objects
- **SQL Format**: SQL WHERE clause generation
- **Condition Count**: Number of conditions in the query

### Example Queries
Pre-built examples covering:
- Simple status filtering
- Function usage (`currentUser()`, `startOfWeek()`)
- Complex grouping with parentheses
- Text search with date filtering
- Unassigned item queries
- Tag-based filtering with sorting
- Advanced multi-condition queries

## 🔄 Async Suggestions

The example demonstrates async value suggestions for:

### User Fields
```tsx
// Mock user data
const mockUsers = [
  { value: 'john.doe', label: 'John Doe' },
  { value: 'jane.smith', label: 'Jane Smith' },
  // ...
];

// Async suggestion handler
const getAsyncValueSuggestions = async (field: string, typedValue: string) => {
  if (field === 'assignee') {
    return mockUsers.filter(user =>
      user.label.toLowerCase().includes(typedValue.toLowerCase())
    );
  }
  return [];
};
```

### Project Fields
Similar implementation for project suggestions with simulated API delay.

## 📱 Responsive Design

The example includes:
- Mobile-friendly layout
- Responsive grid for example queries
- Touch-friendly interaction
- Accessible design patterns

## 🎯 Use Cases

This example is perfect for:
- **Issue Tracking Systems** - Filter and search issues
- **Data Dashboards** - Query-based data filtering
- **Admin Panels** - Advanced search interfaces
- **E-commerce** - Product filtering and search
- **CRM Systems** - Customer and lead filtering
- **Project Management** - Task and project queries

## 🔧 Customization

### Styling
The component uses CSS custom properties for easy theming:

```css
:root {
  --ql-input-border: #e2e8f0;
  --ql-input-background: #ffffff;
  --ql-input-foreground: #1a202c;
  /* ... more variables */
}
```

### Field Types
Supports all field types:
- `text` - Text search with contains/not contains
- `number` - Numeric comparisons
- `date`/`datetime` - Date range filtering
- `boolean` - True/false values
- `option` - Single select from predefined options
- `multiselect` - Multiple selection
- `user` - User selection with async suggestions

### Functions
Built-in functions:
- `currentUser()` - Current user identifier
- `now()` - Current timestamp
- `today()` - Today's date
- `startOfWeek()` / `endOfWeek()` - Week boundaries
- `startOfMonth()` / `endOfMonth()` - Month boundaries

## 🚀 Next Steps

- Integrate with your backend API for real async suggestions
- Add custom functions for your specific use case
- Implement query execution with your data source
- Add query history and saved queries
- Customize the UI to match your design system

## 📚 Related Examples

- [Parser Only Example](../parser-only/) - Backend integration
- [Next.js Example](../nextjs-app/) - Full-stack application
- [Issue Tracker Example](../issue-tracker/) - Real-world implementation

## 📖 Documentation

- [Component API Reference](../../README-input.md)
- [Parser Documentation](../../README-parser.md)
