# Configuration file for Karting Session Processor
# This file loads secrets from environment variables or a secrets file

import os
import json
from pathlib import Path

def load_config():
    """Load configuration from environment variables or secrets.json file"""
    config = {}
    
    # Try to load from environment variables first
    config['openweather_api_key'] = os.getenv('OPENWEATHER_API_KEY')
    
    # If not found in environment, try to load from secrets.json
    if not config['openweather_api_key']:
        secrets_file = Path(__file__).parent / 'secrets.json'
        if secrets_file.exists():
            try:
                with open(secrets_file, 'r') as f:
                    secrets = json.load(f)
                    config.update(secrets)  # Load all secrets
            except (json.JSONDecodeError, FileNotFoundError):
                # Secrets file is invalid or doesn't exist - use defaults
                config['openweather_api_key'] = None
    
    # Set defaults for any missing configuration
    if not config.get('openweather_api_key'):
        config['openweather_api_key'] = None
    
    # Default friends list if not provided
    if not config.get('default_drivers'):
        config['default_drivers'] = ['Driver 1', 'Driver 2', 'Driver 3']
    
    # Default track configurations if not provided
    if not config.get('track_configs'):
        config['track_configs'] = {
           
            'Default Track': {
                'indoor': True,
                'city': 'Unknown',
                'country': 'Unknown',
                'timezone': 'UTC',
                'distance': 400,  # meters (default)
                'corners': 10     # default
            },
            'Fastkart Elche': {
                'indoor': False,
                'city': 'Elche',
                'country': 'Spain',
                'timezone': 'Europe/Madrid',
                'distance': 1160,
                'corners': 14,
                'width': 10,
                'track_id': 'TRK-001'
            },
            'De Voltage': {
                'indoor': True,
                'city': 'Tilburg',
                'country': 'Netherlands',
                'timezone': 'Europe/Amsterdam',
                'distance': 450,
                'corners': 12,
                'width': 8,
                'track_id': 'TRK-002'
            },
            'Experience Factory Antwerp': {
                'indoor': True,
                'city': 'Antwerp',
                'country': 'Belgium',
                'timezone': 'Europe/Brussels',
                'distance': 350,
                'corners': 9,
                'width': 8,
                'track_id': 'TRK-003'
            },
            'Circuit Park Berghem': {
                'indoor': False,
                'city': 'Berghem',
                'country': 'Netherlands',
                'timezone': 'Europe/Amsterdam',
                'distance': 1200,
                'corners': 14,
                'width': 10,
                'track_id': 'TRK-004'
            },
            'Goodwill Karting': {
                'indoor': True,
                'city': 'Olen',
                'country': 'Belgium',
                'timezone': 'Europe/Brussels',
                'distance': 600,
                'corners': 12,
                'width': 8,
                'track_id': 'TRK-005'
            },
            'Lot66': {
                'indoor': True,
                'city': 'Breda',
                'country': 'Netherlands',
                'timezone': 'Europe/Amsterdam',
                'distance': 325,
                'corners': 11,
                'width': 7,
                'track_id': 'TRK-006',
                'status': 'PERMANENTLY CLOSED'
            },
            'Racing Center Gilesias': {
                'indoor': False,
                'city': 'Guardamar del Segura',
                'country': 'Spain',
                'timezone': 'Europe/Madrid',
                'distance': 500,
                'corners': 12,
                'width': 8,
                'track_id': 'TRK-007'
            }
        }
    
    # Track pricing configurations with heat-based pricing
    if not config.get('track_pricing'):
        config['track_pricing'] = {
            'Default Track': {
                'cost_per_lap': 2.50,
                'heat_pricing': {
                    1: 30.00,
                    2: 57.00,
                    3: 81.00
                }
            },
            'Fastkart Elche': {
                'cost_per_lap': 2.14,
                'heat_pricing': {
                    1: 20.00,  # Ticket Simple
                    2: 30.00,  # Carrera
                    3: 40.00,  # Gran Premio
                    4: 50.00,  # Challenge
                    5: 60.00   # Super Challenge
                }
            },
            'De Voltage': {
                'cost_per_lap': 1.65,
                'heat_pricing': {
                    1: 19.75
                }
            },
            'Experience Factory Antwerp': {
                'cost_per_lap': 2.14,
                'heat_pricing': {
                    1: 23.50
                }
            },
            'Circuit Park Berghem': {
                'cost_per_lap': 0.91,
                'heat_pricing': {
                    1: 19.95,
                    3: 49.95  # Winter action
                }
            },
            'Goodwill Karting': {
                'cost_per_lap': 0.89,
                'heat_pricing': {
                    1: 16.00,
                    2: 32.00,  # Formula 1
                    3: 47.00,  # Formula 2
                    4: 60.00   # Formula 3
                }
            },
            'Lot66': {
                'cost_per_lap': 2.00,
                'heat_pricing': {
                    1: 30.00
                }
            },
            'Racing Center Gilesias': {
                'cost_per_lap': 0.83,
                'heat_pricing': {
                    1: 15.00  # 8 min session
                }
            }
        }
    
    # Default driver aliases if not provided
    if not config.get('driver_aliases'):
        config['driver_aliases'] = {
            'Default Track': {
                driver: [driver] for driver in config['default_drivers']
            },
            'Fastkart Elche': {
                'Max van Lierop': ['Max', 'M. Lierop'],
                'Quinten van Wesel': ['Quinten', 'Q. Wesel']
            },
            'De Voltage': {
                'Max van Lierop': ['Max', 'M. Lierop'],
                'Quinten van Wesel': ['Quinten', 'Q. Wesel']
            },
            'Experience Factory Antwerp': {
                'Max van Lierop': ['Max', 'M. Lierop'],
                'Quinten van Wesel': ['Quinten', 'Q. Wesel']
            },
            'Circuit Park Berghem': {
                'Max van Lierop': ['Max', 'M. Lierop'],
                'Quinten van Wesel': ['Quinten', 'Q. Wesel']
            },
            'Goodwill Karting': {
                'Max van Lierop': ['Max', 'M. Lierop'],
                'Quinten van Wesel': ['Quinten', 'Q. Wesel']
            },
            'Racing Center Gilesias': {
                'Max van Lierop': ['Max', 'M. Lierop'],
                'Quinten van Wesel': ['Quinten', 'Q. Wesel']
            }
        }
    
    # Default Apex configs if not provided
    if not config.get('apex_configs'):
        config['apex_configs'] = {}
    
    # Default track IDs if not provided
    if not config.get('track_ids'):
        config['track_ids'] = {
            'default': 'TRK-001',
            'Fastkart Elche': 'TRK-001',
            'De Voltage': 'TRK-002',
            'Experience Factory Antwerp': 'TRK-003',
            'Circuit Park Berghem': 'TRK-004',
            'Goodwill Karting': 'TRK-005',
            'Lot66': 'TRK-006',
            'Racing Center Gilesias': 'TRK-007'
        }
    
    # CSV filename
    if not config.get('csv_file'):
        config['csv_file'] = 'Karten.csv'
    
    return config

def get_heat_price(track_name, heat_count):
    """Get the price for a specific number of heats at a track"""
    track_pricing = CONFIG.get('track_pricing', {})
    
    if track_name not in track_pricing:
        # Return a default price if track not found
        return heat_count * 30.00  # €30 per heat as fallback
    
    track_info = track_pricing[track_name]
    heat_pricing = track_info.get('heat_pricing', {})
    
    # Return the exact price if available, otherwise estimate
    if heat_count in heat_pricing:
        return heat_pricing[heat_count]
    else:
        # Estimate based on single heat price
        single_heat_price = heat_pricing.get(1, 30.00)
        # Apply diminishing returns (slight discount for multiple heats)
        discount_factor = max(0.85, 1.0 - (heat_count - 1) * 0.05)
        return round(single_heat_price * heat_count * discount_factor, 2)

def get_cost_per_lap(track_name):
    """Get the cost per lap for a specific track"""
    track_pricing = CONFIG.get('track_pricing', {})
    
    if track_name not in track_pricing:
        return 2.50  # Default cost per lap
    
    return track_pricing[track_name].get('cost_per_lap', 2.50)

# Load configuration when module is imported
CONFIG = load_config()