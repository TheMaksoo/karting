<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ExampleTest extends TestCase
{
    /**
     * Basic sanity check.
     */
    public function test_basic_math(): void
    {
        $this->assertEquals(4, 2 + 2);
    }

    /**
     * Test string operations.
     */
    public function test_string_operations(): void
    {
        $this->assertStringContainsString('world', 'hello world');
    }
}
