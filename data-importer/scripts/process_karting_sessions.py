#!/usr/bin/env python3
"""
Multi-Track Karting Session Data Processor
==========================================

This script processes karting session emails from multiple tracks and extracts
lap time data for specified drivers, then adds it to your karting CSV database.

Usage:
    python process_karting_sessions.py

The script will:
1. Scan all folders in the script directory for .eml files
2. Each folder represents a different track
3. Extract data for your specified drivers (with track-specific aliases)
4. Add new session data to Karten.csv
5. Provide a summary of sessions processed

Author: Max van lierop
Date: October 2025
"""

import os
import base64
import re
import csv
from datetime import datetime
import requests
from config import CONFIG, get_heat_price

# Load configuration from config file
DRIVER_ALIASES = CONFIG['driver_aliases']
DEFAULT_DRIVERS = CONFIG['default_drivers']
CSV_FILE = CONFIG['csv_file']
TRACK_CONFIGS = CONFIG['track_configs']
TRACK_IDS = CONFIG['track_ids']



def get_driver_aliases(track_name):
    """Get driver aliases for a specific track, filtering out identical aliases"""
    track_aliases = DRIVER_ALIASES.get(track_name, {})
    
    # If track not found, return clean aliases for all default drivers
    if not track_aliases:
        return {driver: [alias for alias in [driver] if alias.lower() != driver.lower()] or [driver] 
                for driver in DEFAULT_DRIVERS}
    
    # Filter out aliases that are identical to the standard name (case-insensitive)
    filtered_aliases = {}
    for standard_name, alias_list in track_aliases.items():
        # Keep only aliases that are actually different from the standard name
        different_aliases = [alias for alias in alias_list if alias.lower() != standard_name.lower()]
        # If no different aliases, keep the standard name
        filtered_aliases[standard_name] = different_aliases if different_aliases else [standard_name]
    
    return filtered_aliases

def normalize_driver_name(name, track_name):
    """Normalize driver names for consistent matching based on track"""
    name = name.strip()
    aliases = get_driver_aliases(track_name)
    
    for standard_name, alias_list in aliases.items():
        for alias in alias_list:
            # Case-insensitive matching
            if alias.lower() in name.lower():
                return standard_name
    return name

def convert_time_to_seconds(time_str):
    """Convert time string (like '1:23.456') to seconds (83.456)"""
    try:
        if ':' in time_str:
            parts = time_str.split(':')
            if len(parts) == 2:
                minutes = int(parts[0])
                seconds = float(parts[1])
                return minutes * 60 + seconds
            else:
                # Unexpected format with multiple colons
                print(f"Warning: Unexpected time format '{time_str}'")
                return None
        else:
            # Already in seconds format
            return float(time_str)
    except (ValueError, IndexError):
        print(f"Warning: Could not convert time '{time_str}' to seconds")
        return None

def calculate_avg_speed(distance_meters, lap_time_seconds):
    """Calculate average speed in km/h from distance and lap time
    
    Args:
        distance_meters: Track distance in meters
        lap_time_seconds: Lap time in seconds
    
    Returns:
        Average speed in km/h, or 0 if calculation fails
    """
    try:
        if lap_time_seconds > 0 and distance_meters > 0:
            # Speed (km/h) = (distance_m / time_s) * 3.6
            return round((distance_meters / lap_time_seconds) * 3.6, 2)
        return 0
    except (ValueError, TypeError, ZeroDivisionError):
        return 0

