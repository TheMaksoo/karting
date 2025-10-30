#!/usr/bin/env python3

import sys
sys.path.append('.')
from process_karting_sessions import extract_experience_factory_html_data

# Test Experience Factory processing
with open('Experience Factory Antwerp/Experience Factory Antwerp.eml', 'r', encoding='utf-8') as f:
    content = f.read()

result = extract_experience_factory_html_data(content, 'test.eml', 'Experience Factory Antwerp')
if result:
    print('Session:', result['session'])
    print('Date:', result['date'])
    for driver, data in result['drivers'].items():
        print(f'{driver}: {len(data["laps"])} laps, best: {data["best_time"]:.3f}s')
        if data.get('lap_sector_times'):
            print(f'  First few lap sectors: {data["lap_sector_times"][:3]}')
        if data.get('laps'):
            print(f'  First few lap times: {data["laps"][:3]}')
else:
    print('No result')