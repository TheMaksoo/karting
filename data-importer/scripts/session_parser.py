"""
Session Parser Module
Handles parsing of different file formats (EML, PDF, TXT) containing karting session data
"""

import re
import email
from email.message import Message
from pathlib import Path
from typing import Dict, List
import json


class SessionParser:
    """Parse karting session files from various formats"""
    
    def __init__(self, tracks_db_path: str = "tracks.json"):
        """Initialize the parser with tracks database"""
        self.tracks_db_path = tracks_db_path
        self.tracks = self._load_tracks()
    
    def _load_tracks(self) -> Dict:
        """Load tracks database from JSON file"""
        try:
            with open(self.tracks_db_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {track['name']: track for track in data['tracks']}
        except FileNotFoundError:
            print(f"Warning: Tracks database not found at {self.tracks_db_path}")
            return {}
    
    def parse_file(self, file_path: str) -> Dict:
        """
        Main entry point to parse any supported file type
        Returns a dictionary with session data
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Determine file type and parse accordingly
        if file_path.suffix.lower() == '.eml':
            return self.parse_eml(file_path)
        elif file_path.suffix.lower() == '.pdf':
            return self.parse_pdf(file_path)
        elif file_path.suffix.lower() in ['.txt', '']:
            # Try to auto-detect format from content
            return self.parse_text_file(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_path.suffix}")
    
    def parse_eml(self, file_path: Path) -> Dict:
        """Parse .eml email file containing session data"""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            msg = email.message_from_file(f)
        
        # Get email body
        body = self._get_email_body(msg)
        
        # Determine track from subject or body
        subject = msg.get('Subject', '')
        track_name = self._detect_track_from_text(subject + ' ' + body)
        
        # Parse based on detected track
        if 'Experience Factory' in track_name:
            return self.parse_experience_factory_eml(body, msg)
        elif 'Goodwill' in track_name:
            return self.parse_goodwill_eml(body, msg)
        elif 'Voltage' in track_name:
            return self.parse_voltage_eml(body, msg)
        else:
            # Generic parsing
            return self.parse_generic_email(body, msg)
    
    def parse_text_file(self, file_path: Path) -> Dict:
        """Parse plain text file (like Fastkart or Racing Center)"""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Detect track from content or path
        track_name = self._detect_track_from_text(content + ' ' + str(file_path))
        
        # Parse based on detected track  or content patterns
        if 'Fastkart' in track_name or 'Elche' in str(file_path) or 'Elche' in content:
            return self.parse_fastkart(content, file_path)
        elif 'Gilesias' in track_name or 'gilesias' in str(file_path).lower() or 'gelesias' in content.lower():
            return self.parse_racing_center_gilesias(content, file_path)
        else:
            raise ValueError(f"Could not determine track from file: {file_path}")
    
    def parse_fastkart(self, content: str, file_path: Path) -> Dict:
        """Parse Fastkart Elche session format"""
        session_data = {
            'track': 'Fastkart Elche',
            'track_id': 'TRK-001',
            'source': 'Fastkart Timing',
            'file_path': str(file_path),
            'laps': []
        }
        
        # Extract session info: "Sesión 17 - 2	14 Vueltas"
        session_match = re.search(r'Sesión\s+(\d+)\s*-?\s*(\d*)\s+(\d+)\s+Vueltas', content)
        if session_match:
            session_data['session_number'] = session_match.group(1)
            session_data['heat'] = 1  # Default to 1
        
        # Extract date: "07/11/2025 12:48"
        date_match = re.search(r'(\d{2})/(\d{2})/(\d{4})\s+(\d{2}):(\d{2})', content)
        if date_match:
            day, month, year, hour, minute = date_match.groups()
            session_data['date'] = f"{year}-{month}-{day}"
            session_data['time'] = f"{hour}:{minute}"
        
        # Extract driver name: "TheMaksoo"
        driver_match = re.search(r'Pilotos\s+N\.\s+V\.\s+Mejor V\.\s+en V\.\s+GAP\s+\d+\s+(\w+)', content)
        if driver_match:
            session_data['driver'] = driver_match.group(1)
            if session_data['driver'] == 'TheMaksoo':
                session_data['driver'] = 'Max van Lierop'
        
        # Extract kart number: "TB 29"
        kart_match = re.search(r'([A-Z]+\s+\d+)\s+\d+\s+\d+:\d+\.\d+', content)
        if kart_match:
            session_data['kart'] = kart_match.group(1)
        
        # Extract best lap time
        best_lap_match = re.search(r'Mejor V\.\s+en V\.\s+GAP.*?(\d+:\d+\.\d+)\s+(\d+)', content, re.DOTALL)
        if best_lap_match:
            session_data['best_lap_time'] = best_lap_match.group(1)
            session_data['best_lap_number'] = int(best_lap_match.group(2))
        
        # Extract individual laps
        # Pattern: lap number followed by time (e.g., "1	01:07.478")
        lap_pattern = r'(\d+)\s+(\d+):(\d+)\.(\d+)'
        lap_matches = re.findall(lap_pattern, content)
        
        for lap_num, minutes, seconds, milliseconds in lap_matches:
            lap_time_seconds = float(minutes) * 60 + float(seconds) + float(milliseconds) / 1000
            session_data['laps'].append({
                'lap_number': int(lap_num),
                'lap_time': lap_time_seconds,
                'lap_time_formatted': f"{minutes}:{seconds}.{milliseconds}"
            })
        
        return session_data
    
    def parse_racing_center_gilesias(self, content: str, file_path: Path) -> Dict:
        """Parse Racing Center Gilesias session format"""
        session_data = {
            'track': 'Racing Center Gilesias',
            'track_id': 'TRK-007',
            'source': 'Racing Center Timing',
            'file_path': str(file_path),
            'laps': []
        }
        
        # Extract session info: "Sesión 25"
        session_match = re.search(r'Sesión\s+(\d+)', content)
        if session_match:
            session_data['session_number'] = session_match.group(1)
            session_data['heat'] = 1
        
        # Extract date: "07/11/2025 17:14"
        date_match = re.search(r'(\d{2})/(\d{2})/(\d{4})\s+(\d{2}):(\d{2})', content)
        if date_match:
            day, month, year, hour, minute = date_match.groups()
            session_data['date'] = f"{year}-{month}-{day}"
            session_data['time'] = f"{hour}:{minute}"
        
        # Extract driver - look for TheMaksoo
        if 'TheMaksoo' in content:
            session_data['driver'] = 'Max van Lierop'
        
        # Extract kart number: "kart 72"
        kart_match = re.search(r'kart\s+(\d+)', content, re.IGNORECASE)
        if kart_match:
            session_data['kart'] = kart_match.group(1)
        
        # Extract best lap time and lap number
        best_lap_match = re.search(r'Mejor V\.\s+en V\.\s+GAP[^\d]+\d+[^\d]+(\d+)[^\d]+(\d+):(\d+)\.(\d+)[^\d]+(\d+)', content)
        if best_lap_match:
            _, minutes, seconds, milliseconds, lap_num = best_lap_match.groups()
            session_data['best_lap_time'] = f"{minutes}:{seconds}.{milliseconds}"
            session_data['best_lap_number'] = int(lap_num)
        
        # Extract individual laps from RESULTADOS DETALLADOS section
        # Pattern: line number followed by time
        lap_pattern = r'^(\d+)\s+(\d+):(\d+)\.(\d+)\s*$'
        for line in content.split('\n'):
            match = re.match(lap_pattern, line.strip())
            if match:
                lap_num, minutes, seconds, milliseconds = match.groups()
                lap_time_seconds = float(minutes) * 60 + float(seconds) + float(milliseconds) / 1000
                session_data['laps'].append({
                    'lap_number': int(lap_num),
                    'lap_time': lap_time_seconds,
                    'lap_time_formatted': f"{minutes}:{seconds}.{milliseconds}"
                })
        
        return session_data
    
    def parse_experience_factory_eml(self, body: str, msg: Message) -> Dict:
        """Parse Experience Factory Antwerp email format"""
        session_data = {
            'track': 'Experience Factory Antwerp',
            'track_id': 'TRK-003',
            'source': 'SMS Timing',
            'laps': []
        }
        
        # Experience Factory emails are usually base64 encoded
        # The body would need to be decoded first
        # This is a simplified version
        
        return session_data
    
    def parse_pdf(self, file_path: Path) -> Dict:
        """Parse PDF file containing session data"""
        try:
            import PyPDF2
            
            with open(file_path, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text()
            
            # Detect track from PDF content
            track_name = self._detect_track_from_text(text)
            
            # Parse based on track
            if 'Experience Factory' in track_name:
                return self.parse_experience_factory_pdf(text, file_path)
            else:
                return self.parse_generic_pdf(text, file_path)
        
        except ImportError:
            print("Warning: PyPDF2 not installed. Install with: pip install PyPDF2")
            return {}
    
    def parse_experience_factory_pdf(self, text: str, file_path: Path) -> Dict:
        """Parse Experience Factory PDF format"""
        session_data = {
            'track': 'Experience Factory Antwerp',
            'track_id': 'TRK-003',
            'source': 'Apex Timing',
            'file_path': str(file_path),
            'laps': []
        }
        
        # Extract session info from PDF
        # Pattern varies, needs actual PDF analysis
        
        return session_data
    
    def parse_generic_pdf(self, text: str, file_path: Path) -> Dict:
        """Generic PDF parser"""
        return {
            'track': 'Unknown',
            'source': 'PDF',
            'file_path': str(file_path),
            'content': text
        }
    
    def parse_generic_email(self, body: str, msg: Message) -> Dict:
        """Generic email parser"""
        return {
            'track': 'Unknown',
            'source': 'Email',
            'subject': msg.get('Subject', ''),
            'date': msg.get('Date', ''),
            'content': body
        }
    
    def parse_goodwill_eml(self, body: str, msg: Message) -> Dict:
        """Parse Goodwill Karting email format"""
        # Implementation specific to Goodwill format
        pass
    
    def parse_voltage_eml(self, body: str, msg: Message) -> Dict:
        """Parse De Voltage email format"""
        # Implementation specific to De Voltage format
        pass
    
    def _get_email_body(self, msg: Message) -> str:
        """Extract body from email message"""
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    try:
                        body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    except Exception:
                        body = part.get_payload()
                    break
        else:
            try:
                body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
            except Exception:
                body = msg.get_payload()
        
        return body
    
    def _detect_track_from_text(self, text: str) -> str:
        """Detect track name from text content"""
        text_lower = text.lower()
        
        # Check each known track
        if 'fastkart' in text_lower or 'elche' in text_lower:
            return 'Fastkart Elche'
        elif 'gilesias' in text_lower or 'gelesias' in text_lower:
            return 'Racing Center Gilesias'
        elif 'experience factory' in text_lower or 'antwerp' in text_lower:
            return 'Experience Factory Antwerp'
        elif 'voltage' in text_lower:
            return 'De Voltage'
        elif 'goodwill' in text_lower:
            return 'Goodwill Karting'
        elif 'lot66' in text_lower or 'lot 66' in text_lower:
            return 'Lot66'
        elif 'berghem' in text_lower or 'circuit park' in text_lower:
            return 'Circuit Park Berghem'
        
        return 'Unknown'
    
    def format_for_csv(self, session_data: Dict, starting_row_id: int = 1) -> List[Dict]:
        """
        Convert parsed session data to CSV row format
        Returns a list of dictionaries ready to be appended to Karten.csv
        """
        if 'laps' not in session_data or not session_data['laps']:
            return []
        
        # Get track info
        track_name = session_data.get('track', 'Unknown')
        track_info = self.tracks.get(track_name, {})
        track_id = session_data.get('track_id', 'TRK-999')
        
        specs = track_info.get('specifications', {})
        track_distance = specs.get('distance', '')
        corners = specs.get('corners', '')
        indoor_outdoor = 'Indoor' if specs.get('indoor', True) else 'Outdoor'
        
        # Get session details
        date = session_data.get('date', '')
        time = session_data.get('time', '')
        driver = session_data.get('driver', 'Unknown')
        kart = session_data.get('kart', '')
        heat = session_data.get('heat', 1)
        source = session_data.get('source', 'Manual')
        
        # Find best lap
        laps = session_data['laps']
        best_lap_time = min(lap['lap_time'] for lap in laps)
        
        # Create CSV rows
        csv_rows = []
        row_id = starting_row_id
        
        for lap in laps:
            lap_time = lap['lap_time']
            is_best = 'Y' if lap_time == best_lap_time else 'N'
            gap_to_best = lap_time - best_lap_time
            
            # Calculate average speed (km/h)
            if track_distance and lap_time > 0:
                avg_speed = (track_distance / lap_time) * 3.6  # m/s to km/h
            else:
                avg_speed = ''
            
            row = {
                'RowID': row_id,
                'Date': date,
                'Time': time,
                'SessionType': 'Practice',
                'Heat': heat,
                'Track': track_name,
                'TrackID': track_id,
                'InOrOutdoor': indoor_outdoor,
                'Weather': indoor_outdoor if indoor_outdoor == 'Indoor' else 'Clear',
                'Source': source,
                'Driver': driver,
                'Position': 1,  # Solo driver
                'LapNumber': lap['lap_number'],
                'LapTime': lap_time,
                'Sector1': '',
                'Sector2': '',
                'Sector3': '',
                'BestLap': is_best,
                'GapToBestLap': gap_to_best,
                'Interval': '',
                'GapToPrevious': '',
                'BestOfDay': 1.0,  # Solo driver
                'BestofWeek': '',
                'BestofMonth': '',
                'Kart': kart,
                'Tyre': '',
                'CostPerLap': '',
                'HeatPrice': '',
                'SessionDate': date,
                'TrackDistance': track_distance,
                'Corners': corners,
                'AvgSpeed': round(avg_speed, 2) if avg_speed else '',
                'Notes': f"Session: {session_data.get('session_number', '')} - Lap {lap['lap_number']}"
            }
            
            csv_rows.append(row)
            row_id += 1
        
        return csv_rows


if __name__ == "__main__":
    # Test the parser
    parser = SessionParser()
    
    # Test with a Fastkart file
    try:
        result = parser.parse_file("Elche/Fastkart Elche")
        print("Fastkart Elche parsed successfully:")
        print(f"Track: {result.get('track')}")
        print(f"Driver: {result.get('driver')}")
        print(f"Date: {result.get('date')}")
        print(f"Laps: {len(result.get('laps', []))}")
        if result.get('laps'):
            print(f"Best lap: {result.get('best_lap_time')}")
    except Exception as e:
        print(f"Error parsing Fastkart: {e}")
