# Shipping Service Tests

This directory contains tests for the Shipping Service microservice.

## Test Structure

- `setup.ts` - Global setup file for all tests
- `utils/` - Tests for utility functions
  - `etaCalculator.test.ts` - Tests for the ETA calculation utility
- `services/` - Tests for service layer
  - `address.service.test.ts` - Tests for the Address service
  - `shipping.service.test.ts` - Tests for the Shipping service
- `controllers/` - Tests for controllers
  - `address.controller.test.ts` - Tests for the Address controller

## Running Tests

To run all tests:

```bash
npm test
```

To run tests in watch mode (for development):

```bash
npm run test:watch
```

To run tests with coverage:

```bash
npm run test:coverage
```

## Mocking Strategy

The tests use Vitest's mocking capabilities to mock:

1. **External Dependencies**: Logger, environment variables, etc.
2. **Database Access**: TypeORM repositories are mocked to avoid actual database connections
3. **Date/Time**: For consistent test results with date/time calculations

## Test Coverage

The test suite aims to cover:

- Unit tests for utility functions
- Service layer tests with mocked repositories
- Controller tests with mocked services
- Edge cases and error handling

## Adding New Tests

When adding new tests:

1. Follow the existing directory structure
2. Use the same mocking patterns
3. Test both success and error scenarios
4. Test edge cases

## Debugging Tests

To debug tests:

1. Use `console.log` statements (they will appear in the test output)
2. Set breakpoints in your IDE
3. Use `describe.only()` or `it.only()` to run specific test suites or cases 