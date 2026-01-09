#!/usr/bin/env python3
"""
Fix first 4 rows Y coordinates
"""
import json

with open('omr_template.json', 'r') as f:
    template = json.load(f)

# Additional shift for first 4 rows only
ADDITIONAL_Y_SHIFT = 30

# Questions 1-4, 11-14, 21-24, 31-34, 41-44 (first 4 rows of each column)
first_4_rows = []
for col in range(5):
    for row in range(4):
        q_num = str((col * 10) + row + 1)
        first_4_rows.append(q_num)

for q_num in first_4_rows:
    if q_num in template:
        for pos in template[q_num]:
            pos['y'] += ADDITIONAL_Y_SHIFT

with open('omr_template.json', 'w') as f:
    json.dump(template, f, indent=2)

print(f"✅ Shifted first 4 rows by additional +{ADDITIONAL_Y_SHIFT} pixels")
print(f"✅ Affected questions: {', '.join(first_4_rows[:10])}... (20 total)")
