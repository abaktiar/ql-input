# QL Input Examples

This folder contains practical examples demonstrating how to use `@abaktiar/ql-parser` and `@abaktiar/ql-input` packages in real-world scenarios.

**🌐 [Live Demo](https://ql-input.netlify.app/)** - Try the component online before diving into the examples!

## 📁 Examples Overview

### 1. **Parser Only** (`parser-only/`)
- Framework-agnostic usage of `@abaktiar/ql-parser`
- Node.js backend integration
- Query parsing and conversion examples
- **NEW**: Parameterized functions demonstrations (`daysAgo(30)`, `userInRole("admin")`)

### 2. **React Component** (`react-component/`)
- Complete React application using `@abaktiar/ql-input`
- Interactive demo with live query building
- Real-time validation and suggestions
- **NEW**: Enhanced function autocomplete with parameter placeholders

### 3. **React + Vite + API** (`react-vite-api/`)
- Full-stack React application with Vite
- Mock API server integration
- Advanced async suggestions and query processing
- **NEW**: Full parameterized function integration with backend support

## 🚀 Quick Start

Each example includes:
- `README.md` - Setup and usage instructions
- `package.json` - Dependencies and scripts
- Complete source code
- Live demo (where applicable)

## 📦 Installation

Navigate to any example folder and run:

```bash
cd examples/[example-name]
npm install
npm start
```

## 🎯 Use Cases Covered

- **Basic parsing** - Simple query parsing and validation
- **Advanced queries** - Complex conditions with parentheses
- **Async suggestions** - Server-side value fetching
- **Custom functions** - User-defined query functions
- **Real-time validation** - Live query feedback
- **Multiple field types** - Text, number, date, boolean, options
- **ORDER BY clauses** - Sorting and ordering
- **API integration** - Backend query processing
- **TypeScript usage** - Full type safety examples

## 🆕 New Features Highlighted

All examples have been updated to showcase the latest **Parameterized Functions** feature:

### Parameterized Function Examples
- `daysAgo(30)` - Date calculations with parameters
- `userInRole("admin")` - Role-based user filtering
- `dateRange("start", "end")` - Date range queries
- `assignee IN (currentUser(), userInRole("manager"))` - Functions in IN lists

### Enhanced Autocomplete
- Function suggestions with parameter placeholders
- Parameter type validation and descriptions
- Context-aware function recommendations
- Improved error handling for function syntax

### Real-World Use Cases
- **Recent items**: `created >= daysAgo(7)`
- **Role-based filtering**: `assignee = userInRole("admin")`
- **Complex queries**: `(status = "open" OR status = "pending") AND assignee IN (currentUser(), userInRole("manager"))`

## 🔗 Package Links

- [@abaktiar/ql-parser](https://www.npmjs.com/package/@abaktiar/ql-parser) - Framework-agnostic parser
- [@abaktiar/ql-input](https://www.npmjs.com/package/@abaktiar/ql-input) - React component

## 📚 Documentation

- [Parser Documentation](../README-parser.md)
- [Input Component Documentation](../README-input.md)
- [Development Guide](../docs/DEVELOPMENT.md)
- [Publishing Guide](../docs/PUBLISHING.md)
