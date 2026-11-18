from typing import List, Optional, Dict
from engine.domain.grid import Grid, Position
from engine.domain.search import SearchResult


class DepthFirstSearch:
    name: str = "DFS"

    def search(self, grid: Grid, start: Position, goal: Position) -> SearchResult:
        if not grid.is_traversable(start) or not grid.is_traversable(goal):
            return SearchResult(algorithm=self.name, path=None, explored=[], cost=None)

        stack: List[Position] = [start]
        visited: set[Position] = set()
        parent: Dict[Position, Optional[Position]] = {start: None}
        explored: List[Position] = []

        found = False
        while stack:
            current = stack.pop()
            if current in visited:
                continue

            visited.add(current)
            explored.append(current)

            if current == goal:
                found = True
                break

            # Push neighbours in reverse order so that the "natural" direction
            # (up, right, down, left) is explored first (top of stack = last pushed).
            for nxt in reversed(grid.neighbors(current)):
                if nxt not in visited:
                    if nxt not in parent:
                        parent[nxt] = current
                    stack.append(nxt)

        if not found:
            return SearchResult(algorithm=self.name, path=None, explored=explored, cost=None)

        # Reconstruct path
        path: List[Position] = []
        curr: Optional[Position] = goal
        while curr is not None:
            path.append(curr)
            curr = parent[curr]
        path.reverse()

        total_cost = sum(grid.cost(p) for p in path[1:])

        return SearchResult(
            algorithm=self.name,
            path=path,
            explored=explored,
            cost=total_cost,
        )
