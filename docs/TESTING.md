# QL Input Component Testing

This directory contains comprehensive Playwright tests for the QL Input component.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── ql-parser.test.ts   # Parser logic tests
│   └── ql-suggestions.test.ts # Suggestion engine tests
├── integration/             # Integration tests for component interactions
│   ├── ql-input-basic.test.ts # Basic input functionality
│   └── ql-input-in-operator.test.ts # IN operator specific tests
├── e2e/                     # End-to-end workflow tests
│   └── ql-input-complete-workflow.test.ts # Complete user scenarios
├── fixtures/                # Test data and fixtures
│   └── test-data.ts        # Shared test data
├── utils/                   # Test utilities and helpers
│   └── ql-helpers.ts       # QL Input specific helper class
├── global-setup.ts         # Global test setup
├── global-teardown.ts      # Global test cleanup
├── test.config.ts          # Test configuration constants
└── README.md               # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### By Category
```bash
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e         # E2E tests only
```

### Development Mode
```bash
npm run test:headed      # Run with browser UI visible
npm run test:debug       # Run in debug mode
npm run test:ui          # Run with Playwright UI
```

### Reports
```bash
npm run test:report      # View HTML test report
```

## Test Categories

### Unit Tests
- **ql-parser.test.ts**: Tests the QL parser logic
  - Tokenization of different query types
  - Parsing valid and invalid queries
  - Query structure validation
  - Error handling

- **ql-suggestions.test.ts**: Tests the suggestion engine
  - Field, operator, value suggestions
  - Context detection (IN lists, ORDER BY)
  - Filtering and auto-quoting
  - Function suggestions

### Integration Tests
- **ql-input-basic.test.ts**: Tests basic component functionality
  - Input interaction and suggestions display
  - Keyboard navigation and selection
  - Query parsing and validation
  - Error handling

- **ql-input-in-operator.test.ts**: Tests IN operator specific functionality
  - IN operator workflow
  - Multi-word value quoting
  - Function integration
  - Context preservation

### E2E Tests
- **ql-input-complete-workflow.test.ts**: Tests complete user workflows
  - Real user scenarios
  - Complex query building
  - Performance and responsiveness
  - Cross-browser compatibility
  - Mobile responsiveness

## Test Utilities

### QLInputHelper Class
The `QLInputHelper` class provides a high-level API for interacting with the QL Input component:

```typescript
const qlInput = new QLInputHelper(page);

// Basic operations
await qlInput.type('project = PROJ1');
await qlInput.clear();
await qlInput.selectSuggestion('project');

// Assertions
await qlInput.assertQueryValid();
await qlInput.assertSuggestionsContain(['project', 'status']);

// Advanced operations
await qlInput.buildQuery([
  { type: 'type', value: 'project IN (' },
  { type: 'select', value: 'PROJ1' },
  { type: 'type', value: ')' }
]);
```

### Test Data
Shared test data is available in `fixtures/test-data.ts`:
- Field configurations
- Test queries (valid/invalid)
- Expected suggestions
- Function definitions

## Configuration

### Playwright Configuration
Main configuration is in `playwright.config.ts`:
- Browser targets (Chrome, Firefox, Safari, Mobile)
- Test timeouts and retries
- Reporter configuration
- Dev server setup

### Test Configuration
Additional test constants in `tests/test.config.ts`:
- Timeouts and delays
- Selectors and test data
- Environment-specific settings

## Best Practices

### Writing Tests
1. **Use descriptive test names** that explain what is being tested
2. **Group related tests** using `test.describe()`
3. **Use the QLInputHelper** for consistent interactions
4. **Assert both positive and negative cases**
5. **Test error conditions** and recovery scenarios

### Test Data
1. **Use shared test data** from fixtures when possible
2. **Create realistic test scenarios** based on actual use cases
3. **Test edge cases** like empty inputs, special characters
4. **Include performance considerations** for large datasets

### Debugging
1. **Use `test:headed`** to see tests run in browser
2. **Use `test:debug`** to step through tests
3. **Take screenshots** on failures for debugging
4. **Use `page.pause()`** to pause execution for inspection

## Coverage Areas

### Functional Testing
- ✅ Field suggestions and filtering
- ✅ Operator suggestions based on field type
- ✅ Value suggestions and auto-quoting
- ✅ IN operator multi-value selection
- ✅ Logical operator combinations
- ✅ Function integration
- ✅ ORDER BY clause handling
- ✅ Query parsing and validation
- ✅ Error handling and recovery

### Non-Functional Testing
- ✅ Performance and responsiveness
- ✅ Cross-browser compatibility
- ✅ Mobile responsiveness
- ✅ Keyboard accessibility
- ✅ Error boundary testing

### User Experience Testing
- ✅ Real user workflows
- ✅ Complex query building
- ✅ Suggestion selection flows
- ✅ Error recovery scenarios
- ✅ Performance under load

## Continuous Integration

Tests are configured to run in CI with:
- Retry logic for flaky tests
- Multiple browser targets
- Screenshot capture on failures
- JUnit and HTML reporting
- Performance monitoring

## Troubleshooting

### Common Issues
1. **Tests timing out**: Increase timeouts in test.config.ts
2. **Flaky tests**: Add proper waits and retries
3. **Element not found**: Check selectors and test IDs
4. **Dev server not starting**: Check port conflicts

### Debug Commands
```bash
# Run specific test file
npx playwright test tests/unit/ql-parser.test.ts

# Run with verbose output
npx playwright test --reporter=line

# Run in headed mode with slow motion
SLOW_MO=1000 npm run test:headed

# Generate test report
npm run test:report
```

## Contributing

When adding new tests:
1. Follow the existing test structure
2. Add appropriate test data to fixtures
3. Use the QLInputHelper for consistency
4. Include both positive and negative test cases
5. Update this README if adding new test categories