def extract_experience_factory_html_data(content, file_path, track_name):
    """Extract data from Experience Factory HTML email format"""
    import base64
    from bs4 import BeautifulSoup
    
    try:
        # Determine driver from filename or email address
        filename = os.path.basename(file_path).lower()
        detected_driver = None
        
        # Method 1: Check filename for driver name
        if 'max' in filename:
            detected_driver = "Max van Lierop"
            print(f"DEBUG: Detected Max van Lierop from filename: {filename}")
        elif 'quinten' in filename:
            detected_driver = "Quinten van Wesel"
            print(f"DEBUG: Detected Quinten van Wesel from filename: {filename}")
        else:
            # Method 2: Check email address in content
            email_match = re.search(r'maxvanlierop05@gmail\.com', content, re.IGNORECASE)
            if email_match:
                detected_driver = "Max van Lierop"
                print("DEBUG: Detected Max van Lierop from email address")
            
            email_match = re.search(r'apex-timing@quintenvw\.com', content, re.IGNORECASE)
            if email_match:
                detected_driver = "Quinten van Wesel"
                print("DEBUG: Detected Quinten van Wesel from email address")
        
        if not detected_driver:
            print("DEBUG: Could not determine driver from filename or email")
            return None
        # Decode base64 content from email
        # Look for base64 content between Content-Transfer-Encoding: base64
        base64_match = re.search(r'Content-Transfer-Encoding: base64\s*\n\n(.*?)\n\n--', content, re.DOTALL)
        if not base64_match:
            print("DEBUG: No base64 content found in Experience Factory email")
            return None
        
        base64_content = base64_match.group(1).replace('\n', '')
        
        try:
            decoded_content = base64.b64decode(base64_content).decode('utf-8')
        except Exception as e:
            print(f"DEBUG: Failed to decode base64 content: {e}")
            return None
        
        # Parse the HTML
        soup = BeautifulSoup(decoded_content, 'html.parser')
        
        # Look for race information and driver data
        race_info = None
        race_headers = soup.find_all(text=re.compile(r'\d+\.\s*RACE'))
        if race_headers:
            race_info = race_headers[0].strip()
            print(f"DEBUG: Found race info: {race_info}")
        
        # Extract date from race info (format: "49. RACE - 19:00 - 26/08/2025 to 19:02")
        session_date = '2025-08-26'  # Default
        session_time = '19:00'       # Default
        session_num = 'EFA-Unknown'
        
        if race_info:
            # Extract session number
            session_match = re.search(r'(\d+)\.\s*RACE', race_info)
            if session_match:
                session_num = f"EFA-{session_match.group(1)}"
            
            # Extract time and date
            time_match = re.search(r'-\s*(\d{2}:\d{2})\s*-\s*(\d{2}/\d{2}/\d{4})', race_info)
            if time_match:
                session_time = time_match.group(1)
                date_part = time_match.group(2)  # DD/MM/YYYY format
                day, month, year = date_part.split('/')
                session_date = f"{year}-{month}-{day}"
        
        # Look for driver data in the decoded content (text format after decoding)
        found_drivers = {}
        
        # The decoded content contains both HTML and plain text sections
        # Look for the plain text section with driver names and times
        lines = decoded_content.split('\n')
        
        # Look for timing data for our detected driver using their alias
        driver_aliases = get_driver_aliases(track_name)
        alias_list = driver_aliases.get(detected_driver, [detected_driver])
        
        # Try to find timing data in the summary table
        found_in_summary = False
        for i, line in enumerate(lines):
            # Look for lines with our driver's aliases
            for alias in alias_list:
                if alias in line and alias.strip():  # Make sure alias is not empty
                    print(f"DEBUG: Found alias '{alias}' for {detected_driver} in line: {line[:100]}")
                    
                    # Look for timing data in the same line
                    # Pattern like: "¿ 11 25.403 21.359 22.539 1:09.301 0.499 1:13.434"
                    timing_match = re.search(rf'{re.escape(alias)}\s+(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d:.]+)\s+([\d.]+)\s+([\d:.]+)', line)
                    if timing_match:
                        print(f"DEBUG: Timing match found for {detected_driver}: {timing_match.groups()}")
                        laps, s1, s2, s3, best_time_str, gap, avg_time = timing_match.groups()
                        
                        # Convert best time to seconds
                        best_time = convert_time_to_seconds(best_time_str)
                        if best_time is None:
                            print(f"DEBUG: Failed to convert time '{best_time_str}' for {detected_driver}")
                            continue
                        
                        # Look for position - check previous lines for position number
                        position = 1  # Default
                        for j in range(max(0, i-5), i):
                            prev_line = lines[j].strip()
                            if prev_line.isdigit() and len(prev_line) <= 2:  # Position should be 1-2 digits
                                position = int(prev_line)
                                break
                            
                        found_drivers[detected_driver] = {
                            'position': position,
                            'best_time': best_time,
                            'laps': [],  # Will be filled with individual lap times
                            'lap_sector_times': [],  # Will store sector times for each lap
                            'lap_count': int(laps),
                            'sector_times': [float(s1), float(s2), float(s3)]  # Best lap sector times
                        }
                        
                        print(f"DEBUG: Found summary data for {detected_driver}: P{position}, {laps} laps, best: {best_time:.3f}s")
                        found_in_summary = True
                        break
                    else:
                        print(f"DEBUG: No timing match for alias '{alias}' in line: {line[:100]}")
            
            if found_in_summary:
                break
        
        # If we didn't find summary data but we detected a driver, create a minimal entry
        # This handles cases where the driver data is in the individual laps but not in the summary
        if not found_in_summary and detected_driver:
            print(f"DEBUG: No summary data found for {detected_driver}, will extract from individual laps only")
            found_drivers[detected_driver] = {
                'position': 1,  # Will be updated from actual data if available
                'best_time': 999.0,  # Will be calculated from individual laps
                'laps': [],
                'lap_sector_times': [],
                'lap_count': 0,  # Will be updated from individual laps
                'sector_times': [0.0, 0.0, 0.0]  # Will be updated from best lap
            }        # Now extract individual lap times from the "Your lap times" section
        # This section appears to be for one driver per email
        for i, line in enumerate(lines):
            if 'Your lap times' in line:
                print(f"DEBUG: Found individual lap times section at line {i}")
                
                # Skip the header line and process lap data
                for j in range(i + 2, len(lines)):  # Skip "Your lap times RK" and "Lap S1 S2 S3 Time" header
                    lap_line = lines[j].strip()
                    
                    # Stop when we hit the next section
                    if 'Your last sessions' in lap_line or not lap_line:
                        break
                    
                    # Parse individual lap times (format: "1 31.316 21.454 23.286 1:16.056")
                    lap_match = re.search(r'^(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d:.]+)', lap_line)
                    if lap_match:
                        lap_num, s1, s2, s3, lap_time_str = lap_match.groups()
                        lap_time = convert_time_to_seconds(lap_time_str)
                        
                        if lap_time is not None:
                            print(f"DEBUG: Found individual lap {lap_num}: {lap_time:.3f}s")
                            
                            # Add the lap time and sector times to the detected driver
                            if detected_driver in found_drivers:
                                found_drivers[detected_driver]['laps'].append(lap_time)
                                found_drivers[detected_driver]['lap_sector_times'].append([float(s1), float(s2), float(s3)])
                                print(f"DEBUG: Added lap {lap_num} ({lap_time:.3f}s, sectors: {s1}, {s2}, {s3}) to {detected_driver}")
                            else:
                                print(f"DEBUG: Could not find {detected_driver} in found_drivers")
                
                break  # Only process first "Your lap times" section found
        
        # Update driver stats based on individual laps if they weren't found in summary
        for driver_name in found_drivers:
            driver_data = found_drivers[driver_name]
            if driver_data['laps']:
                # Update lap count
                driver_data['lap_count'] = len(driver_data['laps'])
                
                # Calculate best time from individual laps if it wasn't found in summary
                if driver_data['best_time'] >= 999.0:
                    driver_data['best_time'] = min(driver_data['laps'])
                    
                    # Find the sector times for the best lap
                    best_lap_index = driver_data['laps'].index(driver_data['best_time'])
                    if best_lap_index < len(driver_data['lap_sector_times']):
                        driver_data['sector_times'] = driver_data['lap_sector_times'][best_lap_index]
                    
                    print(f"DEBUG: Updated {driver_name} best time from laps: {driver_data['best_time']:.3f}s")
        
        if found_drivers:
            return {
                'session': session_num,
                'date': session_date,
                'time': session_time,
                'drivers': found_drivers,
                'track': track_name
            }
        else:
            print("DEBUG: No target drivers found in Experience Factory email")
            return None
        
    except Exception as e:
        print(f"ERROR: Failed to parse Experience Factory email: {e}")
        return None

