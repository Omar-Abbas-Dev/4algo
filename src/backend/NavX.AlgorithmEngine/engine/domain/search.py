from dataclasses import dataclass
from typing import List, Tuple, Optional, Protocol
from engine.domain.grid import Grid

Position = Tuple[int, int]


@dataclass
class SearchResult:
    algorithm: str
    path: Optional[List[Position]]
    explored: List[Position]
    cost: Optional[int]
    time_ms: float = 0.0


class SearchAlgorithm(Protocol):
    name: str

    def search(self, grid: Grid, start: Position, goal: Position) -> SearchResult:
        ...
