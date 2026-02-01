<?php

namespace Tests\Unit;

use App\Services\InputSanitizer;
use PHPUnit\Framework\TestCase;

class InputSanitizerTest extends TestCase
{
    private InputSanitizer $sanitizer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sanitizer = new InputSanitizer();
    }

    // ==================== sanitizeText Tests ====================

    public function test_sanitize_text_removes_html_tags(): void
    {
        $input = '<script>alert("xss")</script>Hello World';
        $result = $this->sanitizer->sanitizeText($input);

        $this->assertStringNotContainsString('<script>', $result);
        $this->assertStringContainsString('Hello World', $result);
    }

    public function test_sanitize_text_encodes_special_characters(): void
    {
        $input = '<div>Test & "quotes"</div>';
        $result = $this->sanitizer->sanitizeText($input);

        $this->assertStringContainsString('&amp;', $result);
        $this->assertStringContainsString('&quot;', $result);
    }

    public function test_sanitize_text_handles_null(): void
    {
        $result = $this->sanitizer->sanitizeText(null);
        $this->assertNull($result);
    }

    public function test_sanitize_text_trims_whitespace(): void
    {
        $input = '  Hello World  ';
        $result = $this->sanitizer->sanitizeText($input);

        $this->assertEquals('Hello World', $result);
    }

    // ==================== sanitizeDriverName Tests ====================

    public function test_sanitize_driver_name_removes_html(): void
    {
        $input = '<b>Max</b> <i>van</i> Lierop';
        $result = $this->sanitizer->sanitizeDriverName($input);

        $this->assertStringNotContainsString('<b>', $result);
        $this->assertStringNotContainsString('<i>', $result);
    }

    public function test_sanitize_driver_name_normalizes_whitespace(): void
    {
        $input = 'Max    van   Lierop';
        $result = $this->sanitizer->sanitizeDriverName($input);

        $this->assertEquals('Max van Lierop', $result);
    }

    public function test_sanitize_driver_name_handles_null(): void
    {
        $result = $this->sanitizer->sanitizeDriverName(null);
        $this->assertNull($result);
    }

    // ==================== sanitizeFilename Tests ====================

    public function test_sanitize_filename_removes_path_traversal(): void
    {
        $input = '../../../etc/passwd';
        $result = $this->sanitizer->sanitizeFilename($input);

        $this->assertEquals('passwd', $result);
    }

    public function test_sanitize_filename_removes_dangerous_characters(): void
    {
        $input = 'file<script>.eml';
        $result = $this->sanitizer->sanitizeFilename($input);

        $this->assertStringNotContainsString('<', $result);
        $this->assertStringNotContainsString('>', $result);
    }

    public function test_sanitize_filename_removes_hidden_file_prefix(): void
    {
        $input = '.htaccess';
        $result = $this->sanitizer->sanitizeFilename($input);

        $this->assertStringStartsNotWith('.', $result);
    }

    public function test_sanitize_filename_returns_unnamed_for_empty(): void
    {
        $input = '...';
        $result = $this->sanitizer->sanitizeFilename($input);

        $this->assertEquals('unnamed', $result);
    }

    // ==================== sanitizeEmail Tests ====================

    public function test_sanitize_email_returns_valid_email(): void
    {
        $input = 'test@example.com';
        $result = $this->sanitizer->sanitizeEmail($input);

        $this->assertEquals('test@example.com', $result);
    }

    public function test_sanitize_email_returns_null_for_invalid(): void
    {
        $input = 'not-an-email';
        $result = $this->sanitizer->sanitizeEmail($input);

        $this->assertNull($result);
    }

    public function test_sanitize_email_trims_whitespace(): void
    {
        $input = '  test@example.com  ';
        $result = $this->sanitizer->sanitizeEmail($input);

        $this->assertEquals('test@example.com', $result);
    }

    // ==================== sanitizeNotes Tests ====================

    public function test_sanitize_notes_removes_html(): void
    {
        $input = '<script>evil()</script>Good notes here';
        $result = $this->sanitizer->sanitizeNotes($input);

        $this->assertStringNotContainsString('<script>', $result);
        $this->assertStringContainsString('Good notes here', $result);
    }

    public function test_sanitize_notes_preserves_newlines(): void
    {
        $input = "Line 1\nLine 2\nLine 3";
        $result = $this->sanitizer->sanitizeNotes($input);

        $this->assertStringContainsString("\n", $result);
    }

    public function test_sanitize_notes_normalizes_line_endings(): void
    {
        $input = "Line 1\r\nLine 2\rLine 3";
        $result = $this->sanitizer->sanitizeNotes($input);

        $this->assertStringNotContainsString("\r", $result);
    }

    // ==================== sanitizeKartNumber Tests ====================

    public function test_sanitize_kart_number_allows_alphanumeric(): void
    {
        $input = 'K42';
        $result = $this->sanitizer->sanitizeKartNumber($input);

        $this->assertEquals('K42', $result);
    }

    public function test_sanitize_kart_number_removes_special_chars(): void
    {
        $input = 'K-42<script>';
        $result = $this->sanitizer->sanitizeKartNumber($input);

        $this->assertEquals('K-42script', $result);
    }

    public function test_sanitize_kart_number_returns_null_for_empty(): void
    {
        $input = '!!!';
        $result = $this->sanitizer->sanitizeKartNumber($input);

        $this->assertNull($result);
    }

    // ==================== sanitizeLapData Tests ====================

    public function test_sanitize_lap_data_sanitizes_all_laps(): void
    {
        $laps = [
            ['driver_name' => '<b>Max</b>', 'lap_number' => 1, 'lap_time' => 45.123],
            ['driver_name' => '<script>John</script>', 'kart_number' => 'K<42>', 'lap_number' => 2, 'lap_time' => 46.456],
        ];

        $result = $this->sanitizer->sanitizeLapData($laps);

        $this->assertCount(2, $result);
        $this->assertStringNotContainsString('<b>', $result[0]['driver_name']);
        $this->assertStringNotContainsString('<script>', $result[1]['driver_name']);
    }

    // ==================== sanitizeHtml Tests ====================

    public function test_sanitize_html_allows_safe_tags(): void
    {
        $input = '<b>Bold</b> and <i>italic</i> text';
        $result = $this->sanitizer->sanitizeHtml($input);

        $this->assertStringContainsString('<b>', $result);
        $this->assertStringContainsString('<i>', $result);
    }

    public function test_sanitize_html_removes_script_tags(): void
    {
        $input = '<b>Safe</b><script>evil()</script>';
        $result = $this->sanitizer->sanitizeHtml($input);

        $this->assertStringContainsString('<b>', $result);
        $this->assertStringNotContainsString('<script>', $result);
    }

    public function test_sanitize_html_removes_event_handlers(): void
    {
        $input = '<b onclick="evil()">Text</b>';
        $result = $this->sanitizer->sanitizeHtml($input);

        $this->assertStringNotContainsString('onclick', $result);
    }

    public function test_sanitize_html_removes_javascript_urls(): void
    {
        $input = '<a href="javascript:evil()">Link</a>';
        $result = $this->sanitizer->sanitizeHtml($input);

        $this->assertStringNotContainsString('javascript:', $result);
    }
}
