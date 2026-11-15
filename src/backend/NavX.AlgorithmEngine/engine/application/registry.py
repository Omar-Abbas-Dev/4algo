"""Algorithm registry mapping algorithm names to strategy implementations."""

from typing import Dict, List
from engine.domain.search import SearchAlgorithm
from engine.domain.algorithms.bfs import BreadthFirstSearch
from engine.domain.algorithms.dfs import DepthFirstSearch
from engine.domain.algorithms.greedy import GreedyBestFirstSearch
from engine.domain.algorithms.a_star import AStarSearch


class AlgorithmRegistry:
    """Manages the available search algorithms."""

    def __init__(self) -> None:
        self._algorithms: Dict[str, SearchAlgorithm] = {
            "BFS": BreadthFirstSearch(),
            "DFS": DepthFirstSearch(),
            "Greedy": GreedyBestFirstSearch(),
            "A*": AStarSearch(),
        }

    def get(self, name: str) -> SearchAlgorithm:
        if name not in self._algorithms:
            raise KeyError(f"Unknown algorithm: {name}")
        return self._algorithms[name]

    def get_all(self) -> List[SearchAlgorithm]:
        return list(self._algorithms.values())
