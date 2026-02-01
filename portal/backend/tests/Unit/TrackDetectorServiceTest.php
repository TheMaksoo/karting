<?php

namespace Tests\Unit;

use App\Services\TrackDetectorService;
use PHPUnit\Framework\TestCase;

class TrackDetectorServiceTest extends TestCase
{
    private TrackDetectorService $detector;

    protected function setUp(): void
    {
        parent::setUp();
        $this->detector = new TrackDetectorService();
    }

    // ==================== getTrackCity Tests ====================

    public function test_get_track_city_returns_correct_city(): void
    {
        $this->assertEquals('Tilburg', $this->detector->getTrackCity('De Voltage'));
        $this->assertEquals('Antwerp', $this->detector->getTrackCity('Experience Factory'));
        $this->assertEquals('Berghem', $this->detector->getTrackCity('Circuit Park Berghem'));
        $this->assertEquals('Elche', $this->detector->getTrackCity('Fastkart Elche'));
    }

    public function test_get_track_city_returns_null_for_unknown(): void
    {
        $this->assertNull($this->detector->getTrackCity('Unknown Track'));
    }

    // ==================== getTrackCountry Tests ====================

    public function test_get_track_country_returns_correct_country(): void
    {
        $this->assertEquals('Netherlands', $this->detector->getTrackCountry('De Voltage'));
        $this->assertEquals('Belgium', $this->detector->getTrackCountry('Experience Factory'));
        $this->assertEquals('Spain', $this->detector->getTrackCountry('Fastkart Elche'));
    }

    public function test_get_track_country_returns_netherlands_for_unknown(): void
    {
        $this->assertEquals('Netherlands', $this->detector->getTrackCountry('Unknown Track'));
    }

    // ==================== getTrackPatterns Tests ====================

    public function test_get_track_patterns_returns_all_patterns(): void
    {
        $patterns = $this->detector->getTrackPatterns();

        $this->assertIsArray($patterns);
        $this->assertArrayHasKey('De Voltage', $patterns);
        $this->assertArrayHasKey('Experience Factory', $patterns);
        $this->assertArrayHasKey('Goodwill Karting', $patterns);
    }

    // ==================== addTrackPattern Tests ====================

    public function test_add_track_pattern_adds_new_pattern(): void
    {
        $this->detector->addTrackPattern('New Track', ['newtrack', 'new_track']);

        $patterns = $this->detector->getTrackPatterns();

        $this->assertArrayHasKey('New Track', $patterns);
        $this->assertContains('newtrack', $patterns['New Track']);
    }

    // ==================== matchTrackName Tests ====================

    public function test_match_track_name_finds_de_voltage(): void
    {
        $result = $this->detector->matchTrackName('session_devoltage.eml');

        $this->assertEquals('De Voltage', $result);
    }

    public function test_match_track_name_finds_experience_factory(): void
    {
        $result = $this->detector->matchTrackName('experience_factory_session.eml');

        $this->assertEquals('Experience Factory', $result);
    }

    public function test_match_track_name_is_case_insensitive(): void
    {
        $result = $this->detector->matchTrackName('GOODWILL_session.eml');

        $this->assertEquals('Goodwill Karting', $result);
    }

    public function test_match_track_name_returns_null_for_unknown(): void
    {
        $result = $this->detector->matchTrackName('random_file.eml');

        $this->assertNull($result);
    }

    public function test_match_track_name_finds_from_content(): void
    {
        $result = $this->detector->matchTrackName('This email is from Circuit Park Berghem');

        $this->assertEquals('Circuit Park Berghem', $result);
    }

    public function test_match_track_name_finds_fastkart(): void
    {
        $result = $this->detector->matchTrackName('Welcome to Fastkart Elche!');

        $this->assertEquals('Fastkart Elche', $result);
    }

    public function test_match_track_name_finds_lot66(): void
    {
        $result = $this->detector->matchTrackName('results@lot66.nl sent you lap times');

        $this->assertEquals('Lot66', $result);
    }

    public function test_match_track_name_finds_racing_center_gilesias(): void
    {
        $result = $this->detector->matchTrackName('Racing Center Gilesias lap times');

        $this->assertEquals('Racing Center Gilesias', $result);
    }
}
