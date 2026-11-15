"""Composition Root for NavX Algorithm Engine."""

import sys
import os

# Ensure engine package is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from engine.adapters.cli import run_cli


def main() -> None:
    exit_code = run_cli()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
