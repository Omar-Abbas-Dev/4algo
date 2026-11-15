"""A* Search algorithm.

A* combines the actual cost from the start (g) with an admissible heuristic
estimate to the goal (h) to guide expansion: f = g + h.

The heuristic used is Manhattan distance, which is admissible because the
minimum cost per step on this grid is 1 (OPEN cell), so manhattan(pos, goal)
never over-estimates the remaining cost.

A* guarantees the minimum-cost path and typically explores far fewer nodes
than BFS or DFS on weighted grids.
"""

import heapq
from typing import List, Optional, Dict
from engine.domain.grid import Grid, Position
from engine.domain.heuristics import manhattan
from engine.domain.search import SearchResult


class AStarSearch:
    """A* — optimal and efficient via f = g + h."""

    name: str = "A*"

    def search(self, grid: Grid, start: Position, goal: Position) -> SearchResult:
        if not grid.is_traversable(start) or not grid.is_traversable(goal):
            return SearchResult(algorithm=self.name, path=None, explored=[], cost=None)

        counter = 0
        # (f_score, tie_break_counter, position)
        pq: List[tuple] = []
        heapq.heappush(pq, (manhattan(start, goal), counter, start))

        g_score: Dict[Position, int] = {start: 0}
        parent: Dict[Position, Optional[Position]] = {start: None}
        explored: List[Position] = []
        closed_set: set[Position] = set()

        found = False
        while pq:
            _f, _, current = heapq.heappop(pq)

            if current in closed_set:
                continue

            closed_set.add(current)
            explored.append(current)

            if current == goal:
                found = True
                break

            for nxt in grid.neighbors(current):
                if nxt in closed_set:
                    continue

                # Edge cost = cost of entering the neighbour cell
                tentative_g = g_score[current] + grid.cost(nxt)

                if nxt not in g_score or tentative_g < g_score[nxt]:
                    g_score[nxt] = tentative_g
                    parent[nxt] = current
                    counter += 1
                    f_val = tentative_g + manhattan(nxt, goal)
                    heapq.heappush(pq, (f_val, counter, nxt))

        if not found:
            return SearchResult(algorithm=self.name, path=None, explored=explored, cost=None)

        # Reconstruct path
        path: List[Position] = []
        curr: Optional[Position] = goal
        while curr is not None:
            path.append(curr)
            curr = parent[curr]
        path.reverse()

        # Use the tracked g_score for the goal — this is the true minimum cost
        total_cost = g_score[goal]

        return SearchResult(
            algorithm=self.name,
            path=path,
            explored=explored,
            cost=total_cost,
        )
