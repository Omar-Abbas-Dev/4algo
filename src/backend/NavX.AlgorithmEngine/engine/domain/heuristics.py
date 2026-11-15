"""Heuristics for NavX Algorithm Engine."""

from typing import Tuple

Position = Tuple[int, int]


def manhattan(a: Position, b: Position) -> int:
    """Computes Manhattan distance between two points."""
    return abs(a[0] - b[0]) + abs(a[1] - b[1])
