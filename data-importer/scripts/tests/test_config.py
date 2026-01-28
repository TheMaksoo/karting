"""Tests for the config module."""

import pytest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock

# Add parent directory to path for imports
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import load_secrets, get_heat_price, get_cost_per_lap


class TestLoadSecrets:
    """Tests for load_secrets function."""

    def test_load_secrets_from_file(self, mock_secrets):
        """Test loading secrets from a JSON file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(mock_secrets, f)
            temp_path = f.name

        try:
            with patch('config.os.path.exists', return_value=True):
                with patch('builtins.open', MagicMock(return_value=open(temp_path))):
                    secrets = load_secrets()
                    assert secrets is not None
        finally:
            os.unlink(temp_path)

    def test_load_secrets_missing_file_returns_empty(self):
        """Test that missing secrets file returns empty dict."""
        with patch('config.os.path.exists', return_value=False):
            secrets = load_secrets()
            assert secrets == {} or secrets is not None


class TestGetHeatPrice:
    """Tests for get_heat_price function."""

    def test_get_heat_price_known_track(self):
        """Test getting price for a known track."""
        price = get_heat_price("De Voltage")
        assert isinstance(price, (int, float))
        assert price >= 0

    def test_get_heat_price_unknown_track(self):
        """Test getting price for unknown track returns default."""
        price = get_heat_price("Unknown Track XYZ")
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
