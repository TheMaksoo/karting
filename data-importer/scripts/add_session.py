"""
Add Session Script
Interactive tool to add karting sessions from files (EML, PDF, TXT) to Karten.csv
"""

import sys
import pandas as pd
from pathlib import Path
from session_parser import SessionParser


class SessionManager:
    """Manage adding sessions to the karting database"""
    
    def __init__(self, csv_path: str = "Karten.csv", tracks_db: str = "tracks.json"):
        self.csv_path = csv_path
        self.tracks_db = tracks_db
        self.parser = SessionParser(tracks_db)
        self.df = self._load_csv()
    
    def _load_csv(self) -> pd.DataFrame:
        """Load the existing CSV file"""
        try:
            return pd.read_csv(self.csv_path)
        except FileNotFoundError:
            print(f"Warning: {self.csv_path} not found. Creating new file.")
            return pd.DataFrame()
    
    def get_next_row_id(self) -> int:
        """Get the next available RowID"""
        if self.df.empty:
            return 1
        return int(self.df['RowID'].max()) + 1
    
    def add_session_from_file(self, file_path: str, dry_run: bool = False) -> bool:
        """
        Add a session from a file to the CSV
        
        Args:
            file_path: Path to the session file
            dry_run: If True, just show what would be added without saving
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Parse the file
            print(f"\n📄 Parsing file: {file_path}")
            session_data = self.parser.parse_file(file_path)
            
            if not session_data:
                print("❌ Failed to parse file or no data found")
                return False
            
            # Display session info
            self._display_session_info(session_data)
            
            # Convert to CSV format
            starting_row_id = self.get_next_row_id()
            csv_rows = self.parser.format_for_csv(session_data, starting_row_id)
            
            if not csv_rows:
                print("❌ No lap data to add")
                return False
            
            print(f"\n✅ Ready to add {len(csv_rows)} laps")
            
            if dry_run:
                print("\n🔍 DRY RUN - Preview of first 3 laps:")
                for i, row in enumerate(csv_rows[:3]):
                    print(f"  Lap {row['LapNumber']}: {row['LapTime']:.3f}s @ {row['Track']}")
                print(f"  ... and {len(csv_rows) - 3} more laps")
                return True
            
            # Confirm before adding
            if not self._confirm_addition(csv_rows):
                print("❌ Addition cancelled")
                return False
            
            # Add to DataFrame
            new_df = pd.DataFrame(csv_rows)
            self.df = pd.concat([self.df, new_df], ignore_index=True)
            
            # Save to CSV
            self.df.to_csv(self.csv_path, index=False)
            print(f"✅ Successfully added {len(csv_rows)} laps to {self.csv_path}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error adding session: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def add_multiple_sessions(self, file_paths: list, dry_run: bool = False):
        """Add multiple sessions from a list of files"""
        success_count = 0
        fail_count = 0
        
        for file_path in file_paths:
            if self.add_session_from_file(file_path, dry_run):
                success_count += 1
            else:
                fail_count += 1
        
        print(f"\n📊 Summary: {success_count} sessions added, {fail_count} failed")
    
    def _display_session_info(self, session_data: dict):
        """Display session information before adding"""
        print("\n" + "=" * 60)
        print("📋 SESSION INFORMATION")
        print("=" * 60)
        print(f"🏁 Track:        {session_data.get('track', 'Unknown')}")
        print(f"👤 Driver:       {session_data.get('driver', 'Unknown')}")
        print(f"📅 Date:         {session_data.get('date', 'Unknown')}")
        print(f"🕐 Time:         {session_data.get('time', 'Unknown')}")
        
        if 'kart' in session_data:
            print(f"🏎️  Kart:        {session_data['kart']}")
        
        if 'session_number' in session_data:
            print(f"#️⃣  Session:     {session_data['session_number']}")
        
        laps = session_data.get('laps', [])
        if laps:
            print(f"🔄 Total Laps:   {len(laps)}")
            best_lap = session_data.get('best_lap_time', 'N/A')
            print(f"⚡ Best Lap:     {best_lap}")
        
        print("=" * 60)
    
    def _confirm_addition(self, csv_rows: list) -> bool:
        """Ask user to confirm before adding to CSV"""
        response = input("\n❓ Add this session to the CSV? (yes/no): ").strip().lower()
        return response in ['yes', 'y']
    
    def search_sessions(self, driver: str = None, track: str = None, date: str = None):
        """Search for existing sessions in the CSV"""
        result = self.df.copy()
        
        if driver:
            result = result[result['Driver'].str.contains(driver, case=False, na=False)]
        
        if track:
            result = result[result['Track'].str.contains(track, case=False, na=False)]
        
        if date:
            result = result[result['Date'] == date]
        
        # Group by session (Date + Time + Track + Driver)
        sessions = result.groupby(['Date', 'Time', 'Track', 'Driver']).agg({
            'LapNumber': 'count',
            'LapTime': 'min',
            'Heat': 'first'
        }).reset_index()
        
        sessions.columns = ['Date', 'Time', 'Track', 'Driver', 'Laps', 'Best Lap', 'Heat']
        
        return sessions


def interactive_mode():
    """Interactive mode for adding sessions"""
    print("=" * 60)
    print("🏎️  KARTING SESSION MANAGER")
    print("=" * 60)
    print()
    
    manager = SessionManager()
    
    print("Options:")
    print("  1. Add single session from file")
    print("  2. Add all new sessions in a folder")
    print("  3. Search existing sessions")
    print("  4. Exit")
    print()
    
    choice = input("Select option (1-4): ").strip()
    
    if choice == '1':
        file_path = input("\nEnter file path: ").strip().strip('"')
        dry_run = input("Preview only? (yes/no): ").strip().lower() in ['yes', 'y']
        manager.add_session_from_file(file_path, dry_run=dry_run)
    
    elif choice == '2':
        folder = input("\nEnter folder path: ").strip().strip('"')
        folder_path = Path(folder)
        
        if not folder_path.exists():
            print(f"❌ Folder not found: {folder}")
            return
        
        # Find all .eml, .pdf, and text files
        files = list(folder_path.glob("*.eml")) + list(folder_path.glob("*.pdf"))
        
        # Also check for files without extension
        for item in folder_path.iterdir():
            if item.is_file() and not item.suffix:
                files.append(item)
        
        if not files:
            print(f"❌ No session files found in {folder}")
            return
        
        print(f"\nFound {len(files)} files:")
        for f in files:
            print(f"  - {f.name}")
        
        dry_run = input("\nPreview only? (yes/no): ").strip().lower() in ['yes', 'y']
        manager.add_multiple_sessions([str(f) for f in files], dry_run=dry_run)
    
    elif choice == '3':
        driver = input("\nDriver name (or blank): ").strip() or None
        track = input("Track name (or blank): ").strip() or None
        date = input("Date YYYY-MM-DD (or blank): ").strip() or None
        
        results = manager.search_sessions(driver, track, date)
        
        if results.empty:
            print("\n❌ No sessions found")
        else:
            print(f"\n✅ Found {len(results)} sessions:")
            print(results.to_string(index=False))
    
    elif choice == '4':
        print("👋 Goodbye!")
        return
    
    else:
        print("❌ Invalid option")


def batch_mode(file_paths: list, dry_run: bool = False):
    """Batch mode for adding multiple sessions"""
    manager = SessionManager()
    manager.add_multiple_sessions(file_paths, dry_run=dry_run)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Batch mode
        files = sys.argv[1:]
        dry_run = '--dry-run' in files
        if dry_run:
            files.remove('--dry-run')
        
        batch_mode(files, dry_run=dry_run)
    else:
        # Interactive mode
        interactive_mode()
