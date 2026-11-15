"""Greedy Best-First Search algorithm.

Greedy expands the node that *looks* closest to the goal (lowest heuristic
value) without considering path cost so far.  It is fast and explores few
nodes but is NOT guaranteed to find the optimal path — it can be misled by
the heuristic and take a more expensive route than A*.
"""

import heapq
from typing import List, Optional, Dict
from engine.domain.grid import Grid, Position
from engine.domain.heuristics import manhattan
from engine.domain.search import SearchResult


class GreedyBestFirstSearch:
    """Greedy Best-First — fast, heuristic-guided, not optimal."""

    name: str = "Greedy"

    def search(self, grid: Grid, start: Position, goal: Position) -> SearchResult:
        if not grid.is_traversable(start) or not grid.is_traversable(goal):
            return SearchResult(algorithm=self.name, path=None, explored=[], cost=None)

        counter = 0
        # (heuristic, tie_break_counter, position)
        pq: List[tuple] = []
        heapq.heappush(pq, (manhattan(start, goal), counter, start))

        visited: set[Position] = {start}
        parent: Dict[Position, Optional[Position]] = {start: None}
        explored: List[Position] = []

        found = False
        while pq:
            _, _, current = heapq.heappop(pq)
            explored.append(current)

            if current == goal:
                found = True
                break

            for nxt in grid.neighbors(current):
                if nxt not in visited:
                    visited.add(nxt)
                    parent[nxt] = current
                    counter += 1
                    heapq.heappush(pq, (manhattan(nxt, goal), counter, nxt))

        if not found:
            return SearchResult(algorithm=self.name, path=None, explored=explored, cost=None)

        # Reconstruct path
        path: List[Position] = []
        curr: Optional[Position] = goal
        while curr is not None:
            path.append(curr)
            curr = parent[curr]
        path.reverse()

        # Fuel cost = sum of actual cell costs (Greedy ignores cost during search,
        # but we still report the true cost of the path it found)
        total_cost = sum(grid.cost(p) for p in path[1:])

        return SearchResult(
            algorithm=self.name,
            path=path,
            explored=explored,
            cost=total_cost,
        )
