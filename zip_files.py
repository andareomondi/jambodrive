"""
Zip the Next.js project root, excluding build artifacts, dependencies, and .env files.
Run from the project root: python zip_files.py
"""

import os
import zipfile
from pathlib import Path

EXCLUDED_DIRS = {
    "node_modules",
    ".next",
    "out",
    ".git",
    ".turbo",
    ".vercel",
    "coverage",
    "public"
}

EXCLUDED_FILES = {
    ".DS_Store",
    "Thumbs.db",
}

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT.parent / f"{ROOT.name}.zip"


def is_env_file(filename: str) -> bool:
    # Skips .env, .env.local, .env.production, etc., while keeping .env.example if present
    if filename == ".env.example":
        return False
    return filename == ".env" or filename.startswith(".env.")


def should_skip_dir(dirname: str) -> bool:
    return dirname in EXCLUDED_DIRS


def should_skip_file(path: Path) -> bool:
    if path == OUTPUT:
        return True
    if path.name in EXCLUDED_FILES or is_env_file(path.name):
        return True
    return any(part in EXCLUDED_DIRS for part in path.relative_to(ROOT).parts)


def main():
    if OUTPUT.exists():
        OUTPUT.unlink()

    count = 0
    with zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED) as zf:
        for dirpath, dirnames, filenames in os.walk(ROOT):
            # Prune excluded directories in-place so os.walk doesn't descend into them
            dirnames[:] = [d for d in dirnames if not should_skip_dir(d)]
            for name in filenames:
                full = Path(dirpath) / name
                if should_skip_file(full):
                    continue
                zf.write(full, full.relative_to(ROOT.parent))
                count += 1

    print(f"Created {OUTPUT} with {count} files.")


if __name__ == "__main__":
    main()
