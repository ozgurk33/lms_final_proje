"""
OMR Answer Reader Wrapper - Backend için stdout JSON
"""
import sys
import json
sys.path.append('/app/omr-algorithm')

from omr_answer_reader import read_answers

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No image path"}))
        sys.exit(0)
    
    image_path = sys.argv[1]
    result = read_answers(image_path)
    
    if result is None:
        print(json.dumps({
            "success": False,
            "error": "OMR okuma başarısız",
            "paper_detected": False
        }))
    else:
        print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()
