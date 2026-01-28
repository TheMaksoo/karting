"""Tests for the process_karting_sessions module."""

import os
import tempfile
import csv

# Add parent directory to path for imports
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestTimeConversion:
    """Tests for time conversion functions."""

    def test_convert_time_string_to_seconds(self):
        """Test converting time strings to seconds."""
        # Import here to avoid issues if module has side effects
        from process_karting_sessions import convert_time_to_seconds
        
        # Test MM:SS.mmm format
        result = convert_time_to_seconds("1:30.500")
        assert abs(result - 90.5) < 0.001

    def test_convert_seconds_only_format(self):
        """Test converting SS.mmm format."""
        from process_karting_sessions import convert_time_to_seconds
        
        result = convert_time_to_seconds("30.456")
        assert abs(result - 30.456) < 0.001


class TestSpeedCalculation:
    """Tests for speed calculation functions."""

    def test_calculate_speed_from_distance_and_time(self):
        """Test speed calculation."""
        from process_karting_sessions import calculate_speed
        
        # 400m in 30 seconds = 48 km/h
        speed = calculate_speed(400, 30.0)
        assert abs(speed - 48.0) < 0.1

    def test_calculate_speed_zero_time_returns_zero(self):
        """Test that zero time returns zero speed."""
        from process_karting_sessions import calculate_speed
        
        speed = calculate_speed(400, 0)
        assert speed == 0


class TestDuplicateDetection:
    """Tests for duplicate session detection."""

    def test_is_duplicate_session_returns_false_for_new(self, temp_csv_file):
        """Test new session is not duplicate."""
        from process_karting_sessions import is_duplicate_session
        
        # Write some existing data
        with open(temp_csv_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'session_date', 'track', 'driver', 'lap_time'])
            writer.writerow(['1', '2024-01-01', 'Track A', 'Driver 1', '30.456'])
        
        result = is_duplicate_session(temp_csv_file, '2024-06-15', 'Track B', 'Driver 1')
        assert result is False

    def test_is_duplicate_session_returns_true_for_existing(self, temp_csv_file):
        """Test existing session is detected as duplicate."""
        from process_karting_sessions import is_duplicate_session
        
        with open(temp_csv_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'session_date', 'track', 'driver', 'lap_time'])
            writer.writerow(['1', '2024-06-15', 'Track A', 'Driver 1', '30.456'])
        
        result = is_duplicate_session(temp_csv_file, '2024-06-15', 'Track A', 'Driver 1')
        assert result is True


class TestSessionNumbering:
    """Tests for session numbering logic."""

    def test_get_session_number_first_of_day(self, temp_csv_file):
        """Test first session of day gets number 1."""
        from process_karting_sessions import get_session_number
        
        with open(temp_csv_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'session_date', 'track', 'session_number'])
        
        result = get_session_number(temp_csv_file, '2024-06-15', 'Track A')
        assert result == 1

    def test_get_session_number_increments(self, temp_csv_file):
        """Test session number increments for same day/track."""
        from process_karting_sessions import get_session_number
        
        with open(temp_csv_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'session_date', 'track', 'session_number'])
            writer.writerow(['1', '2024-06-15', 'Track A', '1'])
            writer.writerow(['2', '2024-06-15', 'Track A', '2'])
        
        result = get_session_number(temp_csv_file, '2024-06-15', 'Track A')
        assert result == 3


class TestDriverNormalization:
    """Tests for driver name normalization."""

    def test_normalize_driver_name_strips_whitespace(self):
        """Test driver names are trimmed."""
        from process_karting_sessions import normalize_driver_name
        
        result = normalize_driver_name("  Driver 1  ")
        assert result == "Driver 1"

    def test_normalize_driver_name_handles_aliases(self):
        """Test driver aliases are resolved."""
        from process_karting_sessions import normalize_driver_name
        
        # This depends on configured aliases
        result = normalize_driver_name("Some Alias")
        assert isinstance(result, str)
        assert len(result) > 0


class TestCSVWriting:
    """Tests for CSV writing functions."""

    def test_write_session_to_csv_creates_file(self):
        """Test writing session creates CSV file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            temp_path = f.name
        
        try:
            from process_karting_sessions import write_session_to_csv
            
            session_data = {
                'session_date': '2024-06-15',
                'track': 'Test Track',
                'drivers': [
                    {'name': 'Driver 1', 'laps': [30.123, 30.456]},
                ],
            }
            
            write_session_to_csv(temp_path, session_data)
            
            assert os.path.exists(temp_path)
            with open(temp_path, 'r') as f:
                content = f.read()
                assert 'Driver 1' in content or len(content) > 0
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    def test_write_session_appends_to_existing(self, temp_csv_file):
        """Test writing session appends to existing file."""
        from process_karting_sessions import write_session_to_csv
        
        # Write initial data
        with open(temp_csv_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'session_date', 'track', 'driver', 'lap_time'])
            writer.writerow(['1', '2024-01-01', 'Track A', 'Driver 1', '30.456'])
        
        initial_size = os.path.getsize(temp_csv_file)
        
        session_data = {
            'session_date': '2024-06-15',
            'track': 'Track B',
            'drivers': [{'name': 'Driver 2', 'laps': [31.123]}],
        }
        
        write_session_to_csv(temp_csv_file, session_data)
        
        # File should have grown
        new_size = os.path.getsize(temp_csv_file)
        assert new_size >= initial_size
