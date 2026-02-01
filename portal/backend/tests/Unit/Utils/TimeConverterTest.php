<?php

use App\Utils\TimeConverter;

describe('TimeConverter', function () {
    describe('toSeconds', function () {
        it('converts minutes:seconds.milliseconds format', function () {
            expect(TimeConverter::toSeconds('1:23.456'))->toBe(83.456);
            expect(TimeConverter::toSeconds('2:15.789'))->toBe(135.789);
        });

        it('converts seconds.milliseconds format', function () {
            expect(TimeConverter::toSeconds('23.456'))->toBe(23.456);
            expect(TimeConverter::toSeconds('83.456'))->toBe(83.456);
        });

        it('handles whole seconds', function () {
            expect(TimeConverter::toSeconds('45'))->toBe(45.0);
            expect(TimeConverter::toSeconds('1:45'))->toBe(105.0);
        });
    });

    describe('fromSeconds', function () {
        it('converts to minutes:seconds format when >= 60 seconds', function () {
            expect(TimeConverter::fromSeconds(83.456))->toBe('1:23.456');
            expect(TimeConverter::fromSeconds(135.789))->toBe('2:15.789');
        });

        it('converts to seconds format when < 60 seconds', function () {
            expect(TimeConverter::fromSeconds(23.456))->toBe('23.456');
            expect(TimeConverter::fromSeconds(45.123))->toBe('45.123');
        });

        it('respects decimal places parameter', function () {
            expect(TimeConverter::fromSeconds(23.456789, 2))->toBe('23.46');
            expect(TimeConverter::fromSeconds(23.456789, 4))->toBe('23.4568');
        });
    });

    describe('parse', function () {
        it('parses numeric values', function () {
            expect(TimeConverter::parse(83.456))->toBe(83.456);
            expect(TimeConverter::parse(45))->toBe(45.0);
        });

        it('parses string values', function () {
            expect(TimeConverter::parse('1:23.456'))->toBe(83.456);
            expect(TimeConverter::parse('45.123'))->toBe(45.123);
        });
    });

    describe('difference', function () {
        it('calculates absolute difference', function () {
            expect(round(TimeConverter::difference(83.456, 80.0), 3))->toBe(3.456);
            expect(round(TimeConverter::difference(80.0, 83.456), 3))->toBe(3.456);
        });
    });

    describe('formatDifference', function () {
        it('formats positive difference with + prefix', function () {
            expect(TimeConverter::formatDifference(83.456, 80.0))->toBe('+3.456');
        });

        it('formats negative difference with - prefix', function () {
            expect(TimeConverter::formatDifference(80.0, 83.456))->toBe('-3.456');
        });

        it('formats zero difference', function () {
            expect(TimeConverter::formatDifference(80.0, 80.0))->toBe('+0.000');
        });
    });

    describe('millisecondsToSeconds', function () {
        it('converts milliseconds to seconds', function () {
            expect(TimeConverter::millisecondsToSeconds(1000))->toBe(1.0);
            expect(TimeConverter::millisecondsToSeconds(83456))->toBe(83.456);
        });
    });

    describe('secondsToMilliseconds', function () {
        it('converts seconds to milliseconds', function () {
            expect(TimeConverter::secondsToMilliseconds(1.0))->toBe(1000);
            expect(TimeConverter::secondsToMilliseconds(83.456))->toBe(83456);
        });
    });

    describe('isValid', function () {
        it('validates correct time formats', function () {
            expect(TimeConverter::isValid('1:23.456'))->toBeTrue();
            expect(TimeConverter::isValid('45.123'))->toBeTrue();
            expect(TimeConverter::isValid('83'))->toBeTrue();
        });

        it('rejects invalid formats', function () {
            expect(TimeConverter::isValid(''))->toBeFalse();
            expect(TimeConverter::isValid('abc'))->toBeFalse();
            expect(TimeConverter::isValid('1:2:3'))->toBeFalse();
        });
    });

    describe('average', function () {
        it('calculates average of times', function () {
            expect(TimeConverter::average([80.0, 82.0, 84.0]))->toBe(82.0);
            expect(TimeConverter::average([45.5, 46.5]))->toBe(46.0);
        });

        it('returns 0 for empty array', function () {
            expect(TimeConverter::average([]))->toBe(0.0);
        });
    });

    describe('fastest', function () {
        it('finds fastest time', function () {
            expect(TimeConverter::fastest([80.0, 82.0, 78.5, 84.0]))->toBe(78.5);
        });

        it('returns null for empty array', function () {
            expect(TimeConverter::fastest([]))->toBeNull();
        });
    });

    describe('slowest', function () {
        it('finds slowest time', function () {
            expect(TimeConverter::slowest([80.0, 82.0, 78.5, 84.0]))->toBe(84.0);
        });

        it('returns null for empty array', function () {
            expect(TimeConverter::slowest([]))->toBeNull();
        });
    });
});
