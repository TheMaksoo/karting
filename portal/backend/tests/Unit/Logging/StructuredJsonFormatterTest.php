<?php

use App\Logging\StructuredJsonFormatter;
use Monolog\Level;
use Monolog\LogRecord;

beforeEach(function () {
    $this->formatter = new StructuredJsonFormatter();
});

it('formats log record as JSON', function () {
    $record = new LogRecord(
        datetime: new DateTimeImmutable(),
        channel: 'test',
        level: Level::Info,
        message: 'Test message',
        context: [],
        extra: [],
    );

    $result = $this->formatter->format($record);

    expect($result)->toBeString();
    $decoded = json_decode($result, true);
    expect($decoded)->toBeArray();
    expect($decoded['message'])->toBe('Test message');
    expect($decoded['channel'])->toBe('test');
    expect($decoded['level_name'])->toBe('INFO');
});

it('includes user_id as null when not authenticated', function () {
    $record = new LogRecord(
        datetime: new DateTimeImmutable(),
        channel: 'test',
        level: Level::Info,
        message: 'Test message',
        context: [],
        extra: [],
    );

    $result = $this->formatter->format($record);
    $decoded = json_decode($result, true);

    expect(array_key_exists('user_id', $decoded['extra']))->toBeTrue();
    expect($decoded['extra']['user_id'])->toBeNull();
});

it('includes environment from config', function () {
    $record = new LogRecord(
        datetime: new DateTimeImmutable(),
        channel: 'test',
        level: Level::Info,
        message: 'Test message',
        context: [],
        extra: [],
    );

    $result = $this->formatter->format($record);
    $decoded = json_decode($result, true);

    expect(array_key_exists('environment', $decoded['extra']))->toBeTrue();
    expect($decoded['extra']['environment'])->toBe(config('app.env'));
});

it('includes hostname', function () {
    $record = new LogRecord(
        datetime: new DateTimeImmutable(),
        channel: 'test',
        level: Level::Info,
        message: 'Test message',
        context: [],
        extra: [],
    );

    $result = $this->formatter->format($record);
    $decoded = json_decode($result, true);

    expect(array_key_exists('hostname', $decoded['extra']))->toBeTrue();
    expect($decoded['extra']['hostname'])->toBe(gethostname());
});

it('includes request_id', function () {
    $record = new LogRecord(
        datetime: new DateTimeImmutable(),
        channel: 'test',
        level: Level::Info,
        message: 'Test message',
        context: [],
        extra: [],
    );

    $result = $this->formatter->format($record);
    $decoded = json_decode($result, true);

    expect(array_key_exists('request_id', $decoded['extra']))->toBeTrue();
    expect($decoded['extra']['request_id'])->not->toBeNull();
});

it('preserves context data', function () {
    $record = new LogRecord(
        datetime: new DateTimeImmutable(),
        channel: 'test',
        level: Level::Error,
        message: 'Error occurred',
        context: ['error_code' => 500, 'details' => 'Something went wrong'],
        extra: [],
    );

    $result = $this->formatter->format($record);
    $decoded = json_decode($result, true);

    expect($decoded['context']['error_code'])->toBe(500);
    expect($decoded['context']['details'])->toBe('Something went wrong');
});

it('handles different log levels', function () {
    $levels = [
        [Level::Debug, 'DEBUG'],
        [Level::Info, 'INFO'],
        [Level::Notice, 'NOTICE'],
        [Level::Warning, 'WARNING'],
        [Level::Error, 'ERROR'],
        [Level::Critical, 'CRITICAL'],
        [Level::Alert, 'ALERT'],
        [Level::Emergency, 'EMERGENCY'],
    ];

    foreach ($levels as [$level, $levelName]) {
        $record = new LogRecord(
            datetime: new DateTimeImmutable(),
            channel: 'test',
            level: $level,
            message: 'Test',
            context: [],
            extra: [],
        );

        $result = $this->formatter->format($record);
        $decoded = json_decode($result, true);

        expect($decoded['level_name'])->toBe($levelName);
    }
});

it('formats multiple records consistently', function () {
    $record1 = new LogRecord(
        datetime: new DateTimeImmutable(),
        channel: 'test',
        level: Level::Info,
        message: 'First message',
        context: [],
        extra: [],
    );

    $record2 = new LogRecord(
        datetime: new DateTimeImmutable(),
        channel: 'test',
        level: Level::Warning,
        message: 'Second message',
        context: [],
        extra: [],
    );

    $result1 = $this->formatter->format($record1);
    $result2 = $this->formatter->format($record2);

    $decoded1 = json_decode($result1, true);
    $decoded2 = json_decode($result2, true);

    // Both should have consistent structure
    expect(array_keys($decoded1))->toBe(array_keys($decoded2));
});
