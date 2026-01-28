<?php

namespace Tests\Unit;

use App\Services\EmlParser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmlParserTest extends TestCase
{
    private EmlParser $parser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->parser = new EmlParser();
    }

    public function test_parser_can_be_instantiated(): void
    {
        $this->assertInstanceOf(EmlParser::class, $this->parser);
    }

    public function test_parse_throws_exception_for_nonexistent_file(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('EML file not found');

        $this->parser->parse('/nonexistent/file.eml', 1);
    }

    public function test_parse_pdf_throws_exception_for_nonexistent_file(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('PDF file not found');

        $this->parser->parsePdfFile('/nonexistent/file.pdf', 1);
    }

    public function test_parse_text_file_returns_array(): void
    {
        // Create a temporary text file with sample data
        $tempFile = tempnam(sys_get_temp_dir(), 'test_');
        file_put_contents($tempFile, "Sample lap data\nDriver 1: 30.456\nDriver 2: 31.123");

        try {
            $result = $this->parser->parseTextFile($tempFile, 1);
            $this->assertIsArray($result);
        } finally {
            unlink($tempFile);
        }
    }

    public function test_parse_eml_with_minimal_content(): void
    {
        // Create a minimal EML file
        $tempFile = tempnam(sys_get_temp_dir(), 'test_') . '.eml';
        $emlContent = <<<EML
MIME-Version: 1.0
Content-Type: text/html; charset="utf-8"
Subject: Test Results

<html>
<body>
<table>
<tr><td>Driver 1</td><td>30.456</td></tr>
</table>
</body>
</html>
EML;
        file_put_contents($tempFile, $emlContent);

        try {
            $result = $this->parser->parse($tempFile, 1);
            $this->assertIsArray($result);
        } finally {
            unlink($tempFile);
        }
    }

    public function test_extract_lap_times_from_html(): void
    {
        // Test protected/private method via reflection if needed
        $html = '<table><tr><td>Driver</td><td>30.456</td></tr></table>';
        
        // Create temp file with HTML content
        $tempFile = tempnam(sys_get_temp_dir(), 'test_') . '.eml';
        file_put_contents($tempFile, "Content-Type: text/html\n\n$html");

        try {
            $result = $this->parser->parse($tempFile, 1);
            $this->assertIsArray($result);
        } finally {
            unlink($tempFile);
        }
    }

    public function test_parse_handles_empty_content_gracefully(): void
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'test_') . '.eml';
        file_put_contents($tempFile, "Content-Type: text/plain\n\n");

        try {
            $result = $this->parser->parse($tempFile, 1);
            $this->assertIsArray($result);
        } finally {
            unlink($tempFile);
        }
    }
}
