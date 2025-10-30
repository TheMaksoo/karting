#!/usr/bin/env python3
"""
Run the karting session processing without the server
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from process_karting_sessions import process_all_sessions, apply_pricing_to_csv, DEFAULT_DRIVERS, CSV_FILE

if __name__ == "__main__":
    print("Multi-Track Karting Session Data Processor")
    print("=" * 50)
    print(f"Target drivers: {', '.join(DEFAULT_DRIVERS)}")
    print("Looking for track folders containing EML files...")
    print(f"CSV file: {CSV_FILE}")
    print()
    
    process_all_sessions()
    apply_pricing_to_csv()
    
    print("Processing complete!")