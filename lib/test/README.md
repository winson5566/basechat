# Jest Test Helpers

This directory contains shared test utilities and helpers for Jest tests.

## Overview

The test helpers provide a consistent way to:

- Set up and tear down database connections for tests
- Create test data (users, tenants, profiles, etc.)
- Clean up test data after tests
- Share common test utilities across all test files

## Setup

The test helpers are automatically available in all test files through the Jest configuration in `jest.config.ts`. The setup file `lib/test/setup.ts` is loaded after the test environment is initialized.

## Usage

### Basic Database Setup

```typescript
import { initTestDb, closeTestDb, createTestUser, createTestTenant } from "@/lib/test";

let db: NodePgDatabase<typeof schema>;

beforeAll(async () => {
  const testDbSetup = await initTestDb();
  db = testDbSetup.db;
});

afterAll(async () => {
  await closeTestDb();
});
```

### Creating Test Data

```typescript
// Create a test user
const user = await createTestUser({
  email: "test@example.com",
  name: "Test User",
});

// Create a test tenant
const tenant = await createTestTenant({
  name: "Test Tenant",
  slackTeamId: "T123456",
});

// Create a test profile (links user to tenant)
const profile = await createTestProfile(tenant, user, {
  role: "admin",
});

// Create everything at once
const { user, tenant, profile } = await createTestSetup({
  user: { email: "test@example.com" },
  tenant: { name: "Test Company" },
  profile: { role: "admin" },
});
```

### Test Cleanup

```typescript
// Clean up all data for a specific tenant
await cleanupTestTenant(tenant.id);

// Generate random test strings
const randomId = randomTestString("user"); // "user-abc12345"
```

## Available Functions

### Database Management

- `initTestDb()` - Initialize test database connection
- `closeTestDb()` - Close test database connection
- `getTestDb()` - Get the current test database instance

### Test Data Creation

- `createTestUser(partial?)` - Create a test user
- `createTestTenant(partial?)` - Create a test tenant
- `createTestProfile(tenant, user, partial?)` - Create a test profile
- `createTestConversation(tenant, profile, partial?)` - Create a test conversation
- `createTestSetup(options?)` - Create user, tenant, and profile together

### Utilities

- `cleanupTestTenant(tenantId)` - Clean up all data for a tenant
- `randomTestString(prefix?, length?)` - Generate random test strings

## Best Practices

1. **Always clean up**: Use `cleanupTestTenant()` or proper teardown in `afterEach`/`afterAll`
2. **Use realistic data**: Provide meaningful test data that resembles real usage
3. **Isolate tests**: Each test should create its own data and not depend on other tests
4. **Use partial data**: Pass only the specific fields you need for each test

## Example Test File

```typescript
import { initTestDb, closeTestDb, createTestSetup } from "@/lib/test";
import { myFunction } from "./my-module";

describe("myFunction", () => {
  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it("should work with test data", async () => {
    const { user, tenant, profile } = await createTestSetup();

    const result = await myFunction(user.id, tenant.id);

    expect(result).toBeDefined();
  });
});
```

## Environment Variables

Make sure your test environment has the `DATABASE_URL` environment variable set to your test database connection string.
