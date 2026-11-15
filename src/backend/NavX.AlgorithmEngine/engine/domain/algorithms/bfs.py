"""Breadth-First Search (BFS) algorithm.

BFS explores level-by-level and guarantees the shortest path in terms of
*number of steps* (hops). On a weighted grid this means it may NOT find
the minimum-cost path; it finds the fewest-step path.  The fuel cost
shown is therefore the sum of cell weights along that fewest-hop route,
which can be higher than A* (which minimises cumulative cell cost).

This is the correct and intended behaviour: each algorithm has a
different optimality characteristic.
"""

from collections import deque
from typing import List, Optional, Dict
from engine.domain.grid import Grid, Position
from engine.domain.search import SearchResult


class BreadthFirstSearch:
    """BFS — optimal for unweighted graphs (fewest hops)."""

    name: str = "BFS"

    def search(self, grid: Grid, start: Position, goal: Position) -> SearchResult:
        if not grid.is_traversable(start) or not grid.is_traversable(goal):
            return SearchResult(algorithm=self.name, path=None, explored=[], cost=None)

        queue: deque[Position] = deque([start])
        visited: set[Position] = {start}
        parent: Dict[Position, Optional[Position]] = {start: None}
        explored: List[Position] = []

        found = False
        while queue:
            current = queue.popleft()
            explored.append(current)

            if current == goal:
                found = True
                break

            for nxt in grid.neighbors(current):
                if nxt not in visited:
                    visited.add(nxt)
                    parent[nxt] = current
                    queue.append(nxt)

        if not found:
            return SearchResult(algorithm=self.name, path=None, explored=explored, cost=None)

        # Reconstruct path
        path: List[Position] = []
        curr: Optional[Position] = goal
        while curr is not None:
            path.append(curr)
            curr = parent[curr]
        path.reverse()

        # Fuel cost = sum of cell costs along the path (excluding start cell)
        total_cost = sum(grid.cost(p) for p in path[1:])

        return SearchResult(
            algorithm=self.name,
            path=path,
            explored=explored,
            cost=total_cost,
        )