def process_lot66_file(content, file_path, track_name):
    """Process lot66 lap time text files"""
    try:
        print(f"DEBUG: lot66 processing with track_name: '{track_name}'")
        
        # Parse content lines
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        
        if len(lines) < 3:
            print(f"DEBUG: lot66 file format invalid - need at least 3 lines: {file_path}")
            return None
        
        # Read track name, driver, and date/time from first three lines
        file_track_name = lines[0].strip()
        detected_driver = lines[1].strip()
        date_time_line = lines[2].strip()
        
        print(f"DEBUG: lot66 file track: '{file_track_name}'")
        print(f"DEBUG: lot66 file driver: '{detected_driver}'")
        print(f"DEBUG: lot66 file date/time: '{date_time_line}'")
        
        # Verify driver is in our target list (case-insensitive)
        target_drivers = CONFIG.get('default_drivers', [])
        matched_driver = None
        for target_driver in target_drivers:
            if detected_driver.lower() == target_driver.lower():
                matched_driver = target_driver
                break
        
        if not matched_driver:
            print(f"DEBUG: Driver '{detected_driver}' not in target drivers list: {target_drivers}")
            return None
        
        # Use the standardized driver name
        detected_driver = matched_driver
        print(f"DEBUG: Detected valid driver: {detected_driver}")
        
        # Parse date and time from line 3 (format: "26.10.2024 At 1830h")
        date_time_match = re.search(r'(\d{2})\.(\d{2})\.(\d{4})\s+At\s+(\d{4})h', date_time_line)
        if date_time_match:
            day, month, year, time_str = date_time_match.groups()
            session_date = f"{year}-{month}-{day}"
            session_time = f"{time_str[:2]}:{time_str[2:]}"
        else:
            print(f"DEBUG: Could not parse date/time from line: {date_time_line}")
            session_date = "2024-01-01"
            session_time = "00:00"
        
        print(f"DEBUG: Detected valid driver: {detected_driver}")
        
        # Find time entries (format: 00:XX.XXX) from the remaining lines
        lap_times = []
        for line in lines[3:]:  # Skip first 3 lines (track, driver, date/time)
            if re.match(r'^00:\d{2}\.\d{3}$', line):
                try:
                    # Extract seconds part after "00:"
                    seconds_part = line[3:]  # Remove "00:" prefix
                    lap_time = float(seconds_part)
                    lap_times.append(lap_time)
                    print(f"DEBUG: Found lap time {lap_time}s (converted from {line}) for {detected_driver}")
                except ValueError:
                    print(f"DEBUG: Could not parse time '{line}' for {detected_driver}")
        
        if not lap_times:
            print(f"DEBUG: No valid lap times found for {detected_driver}")
            return None
        
        # Extract session number from filename if available (for uniqueness)
        filename = os.path.basename(file_path)
        session_num = '1'  # Default to session 1
        if 'copy' in filename.lower():
            session_num = '2'  # Assume second session if filename contains 'copy'
        
        # Create driver data structure
        found_drivers = {
            detected_driver: {
                'laps': lap_times,
                'lap_gaps': [''] * len(lap_times),  # No gap data
                'position': 1,  # Default position
                'best_lap': min(lap_times),
                'best_time': min(lap_times),
                'daily_rank': 1
            }
        }
        
        print(f"DEBUG: Found {len(lap_times)} laps for {detected_driver}, best: {min(lap_times)}s")
        print(f"DEBUG: Session date: {session_date}, time: {session_time}")
        
        return {
            'track': 'lot66',
            'session': session_num,
            'session_type': 'Practice',
            'date': session_date,
            'time': session_time,
            'drivers': found_drivers,
            'filename': filename
        }
        
    except Exception as e:
        print(f"ERROR: Failed to parse lot66 file: {e}")
        return None

