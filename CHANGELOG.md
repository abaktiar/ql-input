# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Smart Suggestion Behavior**: Enhanced UX similar to Jira JQL
  - **Manual Control**: Suggestions no longer appear automatically after selection
  - **Space-triggered**: Suggestions appear only when you type a space or use keyboard shortcut
  - **Ctrl+Space Shortcut**: New keyboard shortcut to manually trigger suggestions anytime
  - **No Auto-spacing**: Selecting suggestions no longer adds automatic spaces
  - **Less Intrusive**: More controlled query-building experience without overwhelming suggestions
  - **State Management**: Added `justSelectedSuggestion` flag to track suggestion selection state

- **Smooth & Minimal Visual Design**: Optimized suggestion appearance and performance
  - **Faster Transitions**: Reduced transition times from 200ms to 80ms for snappy feel
  - **Minimal Selection State**: Clean, subtle background with blue border instead of heavy highlighting
  - **Smooth Border Animation**: Added transparent borders for seamless transition effects
  - **Optimized CSS**: Specific transitions only for background, color, and border properties
  - **Theme-aware Colors**: Beautiful minimal colors for both light and dark themes
  - **Consistent Interaction**: Mouse hover and keyboard navigation use identical visual states

- **Enhanced Keyboard Navigation**: Improved accessibility and usability
  - **Auto-scroll to Selection**: Selected suggestions automatically scroll into view during keyboard navigation
  - **Smooth Scrolling**: Added CSS and JavaScript smooth scrolling for polished experience
  - **No Hidden Items**: All suggestions are accessible via keyboard, regardless of list length
  - **Seamless UX**: Navigate through long suggestion lists without manual scrolling

- **Parameterized Functions Support**: Enhanced function system with parameter support
  - Functions can now accept parameters: `daysAgo(30)`, `userInRole("admin")`, `dateRange("start", "end")`
  - Parameter type validation (text, number, date, boolean)
  - Required/optional parameter support
  - Parameter descriptions for better UX
  - Autocomplete with parameter placeholders (e.g., `daysAgo(days)`)
  - Support for functions in IN lists: `assignee IN (currentUser(), userInRole("manager"))`
  - Complex parameter expressions and nested function calls
  - Comprehensive error handling for malformed function syntax

### Enhanced
- **Function Configuration**: Extended function definition schema
  - Added `parameters` array with type, required, and description properties
  - Backward compatibility with existing parameterless functions
  - Enhanced function documentation and examples

- **Parser Engine**: Improved QL expression parser
  - Enhanced tokenization for function parameters
  - Better error messages for function-related syntax errors
  - Support for quoted and unquoted parameters
  - Nested parentheses handling in function calls

- **Suggestion System**: Enhanced autocomplete for functions
  - Function suggestions now show parameter placeholders
  - Context-aware function suggestions
  - Parameter-aware suggestion filtering
  - Improved function documentation in suggestions

- **Testing Coverage**: Comprehensive test suite for parameterized functions
  - 400+ lines of dedicated test coverage
  - Browser automation testing with Playwright
  - Unit, integration, and end-to-end tests
  - Error scenario testing

### Documentation
- **Updated All Documentation**: Comprehensive documentation updates
  - Main README with enhanced function examples
  - Parser package documentation with detailed function configuration
  - Input component documentation with real-world use cases
  - Development guide with implementation patterns
  - Testing guide with parameterized function test coverage
  - Updated all example projects to showcase parameterized functions

### Examples
- **Enhanced Example Projects**: Updated all examples with parameterized functions
  - Parser-only example with function parameter demonstrations
  - React component example with interactive function usage
  - Vite API example with backend integration patterns

### Backward Compatibility
- **Full Backward Compatibility**: All existing functionality preserved
  - Existing parameterless functions continue to work unchanged
  - No breaking changes to existing API
  - Gradual migration path for enhanced function features

## [Previous Versions]

### [1.0.0] - Initial Release
- Core QL parser functionality
- React input component
- Basic function support (parameterless)
- Field types: text, number, date, option, user, multiselect
- Operators: =, !=, >, <, >=, <=, IN, NOT IN, IS EMPTY, IS NOT EMPTY, ~, !~
- ORDER BY support
- Suggestion system with autocomplete
- MongoDB and SQL query builders
- Comprehensive test suite
- Documentation and examples

---

## Migration Guide

### Upgrading to Parameterized Functions

If you're using existing functions, no changes are required. To add parameterized functions:

#### Before (Parameterless Functions)
```typescript
functions: [
  {
    name: 'currentUser',
    displayName: 'currentUser()',
    description: 'Returns the current logged-in user'
  }
]
```

#### After (With Parameters)
```typescript
functions: [
  {
    name: 'currentUser',
    displayName: 'currentUser()',
    description: 'Returns the current logged-in user'
  },
  {
    name: 'daysAgo',
    displayName: 'daysAgo(days)',
    description: 'Returns a date N days ago from today',
    parameters: [{
      name: 'days',
      type: 'number',
      required: true,
      description: 'Number of days'
    }]
  }
]
```

#### Usage Examples
```typescript
// Parameterless (existing functionality)
'assignee = currentUser()'

// Parameterized (new functionality)
'created >= daysAgo(30)'
'assignee = userInRole("admin")'
'date IN dateRange("2023-01-01", "2023-12-31")'
'assignee IN (currentUser(), userInRole("manager"))'
```

### Type Definitions

New TypeScript interfaces for parameterized functions:

```typescript
interface QLFunctionParameter {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  description?: string;
}

interface QLFunction {
  name: string;
  displayName: string;
  description: string;
  returnType?: string;
  parameters?: QLFunctionParameter[];
}
```
