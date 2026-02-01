"""Tests for the config module."""

import json
import tempfile
import os
from unittest.mock import patch, MagicMock

# Add parent directory to path for imports
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import load_config, get_heat_price, get_cost_per_lap


class TestLoadConfig:
    """Tests for load_config function."""

    def test_load_config_from_file(self, mock_secrets):
        """Test loading config from a JSON file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(mock_secrets, f)
            temp_path = f.name

        try:
            with patch('config.Path') as mock_path:
                mock_path.return_value.parent.__truediv__.return_value.exists.return_value = True
                # Use context manager to ensure file is properly closed
                with open(temp_path, 'r') as temp_file:
                    with patch('builtins.open', MagicMock(return_value=temp_file)):
                        config = load_config()
                        assert config is not None
                        assert isinstance(config, dict)
        finally:
            os.unlink(temp_path)

    def test_load_config_returns_defaults(self):
        """Test that load_config returns default configuration."""
        config = load_config()
        assert config is not None
        assert isinstance(config, dict)
        assert 'openweather_api_key' in config
        assert 'default_drivers' in config
        assert 'track_configs' in config


class TestGetHeatPrice:
    """Tests for get_heat_price function."""

    def test_get_heat_price_known_track(self):
        """Test getting price for a known track."""
        price = get_heat_price("Default Track", 1)
        assert isinstance(price, (int, float))
        assert price >= 0

    def test_get_heat_price_unknown_track(self):
        """Test getting price for unknown track returns default."""
        price = get_heat_price("Unknown Track XYZ", 2)
        assert isinstance(price, (int, float))
        assert price >= 0


class TestGetCostPerLap:
    """Tests for get_cost_per_lap function."""

    def test_get_cost_per_lap_known_track(self):
        """Test getting cost per lap for known track."""
        cost = get_cost_per_lap("De Voltage")
        assert isinstance(cost, (int, float))
        assert cost >= 0

    def test_get_cost_per_lap_unknown_track(self):
        """Test getting cost per lap for unknown track."""
        cost = get_cost_per_lap("Unknown Track")
        assert isinstance(cost, (int, float))
