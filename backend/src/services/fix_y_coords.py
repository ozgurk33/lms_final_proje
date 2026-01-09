#!/usr/bin/env python3
"""
Quick Fix - Shift all Y coordinates down by offset
"""
import json

# Load current template
with open('omr_template.json', 'r') as f:
    template = json.load(f)

# Shift all Y coordinates
Y_OFFSET = 60  # Shift down by 60 pixels

for q_num, positions in template.items():
    for pos in positions:
        pos['y'] += Y_OFFSET

# Save
with open('omr_template.json', 'w') as f:
    json.dump(template, f, indent=2)

print(f"✅ Shifted all Y coordinates by +{Y_OFFSET} pixels")
print(f"✅ Updated: omr_template.json")
