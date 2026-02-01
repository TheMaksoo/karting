# ADR-005: Use PEST for Backend Testing

## Status

**Accepted**

## Date

2024-06-01

## Context

We needed a testing framework for the Laravel backend. Requirements:

- Easy to write and read tests
- Fast test execution
- Good Laravel integration
- Coverage reporting
- Parallel test execution
- Active maintenance

PHPUnit is Laravel's default, but modern alternatives exist.

## Decision

We chose **PEST PHP** as our primary testing framework.

### Test Statistics

- **554 tests** passing
- **Parallel execution** enabled
- **Code coverage** tracked via Codecov

### Example Test

```php
<?php

use App\Models\Driver;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
});

describe('Driver API', function () {
    it('can list all drivers', function () {
        Driver::factory()->count(3)->create();
        
        $this->actingAs($this->user)
            ->getJson('/api/drivers')
            ->assertOk()
            ->assertJsonCount(3);
    });

    it('can create a driver with valid data', function () {
        $this->actingAs($this->user)
            ->postJson('/api/drivers', [
                'name' => 'Max Verstappen',
                'color' => '#FF0000',
            ])
            ->assertCreated()
            ->assertJsonPath('name', 'Max Verstappen');
    });

    it('validates required fields', function () {
        $this->actingAs($this->user)
            ->postJson('/api/drivers', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    });
});
```

### Reasons

1. **Readable Syntax**: `it()`, `describe()`, `expect()` are more expressive than PHPUnit's assertions.

2. **Less Boilerplate**: No need for `public function test_*` or `@test` annotations.

3. **Expectations API**: Chainable, readable assertions with `expect()->toBe()->toHave()`.

4. **Laravel Plugin**: First-class Laravel support with `actingAs()`, assertions, etc.

5. **Parallel Execution**: Built-in parallel test runner for faster CI.

6. **PHPUnit Compatible**: Can use existing PHPUnit tests, runs on PHPUnit under the hood.

## Alternatives Considered

### Option 1: PHPUnit (Keep Default)
- **Pros**: Laravel default, mature, well-documented
- **Cons**: Verbose syntax, more boilerplate

### Option 2: Codeception
- **Pros**: BDD-style, good for acceptance testing
- **Cons**: Complex setup, slower, overkill for unit/feature tests

## Consequences

### Positive
- More enjoyable to write tests
- Faster test execution with parallel runner
- Better test organization with `describe()` blocks
- Easy migration from PHPUnit

### Negative
- Additional dependency
- Team needs to learn PEST syntax
- Some PHPUnit plugins may not work

### Neutral
- Uses PHPUnit under the hood
- Same coverage tools work

## Configuration

```php
// phpunit.xml
<testsuites>
    <testsuite name="Feature">
        <directory>tests/Feature</directory>
    </testsuite>
    <testsuite name="Unit">
        <directory>tests/Unit</directory>
    </testsuite>
</testsuites>

// composer.json scripts
"test": "@php vendor/bin/pest --parallel",
"test:coverage": "@php vendor/bin/pest --parallel --coverage"
```

## References

- [PEST Documentation](https://pestphp.com/)
- [PEST Laravel Plugin](https://pestphp.com/docs/plugins/laravel)
- [From PHPUnit to PEST](https://pestphp.com/docs/underlying-test-case)
