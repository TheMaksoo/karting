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
                pass
    
    # Set defaults for any missing configuration
    if not config.get('openweather_api_key'):
        config['openweather_api_key'] = None
    
    # Default friends list if not provided
    if not config.get('default_drivers'):
        config['default_drivers'] = ['Driver 1', 'Driver 2', 'Driver 3']
    
    # Default track configurations if not provided
    if not config.get('track_configs'):
        config['track_configs'] = {
            'Circuit Park Berghem': {
                'indoor': False,
                'city': 'Berghem',
                'country': 'NL',
                'timezone': 'Europe/Amsterdam'
            },
            'De Voltage': {
                'indoor': True,
                'city': 'Tilburg',
                'country': 'NL',
                'timezone': 'Europe/Amsterdam'
            },
            'Goodwill Karting': {
                'indoor': True,
                'city': 'Olen',
                'country': 'BE',
                'timezone': 'Europe/Brussels'
            },
            'Experience Factory Antwerp': {
                'indoor': True,
                'city': 'Antwerp',
                'country': 'BE',
                'timezone': 'Europe/Brussels'
            },
            'Lot66': {
                'indoor': True,
                'city': 'Breda',
                'country': 'NL',
                'timezone': 'Europe/Amsterdam'
            },
            'Default Track': {
                'indoor': True,
                'city': 'Unknown',
                'country': 'Unknown',
                'timezone': 'UTC'
            }
        }
    
    # Track pricing configurations with heat-based pricing
    if not config.get('track_pricing'):
        config['track_pricing'] = {
            'De Voltage': {
                'cost_per_lap': 2.35,
                'heat_pricing': {
                    1: 19.75,
                    2: 37.50,
                    3: 50.00,
                }
            },
            'Circuit Park Berghem': {
                'cost_per_lap': 2.75,
                'heat_pricing': {
                    1: 19.95,
                    2: 39.90,
                    3: 59.85,
                    4: 79.80
                }
            },
            'Goodwill Karting': {
                'cost_per_lap': 2.80,
                'heat_pricing': {
                    1: 14.00
                }
            },
            'Experience Factory Antwerp': {
                'cost_per_lap': 3.25,
                'heat_pricing': {
                    1: 27.00,
                    2: 47.00,
                    3: 67.00, 
                    4: 87.00
                }
            },
            'lot66': {
                'cost_per_lap': 0.95,  # Calculated from €19.50/21 laps ≈ €0.95 per lap
                'heat_pricing': {
                    1: 19.50,  # €19.50 for 1 session (Adult pricing)
                    2: 36.50,  # €36.50 for 2 sessions
                    3: 52.50   # €52.50 for 3 sessions
                }
            }
        }
    
    # Default driver aliases if not provided
    if not config.get('driver_aliases'):
        config['driver_aliases'] = {
            'Default Track': {
                driver: [driver] for driver in config['default_drivers']
            }
        }
    
    # Default Apex configs if not provided
    if not config.get('apex_configs'):
        config['apex_configs'] = {}
    
    # Default track IDs if not provided
    if not config.get('track_ids'):
        config['track_ids'] = {
            'default': 'TRK-001'
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