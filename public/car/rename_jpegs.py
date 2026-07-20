#!/usr/bin/env python3
import os
import sys
from pathlib import Path

def rename_jpegs(directory="."):
    """Rename all JPEG files in directory sequentially from 1 onwards."""
    
    directory = Path(directory)
    if not directory.exists():
        print(f"Error: Directory '{directory}' does not exist")
        sys.exit(1)
    
    # Get all JPEG files (case-insensitive)
    jpeg_files = sorted(directory.glob("*.[Jj][Pp][Ee][Gg]")) + sorted(directory.glob("*.[Jj][Pp][Gg]"))
    jpeg_files = list(dict.fromkeys(jpeg_files))  # Remove duplicates while preserving order
    
    if not jpeg_files:
        print("No JPEG files found in the directory")
        sys.exit(0)
    
    print(f"Found {len(jpeg_files)} JPEG file(s)")
    
    # Rename files
    for index, old_path in enumerate(jpeg_files, 1):
        new_name = f"{index}.jpeg"
        new_path = directory / new_name
        
        try:
            old_path.rename(new_path)
            print(f"✓ {old_path.name} → {new_name}")
        except Exception as e:
            print(f"✗ Failed to rename {old_path.name}: {e}")
    
    print(f"\nSuccessfully renamed {len(jpeg_files)} file(s)")

if __name__ == "__main__":
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    rename_jpegs(target_dir)
