import re
import os

def remove_console_logs(file_path):
    """Remove all console.log/warn/error/info statements from a JS file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_lines = content.count('\n')
    
    # Split into lines
    lines = content.split('\n')
    filtered_lines = []
    skip_until_semicolon = False
    
    for line in lines:
        # Check if this is a console statement
        if re.search(r'^\s*console\.(log|warn|error|info)\(', line):
            # Check if statement is complete (has closing paren and semicolon)
            if ')' in line:
                continue  # Skip this line
            else:
                skip_until_semicolon = True
                continue
        elif skip_until_semicolon:
            # Keep skipping lines until we find the closing
            if ');' in line or ')' in line:
                skip_until_semicolon = False
            continue
        else:
            filtered_lines.append(line)
    
    new_content = '\n'.join(filtered_lines)
    removed = original_lines - new_content.count('\n')
    
    if removed > 0:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ {file_path}: Removed {removed} console statement lines")
    else:
        print(f"⚪ {file_path}: No console statements found")
    
    return removed

# Process all JS files
js_files = [
    'dashboard/js/core.js',
    'dashboard/js/chart-config.js',
    'dashboard/js/charts-driver.js',
    'dashboard/js/charts-session.js',
    'dashboard/js/charts-track.js',
    'dashboard/js/charts-battles.js',
    'dashboard/js/charts-temporal.js',
    'dashboard/js/charts-financial.js',
    'dashboard/js/charts-predictive.js',
    'dashboard/js/charts-geo.js',
    'dashboard/script.js',
]

total_removed = 0
for file in js_files:
    if os.path.exists(file):
        removed = remove_console_logs(file)
        total_removed += removed

print(f"\n🎯 Total console statement lines removed: {total_removed}")
print("✨ All files cleaned!")
