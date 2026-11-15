"""Use case: Run race executing selected (or all) algorithms on the given grid."""

import time
from typing import List, Optional
from engine.domain.grid import Grid, Position
from engine.domain.search import SearchResult
from engine.application.registry import AlgorithmRegistry


class RunRaceUseCase:
    """Orchestrates running configured search algorithms.
    
    When algorithms is None or empty, all registered algorithms are run.
    """

    def __init__(self, registry: AlgorithmRegistry | None = None) -> None:
        self.registry = registry or AlgorithmRegistry()

    def execute(
        self,
        grid: Grid,
        start: Position,
        goal: Position,
        algorithms: Optional[List[str]] = None,
    ) -> List[SearchResult]:
        # Pick requested algorithms; fall back to all if list is empty/None
        if algorithms:
            algos = [self.registry.get(name) for name in algorithms if name in self.registry._algorithms]
        else:
            algos = self.registry.get_all()

        results: List[SearchResult] = []
        for algo in algos:
            start_time = time.perf_counter()
            result = algo.search(grid, start, goal)
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            result.time_ms = round(elapsed_ms, 3)
            results.append(result)
        return results
