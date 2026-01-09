import sys
import os
import re

def convert_page_to_nextjs(input_file, output_file):
    """Convert a React Router page to Next.js format"""
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add 'use client' directive at the top
    if "'use client'" not in content and '"use client"' not in content:
        content = "'use client';\n\n" + content
    
    # Replace React Router imports
    content = re.sub(
        r"import\s+{\s*([^}]*useNavigate[^}]*)\s*}\s*from\s+['\"]react-router-dom['\"];?",
        "",
        content
    )
    content = re.sub(
        r"import\s+{\s*([^}]*Link[^}]*)\s*}\s*from\s+['\"]react-router-dom['\"];?",
        "",
        content
    )
    
    # Add Next.js imports if needed
    if "useNavigate" in content:
        content = "import { useRouter } from 'next/navigation';\n" + content
    if "Link" in content and "from 'react-router-dom'" not in content:
        content = "import Link from 'next/link';\n" + content
    
    # Replace useNavigate hook
    content = re.sub(r"const\s+navigate\s*=\s*useNavigate\(\);?", "const router = useRouter();", content)
    content = re.sub(r"navigate\(", "router.push(", content)
    
    # Fix import paths (add ../ for going up to root)
    content = re.sub(r"from\s+['\"]\.\.\/store\/", "from '@/store/", content)
    content = re.sub(r"from\s+['\"]\.\.\/services\/", "from '@/services/", content)
    content = re.sub(r"from\s+['\"]\.\.\/components\/", "from '@/components/", content)
    content = re.sub(r"from\s+['\"]\.\.\/utils\/", "from '@/utils/", content)
    content = re.sub(r"from\s+['\"]\.\.\/i18n\/", "from '@/i18n/", content)
    
    # Handle relative imports for nested pages
    content = re.sub(r"from\s+['\"]\.\.\/\.\.\/store\/", "from '@/store/", content)
    content = re.sub(r"from\s+['\"]\.\.\/\.\.\/services\/", "from '@/services/", content)
    content = re.sub(r"from\s+['\"]\.\.\/\.\.\/components\/", "from '@/components/", content)
    content = re.sub(r"from\s+['\"]\.\.\/\.\.\/utils\/", "from '@/utils/", content)
    
    # Write output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Converted: {input_file} -> {output_file}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python convert_pages.py <input_file> <output_file>")
        sys.exit(1)
    
    convert_page_to_nextjs(sys.argv[1], sys.argv[2])
