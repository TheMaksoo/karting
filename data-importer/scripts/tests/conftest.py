"""Test fixtures for the data-importer tests."""

import pytest
import os
import tempfile


@pytest.fixture
def sample_eml_content():
    """Sample EML file content for testing."""
    return """MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="boundary123"
Subject: Results - Karten Sessie 42

--boundary123
Content-Type: text/plain; charset="utf-8"

Session results

--boundary123
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: base64

PGh0bWw+PHRhYmxlPjx0cj48dGQ+RHJpdmVyIDE8L3RkPjx0ZD4zMC4xMjM8L3RkPjwvdHI+PC90YWJsZT48L2h0bWw+

--boundary123--
"""


@pytest.fixture
def sample_voltage_eml():
    """Sample De Voltage EML format."""
    return """MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="----=_Part_123"
Subject: Results - Karten Sessie 55

------=_Part_123
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: base64

PGh0bWw+CjxoZWFkPjwvaGVhZD4KPGJvZHk+Cjx0YWJsZT4KPHRyPjx0ZD5Ecml2ZXIgMTwvdGQ+PHRkPjMwLjQ1NjwvdGQ+PC90cj4KPHRyPjx0ZD5Ecml2ZXIgMjwvdGQ+PHRkPjMxLjEyMzwvdGQ+PC90cj4KPC90YWJsZT4KPC9ib2R5Pgo8L2h0bWw+

------=_Part_123--
"""


@pytest.fixture
def sample_elche_text():
    """Sample Fastkart Elche text format."""
    return """RESULTADOS CARRERA
Fecha: 15/06/2024
Pista: Fastkart Elche

Posición | Nombre | Mejor Tiempo
1 | Driver 1 | 00:30.456
2 | Driver 2 | 00:31.123
3 | Driver 3 | 00:31.789
"""


@pytest.fixture
def temp_eml_file(sample_eml_content):
    """Create a temporary EML file for testing."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.eml', delete=False) as f:
        f.write(sample_eml_content)
        temp_path = f.name
    yield temp_path
    os.unlink(temp_path)


@pytest.fixture
def temp_csv_file():
    """Create a temporary CSV file for testing."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        f.write("id,session_date,track,driver,lap_time\n")
        temp_path = f.name
    yield temp_path
    os.unlink(temp_path)


@pytest.fixture
def mock_secrets():
    """Mock secrets configuration."""
    return {
        "openweather_api_key": "test_api_key",
        "default_drivers": ["Driver 1", "Driver 2", "Driver 3"],
    }


@pytest.fixture
def sample_track_config():
    """Sample track configuration."""
    return {
        "De Voltage": {
            "indoor": True,
            "city": "Dordrecht",
            "country": "Netherlands",
            "timezone": "Europe/Amsterdam",
            "distance": 400,
            "corners": 10,
        },
        "Experience Factory Antwerp": {
            "indoor": True,
            "city": "Antwerp",
            "country": "Belgium",
            "timezone": "Europe/Brussels",
            "distance": 450,
            "corners": 12,
        },
    }
