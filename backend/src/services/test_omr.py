#!/usr/bin/env python3
"""
OMR Detector Test Script
Tests the OMR detection algorithm with sample images
"""

import sys
import os
import json

# Add parent directory to path
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

from omr_detector import process_omr

def print_colored(text, color='white'):
    """Print colored text to console"""
    colors = {
        'red': '\033[91m',
        'green': '\033[92m',
        'yellow': '\033[93m',
        'blue': '\033[94m',
        'magenta': '\033[95m',
        'cyan': '\033[96m',
        'white': '\033[97m',
        'reset': '\033[0m'
    }
    print(f"{colors.get(color, colors['white'])}{text}{colors['reset']}")

def test_omr(image_path):
    """Test OMR processing on a single image"""
    print_colored("\n" + "="*60, 'cyan')
    print_colored(f"Testing OMR Detection: {os.path.basename(image_path)}", 'cyan')
    print_colored("="*60, 'cyan')
    
    if not os.path.exists(image_path):
        print_colored(f"ERROR: Image not found: {image_path}", 'red')
        return False
    
    # Process the image
    result = process_omr(image_path)
    
    # Check status
    if result.get('status') != 'success':
        print_colored("\nERROR: Processing failed!", 'red')
        print(json.dumps(result, indent=2))
        return False
    
    # Print statistics
    print_colored("\n📊 STATISTICS:", 'blue')
    stats = result.get('statistics', {})
    print(f"  Total Questions: {stats.get('total_questions', 0)}")
    print(f"  Marked Questions: {stats.get('marked_questions', 0)}")
    print(f"  Unmarked Questions: {stats.get('unmarked_questions', 0)}")
    print(f"  Bubbles Detected: {stats.get('bubbles_detected', 0)}")
    print(f"  Zone Auto-Detected: {'✓' if stats.get('zone_detected', False) else '✗'}")
    
    # Print answers
    print_colored("\n📝 DETECTED ANSWERS:", 'green')
    answers = result.get('answers', {})
    confidence = result.get('confidence', {})
    
    # Group by column for better display
    for col in range(5):
        print_colored(f"\n  Column {col + 1}:", 'yellow')
        for row in range(10):
            q_num = str(col * 10 + row + 1)
            ans = answers.get(q_num, None)
            conf = confidence.get(q_num, 0.0)
            
            if ans:
                conf_bar = "█" * int(conf * 10)
                print(f"    Q{q_num:2s}: {ans} (confidence: {conf_bar} {conf:.2f})")
            else:
                print(f"    Q{q_num:2s}: [UNMARKED]")
    
    # Print debug images
    print_colored("\n🖼️  DEBUG IMAGES:", 'magenta')
    debug_imgs = result.get('debug_images', {})
    for stage, path in debug_imgs.items():
        if os.path.exists(path):
            print(f"  ✓ {stage}: {path}")
        else:
            print(f"  ✗ {stage}: File not created")
    
    print_colored("\n✅ Test completed successfully!", 'green')
    return True

def main():
    """Main test function"""
    print_colored("""
    ╔═══════════════════════════════════════════════════╗
    ║      OMR DETECTION ALGORITHM TEST SUITE          ║
    ║              Version 2.0                         ║
    ╚═══════════════════════════════════════════════════╝
    """, 'cyan')
    
    if len(sys.argv) < 2:
        print_colored("Usage: python test_omr.py <image_path>", 'yellow')
        print_colored("\nExample:", 'yellow')
        print_colored("  python test_omr.py test_sheet.jpg", 'white')
        return
    
    image_path = sys.argv[1]
    
    # Run test
    success = test_omr(image_path)
    
    if success:
        print_colored("\n🎉 All tests passed!", 'green')
    else:
        print_colored("\n❌ Tests failed!", 'red')
        sys.exit(1)

if __name__ == "__main__":
    main()