def extract_session_data(file_path, track_name):
    """Extract karting data from a single EML file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Special handling for Experience Factory HTML emails
        if track_name == 'Experience Factory Antwerp':
            return extract_experience_factory_html_data(content, file_path, track_name)
        
        # Special handling for lot66 text files
        if track_name == 'lot66' or track_name == 'Lot66':
            print(f"DEBUG: Calling process_lot66_file for track '{track_name}' and file '{file_path}'")
            return process_lot66_file(content, file_path, track_name)
        
        # Extract session number from filename - support multiple patterns
        session_num = 'Unknown'
        
        # Pattern 1: Goodwill Karting format - "Sessie (\d+)"
        session_match = re.search(r'Sessie (\d+)', file_path)
        if session_match:
            session_num = session_match.group(1)
        else:
            # Pattern 2: Circuit Park Berghem format - "Results - (\d+) - Heat"
            heat_match = re.search(r'Results - (\d+) - Heat', file_path)
            if heat_match:
                session_num = heat_match.group(1)
            else:
                # Pattern 3: De Voltage format - try to extract from any number in filename
                number_match = re.search(r'(\d+)', os.path.basename(file_path))
                if number_match:
                    session_num = number_match.group(1)
        
        # Extract date and time from email headers (try multiple formats)
        date_match = re.search(r'Date: [^,]+, (\d{1,2}) (\w{3}) (\d{4}) (\d{2}):(\d{2})', content)
        if date_match:
            day, month_abbr, year, hour, minute = date_match.groups()
            month_map = {
                'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
                'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
            }
            month = month_map.get(month_abbr, '01')
            session_date = f'{year}-{month}-{day.zfill(2)}'
            session_time = f'{hour}:{minute}'
        else:
            session_date = datetime.now().strftime('%Y-%m-%d')
            session_time = '12:00'
        
        # Find and decode base64 content
        base64_match = re.search(r'Content-Transfer-Encoding: base64\s*\n\n(.*?)(?=\n--)', content, re.DOTALL)
        if not base64_match:
            print(f"No base64 content found in {os.path.basename(file_path)}")
            return None
            
        base64_content = base64_match.group(1).replace('\n', '')
        decoded = base64.b64decode(base64_content).decode('utf-8')
        
        # Try to extract better date/time from content (for Goodwill Karting format)
        content_date_match = re.search(r'Sessie (\d+) - (\d{2}/\d{2}/\d{4}) om (\d{2}:\d{2})', decoded)
        if content_date_match:
            session_num = content_date_match.group(1)
            date_str = content_date_match.group(2)  # DD/MM/YYYY
            time_str = content_date_match.group(3)  # HH:MM
            
            # Convert DD/MM/YYYY to YYYY-MM-DD
            day, month, year = date_str.split('/')
            session_date = f'{year}-{month}-{day}'
            session_time = time_str
        
        base64_content = base64_match.group(1).replace('\n', '')
        decoded = base64.b64decode(base64_content).decode('utf-8')
        
        # Find our target drivers and their results
        found_drivers = {}
        driver_aliases = get_driver_aliases(track_name)
        
        # Parse heat overview for positions and best times
        lines = decoded.split('\n')
        
        # Method 1: Standard SMS Timing format (De Voltage, Circuit Park Berghem)
        for line in lines:
            if re.match(r'\d+\.\s+', line):  # Lines starting with position number
                # Check if any of our target drivers are in this line
                for standard_name, alias_list in driver_aliases.items():
                    if any(alias.lower() in line.lower() for alias in alias_list):
                        parts = line.split()
                        try:
                            pos = int(parts[0].replace('.', ''))
                            time_str = parts[-1]
                            
                            # Handle different time formats
                            if ':' in time_str:  # MM:SS.sss format (Circuit Park Berghem)
                                time_parts = time_str.split(':')
                                minutes = int(time_parts[0])
                                seconds = float(time_parts[1])
                                best_time = minutes * 60 + seconds
                            else:  # SS.sss format (De Voltage)
                                best_time = float(time_str)
                            
                            found_drivers[standard_name] = {
                                'position': pos,
                                'best_time': best_time,
                                'daily_rank': pos
                            }
                        except (ValueError, IndexError):
                            # Skip lines with invalid format
                            continue
                        break
        
        # Method 2: Goodwill Karting format (Apex Timing client area)
        # For Goodwill Karting, parse multiple sessions and assign to different drivers
        if track_name == 'Goodwill Karting' and not found_drivers:
            print("DEBUG: Processing Goodwill Karting sessions for multiple drivers")
            
            # Determine driver from filename
            filename = os.path.basename(file_path).lower()
            target_driver = None
            
            if 'max' in filename:
                target_driver = "Max van Lierop"
                print(f"DEBUG: Detected Max van Lierop from filename: {filename}")
            elif 'quinten' in filename or ('sessie 7.eml' in filename and 'max' not in filename):
                target_driver = "Quinten van Wesel"
                print(f"DEBUG: Detected Quinten van Wesel from filename: {filename}")
            else:
                # Default assignment based on file order/content
                target_driver = "Quinten van Wesel"
                print(f"DEBUG: Default assignment to Quinten van Wesel for: {filename}")
            
            # Extract all lap time sections from the decoded content
            lap_sections = re.findall(r'Overzicht van je rondetijden.*?\nRonde\s+Tijd\s+Afstand\s*\n(.*?)(?:\nJe laatste|\n\n|$)', decoded, re.DOTALL)
            
            if lap_sections:
                print(f"DEBUG: Found {len(lap_sections)} lap time sections")
                
                # Process each lap section as a separate session for the detected driver
                for section_idx, lap_text in enumerate(lap_sections):
                    lap_lines = [line.strip() for line in lap_text.split('\n') if line.strip()]
                    
                    # Parse lap times from this section
                    session_laps = []
                    for line in lap_lines:
                        if re.match(r'^\d+\s+\d+\.\d+', line):
                            parts = line.split()
                            if len(parts) >= 2:
                                try:
                                    lap_time = float(parts[1])
                                    session_laps.append(lap_time)
                                except ValueError:
                                    # Skip lines with invalid lap time format
                                    continue
                    
                    if session_laps:
                        best_time = min(session_laps)
                        
                        # Assign to the detected driver
                        driver_name = target_driver
                        
                        found_drivers[driver_name] = {
                            'position': 1,  # Always position 1 since it's individual session data
                            'best_time': best_time,
                            'daily_rank': section_idx + 1,
                            'laps': session_laps,
                            'lap_gaps': [0.0] * len(session_laps)  # Initialize gaps
                        }
                        
                        print(f"DEBUG: Assigned session {section_idx + 1} to {driver_name}: {len(session_laps)} laps, best: {best_time:.3f}s")
            
            else:
                # Fallback: look for session overview table
                session_overview_match = re.search(r'Sessie \d+.*?Pos\.\s+Kart\s+Piloot.*?(.*?)Rondetijden', decoded, re.DOTALL)
                if session_overview_match:
                    print("DEBUG: Using fallback Goodwill parsing")
                    
                    # Simple fallback: create one session for Quinten (since most data shows this pattern)
                    found_drivers["Quinten van Wesel"] = {
                        'position': 1,
                        'best_time': 36.0,  # Default fallback time
                        'daily_rank': 1,
                        'laps': [],
                        'lap_gaps': []
                    }
                    print("DEBUG: Created fallback session for Quinten van Wesel")
        
        # Extract detailed lap times (enhanced implementation)
        # Method 1 - De Voltage format: Look for detailed lap table
        if found_drivers and track_name == 'De Voltage':
            # Find the "Detailed results" section with lap-by-lap times (handle \r characters)
            lines = decoded.split('\n')
            detailed_start = -1
            detailed_end = -1
            
            # Find start and end of detailed section
            for i, line in enumerate(lines):
                if 'Detailed results' in line:
                    detailed_start = i + 2  # Skip "Detailed results" and empty line
                elif detailed_start != -1 and ('Avg.' in line or 'Hist.' in line):
                    detailed_end = i
                    break
            
            if detailed_start != -1 and detailed_end != -1:
                # Extract header line with driver names
                header_line = lines[detailed_start].replace('\r', '').strip()
                driver_columns = re.split(r'\s{2,}', header_line)  # Split by 2+ spaces
                
                # Map driver columns to our found drivers
                driver_column_map = {}
                for col_idx, column_name in enumerate(driver_columns):
                    for standard_name, alias_list in driver_aliases.items():
                        if standard_name in found_drivers and any(alias.lower() in column_name.lower() for alias in alias_list):
                            driver_column_map[col_idx] = standard_name
                            found_drivers[standard_name]['laps'] = []
                            found_drivers[standard_name]['lap_gaps'] = []  # Initialize gap storage
                            break
                
                print(f"DEBUG: De Voltage driver columns: {driver_columns}")
                print(f"DEBUG: Driver column mapping: {driver_column_map}")
                
                # Parse lap times for each row (skip header, process lap data)
                for line_idx in range(detailed_start + 1, detailed_end):
                    line = lines[line_idx].replace('\r', '').strip()
                    if line and re.match(r'^\d+\s+', line):  # Lines starting with lap number
                        parts = re.split(r'\s+', line)
                        if len(parts) > 1:
                            try:
                                lap_num = int(parts[0])
                                for col_idx, standard_name in driver_column_map.items():
                                    if col_idx + 1 < len(parts):  # +1 because we skip lap number column
                                        time_str = parts[col_idx + 1].strip()
                                        # Skip times with minutes (1:XX.XXX) or empty values
                                        if time_str and ':' not in time_str and time_str != '':
                                            try:
                                                lap_time = float(time_str)
                                                found_drivers[standard_name]['laps'].append(lap_time)
                                                found_drivers[standard_name]['lap_gaps'].append('')  # No gap data for De Voltage format
                                                print(f"DEBUG: Added lap {lap_num} time {lap_time} for {standard_name}")
                                            except ValueError:
                                                print(f"DEBUG: Could not parse time '{time_str}' for {standard_name}")
                            except ValueError:
                                print(f"DEBUG: Could not parse lap number from line: {line}")
                
                # Show summary of laps found
                for standard_name in driver_column_map.values():
                    lap_count = len(found_drivers[standard_name].get('laps', []))
                    print(f"DEBUG: Found {lap_count} individual laps for {standard_name}")
            else:
                print("DEBUG: Could not find detailed results section boundaries")
        
        # Method 2 - Goodwill format: Look for individual lap times section with gaps
        elif found_drivers and track_name == 'Goodwill Karting':
            # Find "Overzicht van je rondetijden" section with detailed lap data
            # Pattern: Look for the individual lap times table
            lap_section_match = re.search(r'Overzicht van je rondetijden.*?\nRonde\s+Tijd\s+Afstand\s*\n(.*?)(?:\nJe laatste|$)', decoded, re.DOTALL)
            if lap_section_match:
                lap_text = lap_section_match.group(1)
                lap_lines = lap_text.split('\n')
                
                # Find the driver with detailed lap data (should be our target driver)
                for driver_name, driver_data in found_drivers.items():
                    driver_data['laps'] = []
                    driver_data['lap_gaps'] = []  # Store gap data
                    
                    # Parse each lap line for this driver
                    for line in lap_lines:
                        line = line.strip()
                        if line and re.match(r'^\d+\s+\d+\.\d+', line):
                            # Parse pattern: lap_number time [gap]
                            parts = line.split()
                            if len(parts) >= 2:
                                try:
                                    lap_num = int(parts[0])
                                    lap_time = float(parts[1])
                                    gap = float(parts[2]) if len(parts) >= 3 else 0.0
                                    
                                    driver_data['laps'].append(lap_time)
                                    driver_data['lap_gaps'].append(gap)
                                    print(f"DEBUG: Added lap {lap_num} time {lap_time}s gap {gap}s for {driver_name}")
                                except (ValueError, IndexError):
                                    # Skip lines with invalid format
                                    continue
                    
                    print(f"DEBUG: Found {len(driver_data['laps'])} laps with gaps for {driver_name}")
                    break  # Only process one driver's detailed data per session
        
        # Method 3 - Circuit Park Berghem: Similar to De Voltage but handle MM:SS.sss time format
        elif found_drivers and track_name == 'Circuit Park Berghem':
            # Find the "Jouw Rondetijden" section with lap-by-lap times
            lines = decoded.split('\n')
            detailed_start = -1
            detailed_end = -1
            
            # Find start and end of detailed section
            for i, line in enumerate(lines):
                if 'Jouw Rondetijden' in line:
                    detailed_start = i + 1  # Skip "Jouw Rondetijden" line
                elif detailed_start != -1 and ('Avg.' in line or 'Hist.' in line):
                    detailed_end = i
                    break
            
            if detailed_start != -1 and detailed_end != -1:
                # Extract header line with driver names
                header_line = lines[detailed_start].replace('\r', '').strip()
                driver_columns = re.split(r'\s{2,}', header_line)  # Split by 2+ spaces
                
                # Map driver columns to our found drivers
                driver_column_map = {}
                for col_idx, column_name in enumerate(driver_columns):
                    for standard_name, alias_list in driver_aliases.items():
                        if standard_name in found_drivers and any(alias.lower() in column_name.lower() for alias in alias_list):
                            driver_column_map[col_idx] = standard_name
                            found_drivers[standard_name]['laps'] = []
                            found_drivers[standard_name]['lap_gaps'] = []  # Initialize gap storage
                            break
                
                print(f"DEBUG: Circuit Park Berghem driver columns: {driver_columns}")
                print(f"DEBUG: Driver column mapping: {driver_column_map}")
                
                # Parse lap times for each row (skip header, process lap data)
                for line_idx in range(detailed_start + 1, detailed_end):
                    line = lines[line_idx].replace('\r', '').strip()
                    if line and re.match(r'^\d+\s+', line):  # Lines starting with lap number
                        parts = re.split(r'\s+', line)
                        if len(parts) > 1:
                            try:
                                lap_num = int(parts[0])
                                for col_idx, standard_name in driver_column_map.items():
                                    if col_idx + 1 < len(parts):  # +1 because we skip lap number column
                                        time_str = parts[col_idx + 1].strip()
                                        # Parse MM:SS.sss format for Circuit Park Berghem
                                        if time_str and time_str != '':
                                            try:
                                                if ':' in time_str:  # MM:SS.sss format
                                                    time_parts = time_str.split(':')
                                                    minutes = int(time_parts[0])
                                                    seconds = float(time_parts[1])
                                                    lap_time = minutes * 60 + seconds
                                                    found_drivers[standard_name]['laps'].append(lap_time)
                                                    found_drivers[standard_name]['lap_gaps'].append('')  # No gap data for CPB format
                                                    print(f"DEBUG: Added lap {lap_num} time {lap_time}s for {standard_name} (converted from {time_str})")
                                                else:  # SS.sss format fallback
                                                    lap_time = float(time_str)
                                                    found_drivers[standard_name]['laps'].append(lap_time)
                                                    found_drivers[standard_name]['lap_gaps'].append('')  # No gap data
                                                    print(f"DEBUG: Added lap {lap_num} time {lap_time}s for {standard_name}")
                                            except ValueError:
                                                print(f"DEBUG: Could not parse time '{time_str}' for {standard_name}")
                            except ValueError:
                                print(f"DEBUG: Could not parse lap number from line: {line}")
                
                # Show summary of laps found
                for standard_name in driver_column_map.values():
                    lap_count = len(found_drivers[standard_name].get('laps', []))
                    print(f"DEBUG: Found {lap_count} individual laps for {standard_name}")
            else:
                print("DEBUG: Could not find Jouw Rondetijden section boundaries")

        return {
            'track': track_name,
            'session': session_num,
            'session_type': 'Practice',  # Default for Goodwill
            'date': session_date,
            'time': session_time,
            'drivers': found_drivers,
            'filename': os.path.basename(file_path)
        }
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None

def get_next_row_id(csv_file):
    """Get the next available RowID from the CSV file"""
    try:
        with open(csv_file, 'r', newline='', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)  # Skip header
            max_id = 0
            for row in reader:
                if row and row[0].isdigit():
                    max_id = max(max_id, int(row[0]))
            return max_id + 1
    except (FileNotFoundError, ValueError):
        return 1

def check_duplicate_session(session_data, csv_file, track_name):
    """Check if a session already exists in the CSV file"""
    try:
        with open(csv_file, 'r', newline='', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)  # Skip header
            
            for row in reader:
                if len(row) >= 19:  # Ensure row has enough columns
                    # Check: Date, Track, Driver, Session, Position, Time
                    existing_date = row[1]
                    existing_track = row[3]
                    existing_driver = row[7]
                    existing_notes = row[18]
                    existing_position = row[12]
                    existing_time = row[11]
                    
                    for driver_name, driver_info in session_data['drivers'].items():
                        session_notes = f"Session: Karten Sessie {session_data['session']}"
                        
                        # Check if this exact combination exists
                        if (existing_date == session_data['date'] and
                            existing_track == track_name and
                            existing_driver == driver_name and
                            existing_notes == session_notes and
                            existing_position == str(driver_info['position']) and
                            abs(float(existing_time) - driver_info['best_time']) < 0.001):  # Small tolerance for float comparison
                            return True
                            
    except (FileNotFoundError, ValueError, IndexError):
        # File doesn't exist or has invalid format - not a duplicate
        return False
    
    return False

def get_heat_number(session_data, track_name, date, existing_csv_file):
    """Determine heat number based on session data, track, and date
    Heat = sequential race number within the same day/session"""
    try:
        # Count existing heats for this track and date
        existing_heats = set()
        
        try:
            with open(existing_csv_file, 'r', newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if (row.get('Track') == track_name and 
                        row.get('Date') == date and 
                        row.get('Heat')):
                        existing_heats.add(int(row['Heat']))
        except (FileNotFoundError, KeyError, ValueError):
            # If file doesn't exist or has issues, existing_heats remains empty
            existing_heats = set()
        
        # Get the next heat number for this day
        if existing_heats:
            next_heat = max(existing_heats) + 1
        else:
            next_heat = 1
            
        # For lot66 files with different timestamps, treat each file as a separate heat
        if track_name.lower() == 'lot66':
            # Extract timestamp/session info if available
            session_str = str(session_data.get('session', ''))
            time_str = session_data.get('time', '')
            
            # Use a combination of existing logic and timestamp to determine heat
            if session_str and time_str:
                # Check if this exact session already exists
                try:
                    with open(existing_csv_file, 'r', newline='', encoding='utf-8') as f:
                        reader = csv.DictReader(f)
                        for row in reader:
                            if (row.get('Track') == track_name and 
                                row.get('Date') == date and 
                                row.get('Time') == time_str):
                                # This session already exists, return its heat number
                                return int(row.get('Heat', 1))
                except (FileNotFoundError, KeyError, ValueError):
                    # File doesn't exist or has issues - use previously calculated next_heat
                    print(f"DEBUG: Could not read existing sessions for lot66, using heat {next_heat}")
        
        return next_heat
        
    except (ValueError, TypeError):
        return 1

def get_weather_data(track_name, date_str, time_str, session_data=None):
    """Get weather data for a specific track, date and time"""
    try:
        track_config = TRACK_CONFIGS.get(track_name, {})
        if track_config.get('indoor', True):
            return 'Indoor'  # Indoor tracks don't need weather
        
        # For outdoor tracks, first try lap time analysis for rain detection
        if session_data and 'drivers' in session_data:
            rain_indicators = 0
            total_times = 0
            
            for driver_name, driver_data in session_data['drivers'].items():
                if 'laps' in driver_data:
                    lap_times = driver_data['laps']
                    if lap_times:
                        avg_time = sum(lap_times) / len(lap_times)
                        max_time = max(lap_times)
                        
                        # Rain indicators for Circuit Park Berghem (typical dry times ~60-65s)
                        if track_name == 'Circuit Park Berghem':
                            if avg_time > 70 or max_time > 80:
                                rain_indicators += 1
                        
                        total_times += 1
            
            # If majority of drivers show rain indicators, it was raining
            if total_times > 0 and rain_indicators / total_times > 0.5:
                return 'Rainy'
        
        # Get real weather data from OpenWeatherMap API
        city = track_config.get('city', '')
        country = track_config.get('country', '')
        
        if city and country:
            # Get API key from config
            api_key = CONFIG['openweather_api_key']
            
            if api_key:
                try:
                    # For historical weather, we'll use a simpler approach
                    # Current weather API call (historical data requires paid plan)
                    # Use params instead of URL string to avoid exposing API key in logs
                    base_url = "http://api.openweathermap.org/data/2.5/weather"
                    params = {
                        'q': f"{city},{country}",
                        'appid': api_key,
                        'units': 'metric'
                    }
                    response = requests.get(base_url, params=params, timeout=10, headers={'User-Agent': 'KartingApp/1.0'})
                    
                    if response.status_code == 200:
                        weather_data = response.json()
                        weather_desc = weather_data['weather'][0]['description']
                        temp = weather_data['main']['temp']
                        
                        # Log weather result without exposing API key
                        print(f"Weather for {city}: {weather_desc} ({temp}°C)")
                        
                        # Map weather conditions to our categories
                        if 'rain' in weather_desc.lower() or 'drizzle' in weather_desc.lower():
                            return 'Rainy'
                        elif 'cloud' in weather_desc.lower():
                            return 'Cloudy'
                        elif 'clear' in weather_desc.lower() or 'sun' in weather_desc.lower():
                            return 'Sunny'
                        elif 'snow' in weather_desc.lower():
                            return 'Snowy'
                        elif 'mist' in weather_desc.lower() or 'fog' in weather_desc.lower():
                            return 'Foggy'
                        else:
                            return weather_desc.title()
                    else:
                        print(f"Weather API error: HTTP {response.status_code}")
                        
                except requests.RequestException:
                    # Don't log exception details as they may contain sensitive URL params
                    print(f"Weather API request failed for {city}")
                except Exception:
                    # Don't log exception details to avoid potential sensitive data exposure
                    print(f"Weather API error for {city}")
        
        # Fallback to seasonal weather if API fails or no API key
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            month = date_obj.month
            
            # Seasonal weather for Netherlands/Belgium
            if month in [12, 1, 2]:  # Winter
                return 'Cloudy'
            elif month in [3, 4, 5]:  # Spring
                return 'Partly Cloudy'
            elif month in [6, 7, 8]:  # Summer
                return 'Sunny'
            else:  # Fall
                return 'Overcast'
        except Exception:
            return 'Mild'
            
    except Exception as e:
        print(f"Warning: Could not get weather data: {e}")
        return 'Unknown'

def add_session_to_csv(session_data, csv_file, track_name, source='SMS Timing'):
    """Add session data to the CSV file with individual lap times (skip if duplicate)"""
    if not session_data['drivers']:
        return 0
    
    # Check for duplicates first
    if check_duplicate_session(session_data, csv_file, track_name):
        print(f"  Skipping duplicate session {session_data['session']} for {track_name}")
        return 0
    
    next_row_id = get_next_row_id(csv_file)
    rows_added = 0
    track_id = TRACK_IDS.get(track_name, TRACK_IDS['default'])
    track_config = TRACK_CONFIGS.get(track_name, TRACK_CONFIGS.get('Default Track', {}))
    
    # Get track environment and heat number
    indoor_outdoor = 'Indoor' if track_config.get('indoor', True) else 'Outdoor'
    weather = get_weather_data(track_name, session_data['date'], session_data.get('time', ''), session_data)
    heat_number = get_heat_number(session_data, track_name, session_data['date'], csv_file)
    
    # Get track metadata
    track_distance = track_config.get('distance', 400)  # Default 400m
    track_corners = track_config.get('corners', 10)     # Default 10 corners
    
    try:
        with open(csv_file, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            for driver_name, driver_info in session_data['drivers'].items():
                # Check if we have individual lap data
                individual_laps = driver_info.get('laps', [])
                
                if individual_laps:
                    # Create entry for each individual lap
                    lap_gaps = driver_info.get('lap_gaps', [])
                    
                    # Calculate proper gaps for this session
                    best_lap_time = min(individual_laps)
                    sorted_laps = sorted(individual_laps)
                    
                    for lap_num, lap_time in enumerate(individual_laps, 1):
                        is_best_lap = 'Y' if abs(lap_time - best_lap_time) < 0.001 else 'N'
                        
                        # Calculate gap to leader (best lap time in session)
                        gap_to_leader = round(lap_time - best_lap_time, 3) if lap_time != best_lap_time else 0.0
                        
                        # Calculate gap to previous (next fastest lap)
                        gap_to_previous = ''
                        if lap_gaps and lap_num - 1 < len(lap_gaps) and lap_gaps[lap_num - 1]:
                            # Use provided gap data if available (Goodwill format)
                            gap_to_previous = lap_gaps[lap_num - 1]
                        else:
                            # Calculate gap to next fastest lap
                            faster_laps = [t for t in sorted_laps if t < lap_time]
                            if faster_laps:
                                closest_faster = max(faster_laps)
                                gap_to_previous = round(lap_time - closest_faster, 3)
                            else:
                                gap_to_previous = 0.0
                        
                        # Get sector times for this specific lap
                        lap_sectors = ['', '', '']  # Default empty
                        if driver_info.get('lap_sector_times') and lap_num - 1 < len(driver_info['lap_sector_times']):
                            lap_sectors = driver_info['lap_sector_times'][lap_num - 1]
                        elif driver_info.get('sector_times'):
                            # Fallback to best lap sector times if individual lap sectors not available
                            lap_sectors = driver_info['sector_times']
                        
                        # Calculate average speed for this lap
                        avg_speed = calculate_avg_speed(track_distance, lap_time)
                        
                        row_data = [
                            next_row_id,                                    # RowID
                            session_data['date'],                           # Date
                            session_data.get('time', ''),                  # Time
                            'Practice',                                     # SessionType
                            heat_number,                                    # Heat
                            track_name,                                     # Track
                            track_id,                                       # TrackID
                            indoor_outdoor,                                 # InOrOutdoor
                            weather,                                        # Weather
                            source,                                         # Source
                            driver_name,                                    # Driver
                            driver_info['position'],                        # Position
                            lap_num,                                        # LapNumber
                            lap_time,                                       # LapTime (actual lap time in seconds)
                            lap_sectors[0] if lap_sectors[0] else '',       # Sector1
                            lap_sectors[1] if lap_sectors[1] else '',       # Sector2
                            lap_sectors[2] if lap_sectors[2] else '',       # Sector3
                            is_best_lap,                                    # BestLap
                            gap_to_leader,                                  # GapToBestLap
                            '',                                             # Interval (empty for now)
                            gap_to_previous,                                # GapToPrevious
                            driver_info.get('daily_rank', ''),             # BestOfDay
                            '',                                             # BestofWeek
                            '',                                             # BestofMonth
                            driver_info.get('kart', ''),                   # Kart
                            '',                                             # Tyre
                            '',                                             # CostPerLap (will be filled by pricing script)
                            '',                                             # HeatPrice (will be filled by pricing script)
                            session_data['date'],                           # SessionDate (day identifier)
                            track_distance,                                 # TrackDistance (meters)
                            track_corners,                                  # Corners (count)
                            avg_speed,                                      # AvgSpeed (km/h)
                            f"Session: {session_data['session']} - Lap {lap_num}" # Notes
                        ]
                        
                        writer.writerow(row_data)
                        next_row_id += 1
                        rows_added += 1
                else:
                    # Fallback: Create single entry with best lap time
                    # Calculate average speed for best lap
                    avg_speed = calculate_avg_speed(track_distance, driver_info['best_time'])
                    
                    row_data = [
                        next_row_id,                                    # RowID
                        session_data['date'],                           # Date
                        session_data.get('time', ''),                  # Time
                        'Practice',                                     # SessionType
                        heat_number,                                    # Heat
                        track_name,                                     # Track
                        track_id,                                       # TrackID
                        indoor_outdoor,                                 # InOrOutdoor
                        weather,                                        # Weather
                        source,                                         # Source
                        driver_name,                                    # Driver
                        driver_info['position'],                        # Position
                        1,                                              # LapNumber (single entry)
                        driver_info['best_time'],                       # LapTime
                        driver_info.get('sector_times', [None, None, None])[0] if driver_info.get('sector_times') else '', # Sector1
                        driver_info.get('sector_times', [None, None, None])[1] if driver_info.get('sector_times') else '', # Sector2
                        driver_info.get('sector_times', [None, None, None])[2] if driver_info.get('sector_times') else '', # Sector3
                        'Y',                                            # BestLap
                        0.0,                                            # GapToBestLap (best lap = 0 gap)
                        '',                                             # Interval (empty for now)
                        0.0,                                            # GapToPrevious
                        driver_info.get('daily_rank', ''),             # BestOfDay
                        '',                                             # BestofWeek
                        '',                                             # BestofMonth
                        driver_info.get('kart', ''),                   # Kart
                        '',                                             # Tyre
                        '',                                             # CostPerLap (will be filled by pricing script)
                        '',                                             # HeatPrice (will be filled by pricing script)
                        session_data['date'],                           # SessionDate (day identifier)
                        track_distance,                                 # TrackDistance (meters)
                        track_corners,                                  # Corners (count)
                        avg_speed,                                      # AvgSpeed (km/h)
                        f"Session: {session_data['session']}"          # Notes
                    ]
                    
                    writer.writerow(row_data)
                    next_row_id += 1
                    rows_added += 1
                
    except Exception as e:
        print(f"Error writing to CSV: {e}")
        return 0
    
    return rows_added

def process_all_sessions():
    """Main function to process all EML files from all track folders"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_file_path = os.path.join(script_dir, CSV_FILE)
    
    # Clear/reset the CSV file each run
    print("Clearing CSV file and starting fresh...")
    with open(csv_file_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        # Write header row with better organization (30-column format with SessionDate, pricing, and track metadata)
        writer.writerow([
            'RowID', 'Date', 'Time', 'SessionType', 'Heat', 'Track', 'TrackID', 'InOrOutdoor', 'Weather', 'Source',
            'Driver', 'Position', 'LapNumber', 'LapTime', 'Sector1', 'Sector2', 'Sector3', 'BestLap', 'GapToBestLap', 'Interval', 'GapToPrevious',
            'BestOfDay', 'BestofWeek', 'BestofMonth', 'Kart', 'Tyre', 'CostPerLap', 'HeatPrice', 'SessionDate', 'TrackDistance', 'Corners', 'AvgSpeed', 'Notes'
        ])
    print("CSV cleared and header written.")
    print()
    
    if not os.path.exists(csv_file_path):
        print(f"Error: CSV file '{CSV_FILE}' not found!")
        print(f"Please ensure the file exists at: {csv_file_path}")
        return
    
    # Find all folders that could be tracks
    track_folders = []
    for item in os.listdir(script_dir):
        item_path = os.path.join(script_dir, item)
        if os.path.isdir(item_path) and item != '__pycache__':
            # Check if folder contains EML files (all tracks including Experience Factory)
            eml_files = [f for f in os.listdir(item_path) if f.endswith('.eml')]
            
            if eml_files:
                track_folders.append({
                    'name': item,
                    'path': item_path,
                    'eml_count': len(eml_files),
                    'heat_count': 0,
                    'type': 'eml'
                })
    
    if not track_folders:
        print("No track folders with EML or heat files found!")
        print("Please ensure you have folders containing .eml or heat files in the script directory.")
        return
    
    print(f"Found {len(track_folders)} track folders:")
    for track in track_folders:
        if track['type'] == 'experience_factory':
            print(f"  - {track['name']}: {track['heat_count']} heat files")
        else:
            print(f"  - {track['name']}: {track['eml_count']} EML files")
    print()
    
    total_sessions = 0
    total_drivers = 0
    all_sessions_processed = []
    
    # Process each track folder
    for track in track_folders:
        track_name = track['name']
        track_path = track['path']
        
        print(f"Processing track: {track_name}")
        print("-" * 40)
        
        track_sessions = []
        
        # Process EML files (including Experience Factory)
        eml_files = [f for f in os.listdir(track_path) if f.endswith('.eml')]
        
        for eml_file in sorted(eml_files):
            file_path = os.path.join(track_path, eml_file)
            session_data = extract_session_data(file_path, track_name)
            
            if session_data and session_data['drivers']:
                print(f"Session {session_data['session']} ({session_data['date']}):")
                
                for driver_name, driver_info in session_data['drivers'].items():
                    print(f"  - {driver_name}: P{driver_info['position']} - {driver_info['best_time']:.3f}s")
                
                # Add to CSV with correct source
                rows_added = add_session_to_csv(session_data, csv_file_path, track_name, 'SMS Timing')
                total_drivers += rows_added
                
                track_sessions.append(session_data)
                total_sessions += 1
                print()
            else:
                print(f"No target drivers found in {eml_file}")
        
        all_sessions_processed.extend(track_sessions)
        print(f"Track {track_name}: {len(track_sessions)} sessions processed\n")
    
    print()
    
    print("=" * 50)
    print("SUMMARY:")
    print(f"Tracks processed: {len(track_folders)}")
    print(f"Total sessions: {total_sessions}")
    print(f"Total driver entries: {total_drivers}")
    
    # Create a better summary by track
    track_summary = {}
    
    # Group all processed sessions by track
    for session in all_sessions_processed:
        track_name = session.get('track', 'Unknown')
        session_id = session.get('session', 'Unknown')
        
        # Skip apex timing sessions for now, handle separately
        if session.get('source', '').startswith('apex_timing'):
            continue
            
        if track_name not in track_summary:
            track_summary[track_name] = []
        
        if session_id not in track_summary[track_name]:
            track_summary[track_name].append(session_id)
    
    # Print summary for each track folder
    for track_name, session_list in track_summary.items():
        if session_list:
            # Sort sessions for better display
            try:
                # Try to sort numerically if possible
                sorted_sessions = sorted(session_list, key=lambda x: int(x) if str(x).isdigit() else float('inf'))
            except (ValueError, TypeError):
                # Fall back to string sorting
                sorted_sessions = sorted(session_list)
            print(f"  - {track_name}: Sessions {', '.join(map(str, sorted_sessions))}")
    
    print()
    print("To add this data to your CSV, uncomment the lines in the script")
    print("that add data to the CSV file (look for the comment about uncommenting).")

def apply_pricing_to_csv():
    """Apply distributed pricing to the generated CSV file"""
    import pandas as pd
    from collections import defaultdict
    
    try:
        # Read the CSV
        df = pd.read_csv(CSV_FILE)
        print(f"\nApplying distributed pricing to {len(df)} records...")
        
        # Group sessions by track and date to identify unique days
        daily_sessions = defaultdict(lambda: defaultdict(set))
        
        for _, row in df.iterrows():
            track = row['Track']
            date = row['Date']
            heat = row['Heat']
            daily_sessions[track][date].add(heat)
        
        # Calculate pricing for each record
        driver_lap_counts = {}  # Track total laps per driver per day per track
        
        # First pass: count laps per driver per day per track
        for _, row in df.iterrows():
            key = (row['Track'], row['Date'], row['Driver'])
            if key not in driver_lap_counts:
                driver_lap_counts[key] = 0
            driver_lap_counts[key] += 1
        
        # Second pass: apply pricing
        for idx, row in df.iterrows():
            track = row['Track']
            date = row['Date']
            driver = row['Driver']
            
            # Get number of heats on this day at this track
            heats_on_day = len(daily_sessions[track][date])
            
            # Get total price for this many heats (distributed per heat)
            heat_price = get_heat_price(track, heats_on_day)
            distributed_heat_price = heat_price / heats_on_day if heats_on_day > 0 else heat_price
            
            # Get driver's total laps for this track/date
            driver_key = (track, date, driver)
            driver_total_laps = driver_lap_counts.get(driver_key, 1)
            
            # Calculate cost per lap: distributed heat price ÷ driver's total laps
            cost_per_lap = distributed_heat_price / driver_total_laps
            
            # Update the dataframe
            df.at[idx, 'CostPerLap'] = round(cost_per_lap, 2)
            df.at[idx, 'HeatPrice'] = round(distributed_heat_price, 2)
        
        # Save back to CSV
        df.to_csv(CSV_FILE, index=False)
        print(f"✓ Pricing applied successfully! Updated {len(df)} records.")
        
        # Print summary
        unique_tracks = df['Track'].unique()
        for track in unique_tracks:
            track_data = df[df['Track'] == track]
            print(f"  - {track}: {len(track_data)} records")
            
    except Exception as e:
        print(f"Error applying pricing: {e}")

if __name__ == "__main__":
    print("Multi-Track Karting Session Data Processor")
    print("=" * 50)
    print(f"Target drivers: {', '.join(DEFAULT_DRIVERS)}")
    print("Looking for track folders containing EML files...")
    print(f"CSV file: {CSV_FILE}")
    print()
    
    process_all_sessions()
    apply_pricing_to_csv()
    
    print("\nDone! Press Enter to exit...")
    input()