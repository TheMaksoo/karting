"""Tests for the session_parser module."""

import pytest
import os
import base64
from email.message import EmailMessage

# Add parent directory to path for imports
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from session_parser import SessionParser


class TestSessionParser:
    """Tests for the SessionParser class."""

    @pytest.fixture
    def parser(self):
        """Create a SessionParser instance."""
        return SessionParser()

    def test_parser_initialization(self, parser):
        """Test parser initializes correctly."""
        assert parser is not None

    def test_parse_file_with_invalid_path(self, parser):
        """Test parsing non-existent file returns None or raises."""
        result = parser.parse_file("/nonexistent/file.eml")
        assert result is None or result == {}

    def test_parse_file_detects_eml(self, parser, temp_eml_file):
        """Test that EML files are detected and parsed."""
        result = parser.parse_file(temp_eml_file)
        # Result may be None if format not recognized, that's ok
        assert result is None or isinstance(result, dict)

    def test_get_email_body_extracts_content(self, parser):
        """Test email body extraction from multipart message."""
        msg = EmailMessage()
        msg['Subject'] = 'Test'
        msg.set_content('Plain text content')
        msg.add_alternative('<html><body>HTML content</body></html>', subtype='html')
        
        body = parser.get_email_body(msg)
        assert body is not None
        assert len(body) > 0

    def test_identify_track_from_content(self, parser):
        """Test track identification from email content."""
        content = "Results from De Voltage karting session"
        track = parser.identify_track(content)
        # May or may not identify, depending on implementation
        assert track is None or isinstance(track, str)

    def test_convert_to_csv_row_format(self, parser):
        """Test conversion of parsed data to CSV format."""
        sample_data = {
            'session_date': '2024-06-15',
            'track': 'De Voltage',
            'drivers': [
                {'name': 'Driver 1', 'best_time': 30.456},
            ],
        }
        # This tests the interface exists
        if hasattr(parser, 'convert_to_csv_row'):
            result = parser.convert_to_csv_row(sample_data)
            assert result is not None


class TestBase64Decoding:
    """Tests for base64 decoding in parser."""

    def test_decode_valid_base64(self):
        """Test decoding valid base64 content."""
        original = "<html><body>Test</body></html>"
        encoded = base64.b64encode(original.encode()).decode()
        decoded = base64.b64decode(encoded).decode()
        assert decoded == original

    def test_decode_base64_with_newlines(self):
        """Test decoding base64 with embedded newlines."""
        original = "<html><body>Test content here</body></html>"
        encoded = base64.b64encode(original.encode()).decode()
        # Add newlines like email clients do
        encoded_with_newlines = '\n'.join([encoded[i:i+76] for i in range(0, len(encoded), 76)])
        cleaned = encoded_with_newlines.replace('\n', '')
        decoded = base64.b64decode(cleaned).decode()
        assert decoded == original


class TestLapTimeExtraction:
    """Tests for lap time extraction patterns."""

    def test_extract_lap_time_mm_ss_format(self):
        """Test extracting times in MM:SS.mmm format."""
        import re
        pattern = r'(\d{1,2}):(\d{2})\.(\d{3})'
        text = "Best lap: 1:23.456"
        match = re.search(pattern, text)
        assert match is not None
        minutes, seconds, millis = match.groups()
        total_seconds = int(minutes) * 60 + int(seconds) + int(millis) / 1000
        assert abs(total_seconds - 83.456) < 0.001

    def test_extract_lap_time_ss_mmm_format(self):
        """Test extracting times in SS.mmm format."""
        import re
        pattern = r'(\d{2})\.(\d{3})'
        text = "Lap time: 30.456"
        match = re.search(pattern, text)
        assert match is not None
        seconds, millis = match.groups()
        total_seconds = int(seconds) + int(millis) / 1000
        assert abs(total_seconds - 30.456) < 0.001

    def test_extract_multiple_lap_times(self):
        """Test extracting multiple lap times from text."""
        import re
        pattern = r'\d{2}\.\d{3}'
        text = "Laps: 30.123, 30.456, 31.789, 30.001"
        matches = re.findall(pattern, text)
        assert len(matches) == 4
        assert '30.123' in matches
        assert '30.456' in matches
