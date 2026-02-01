<?php

uses(
    Tests\TestCase::class,
    Illuminate\Foundation\Testing\RefreshDatabase::class
)->in(__DIR__);

beforeEach(function () {
    $this->artisan('migrate:fresh');
});
