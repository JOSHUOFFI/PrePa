#!/usr/bin/env python3
"""
Generate and apply pedagogically rigorous explanations for Biology questions B11-B160.
"""

import json
import re

# Read questions.js
with open(r'c:\Users\user\Desktop\PrePa\questions.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract Biology section
bio_start = content.find('"Biology": [')
bio_end = content.find('  ],\n  "CRS":', bio_start)
bio_text = content[bio_start:bio_end+5]

# Extract JSON array of questions
arr_start = bio_text.find('[')
arr_end = bio_text.rfind(']')
questions_json = json.loads(bio_text[arr_start:arr_end+1])

print(f"✓ Loaded {len(questions_json)} Biology questions")

# Show summary of B11-B160
b11_160 = [q for q in questions_json if 11 <= int(q['id'][1:]) <= 160]
print(f"✓ Found {len(b11_160)} questions in range B11-B160")
print(f"  First: {b11_160[0]['id']}")
print(f"  Last: {b11_160[-1]['id']}")
