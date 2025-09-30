# Test Documentation

## Overview

This test suite provides comprehensive testing for the JobPsych authentication system, including unit tests, integration tests, and end-to-end tests.

## Test Structure

```
src/tests/
├── setup.ts                    # Global test configuration
├── helpers/
│   └── database.ts             # Database mocking utilities
├── utils/
│   └── auth.test.ts           # Authentication utilities tests
├── middleware/
│   └── auth.test.ts           # Authentication middleware tests
├── controllers/
│   ├── authController.test.ts  # Authentication controller tests
│   └── fileController.test.ts  # File controller tests
├── integration/
│   └── api.test.ts            # API integration tests
└── e2e/
    └── auth-flow.test.ts      # End-to-end tests
```

## Running Tests

### All Tests

```bash
npm test
```

### Specific Test Files

```bash
# Run auth utils tests
npm test -- auth.test.ts

# Run controller tests
npm test -- controllers/

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Test Categories

#### Unit Tests

- **Auth Utils** (`utils/auth.test.ts`): Tests password hashing, JWT generation/verification, token extraction
- **Middleware** (`middleware/auth.test.ts`): Tests authentication middleware functionality
- **Controllers** (`controllers/*.test.ts`): Tests individual controller functions

#### Integration Tests

- **API Integration** (`integration/api.test.ts`): Tests complete API endpoints with middleware

#### End-to-End Tests

- **Auth Flow** (`e2e/auth-flow.test.ts`): Tests complete authentication workflows

## Test Configuration

### Jest Configuration

- Uses `ts-jest` preset for TypeScript support
- Node.js test environment
- Coverage collection enabled
- Custom setup file for environment variables

### Environment Variables

Test environment uses mock values:

- `NODE_ENV=test`
- Mock database URL
- Mock JWT secrets
- 30-second timeout for async operations

## Mocking Strategy

### Database Mocking

- Uses Jest mocks for database operations
- Mock functions return predictable test data
- Isolated from actual database

### External Dependencies

- File system operations mocked
- JWT library used directly (not mocked) for real crypto validation
- bcrypt used directly for real password hashing

## Coverage Targets

- **Functions**: 80%+
- **Branches**: 75%+
- **Lines**: 80%+
- **Statements**: 80%+

## Test Data

### Mock User

```typescript
{
  id: 1,
  name: "Test User",
  email: "test@example.com",
  company_name: "Test Company",
  password: "$2b$12$...", // bcrypt hashed
  filesUploaded: 0,
  created_at: new Date(),
  updated_at: new Date()
}
```

### Mock File

```typescript
{
  id: 1,
  user_id: 1,
  filename: "test-file.txt",
  original_name: "test-file.txt",
  mime_type: "text/plain",
  size: 1024,
  word_count: 100,
  line_count: 10,
  char_count: 500,
  uploaded_at: new Date()
}
```

## Best Practices

1. **Isolation**: Each test is independent and doesn't affect others
2. **Mocking**: External dependencies are mocked to ensure predictable results
3. **Assertions**: Clear, specific assertions that test one thing at a time
4. **Setup/Teardown**: Proper cleanup after each test
5. **Error Testing**: Both success and failure scenarios are tested
6. **Edge Cases**: Invalid inputs, missing data, and boundary conditions tested

## Continuous Integration

Tests are designed to run in CI/CD environments:

- No external dependencies (database, network)
- Deterministic results
- Fast execution
- Clear error messages

## Adding New Tests

When adding new features:

1. **Unit Tests**: Test individual functions in isolation
2. **Integration Tests**: Test how components work together
3. **Error Handling**: Test all error conditions
4. **Edge Cases**: Test boundary conditions and invalid inputs
5. **Documentation**: Update this README with new test information

## Debugging Tests

### Common Issues

- **Async/Await**: Ensure all async operations are properly awaited
- **Mocking**: Verify mocks are reset between tests
- **Environment**: Check environment variables are set correctly
- **Timeouts**: Increase timeout for slow operations

### Debug Commands

```bash
# Run tests in debug mode
npm test -- --verbose

# Run single test file
npm test -- utils/auth.test.ts

# Run with increased timeout
npm test -- --testTimeout=60000
```
