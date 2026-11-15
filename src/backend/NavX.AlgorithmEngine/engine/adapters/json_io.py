"""JSON adapters for Contract v1."""

import json
from typing import Any, Dict, List, Optional, Tuple
from engine.domain.grid import Grid, Position
from engine.domain.search import SearchResult

CONTRACT_VERSION = 1


def parse_request(data: str) -> Tuple[Grid, Position, Position, Optional[List[str]]]:
    """Parses JSON request string according to Contract v1.
    
    Returns (grid, start, goal, algorithms_or_None).
    When algorithms is None, all registered algorithms are run.
    """
    payload: Dict[str, Any] = json.loads(data)

    version = payload.get("contractVersion")
    if version != CONTRACT_VERSION:
        raise ValueError(f"Unsupported contract version: {version}. Expected {CONTRACT_VERSION}.")

    grid_raw = payload.get("grid")
    if not isinstance(grid_raw, list) or not grid_raw:
        raise ValueError("Invalid grid: must be a non-empty 2D array.")

    start_raw = payload.get("start")
    goal_raw = payload.get("goal")

    if not isinstance(start_raw, list) or len(start_raw) != 2:
        raise ValueError("Invalid start position: must be [row, col].")
    if not isinstance(goal_raw, list) or len(goal_raw) != 2:
        raise ValueError("Invalid goal position: must be [row, col].")

    start: Position = (int(start_raw[0]), int(start_raw[1]))
    goal: Position = (int(goal_raw[0]), int(goal_raw[1]))

    # Optional algorithm selection — None means "run all"
    algorithms_raw = payload.get("algorithms")
    algorithms: Optional[List[str]] = None
    if isinstance(algorithms_raw, list) and algorithms_raw:
        algorithms = [str(a) for a in algorithms_raw]

    grid = Grid(grid_raw)
    return grid, start, goal, algorithms


def serialize_response(results: List[SearchResult]) -> str:
    """Serializes search results to JSON string according to Contract v1."""
    output = {
        "contractVersion": CONTRACT_VERSION,
        "results": [
            {
                "algorithm": r.algorithm,
                "path": [list(p) for p in r.path] if r.path is not None else None,
                "explored": [list(p) for p in r.explored],
                "cost": r.cost,
                "timeMs": r.time_ms
            }
            for r in results
        ]
    }
    return json.dumps(output, separators=(",", ":"))


def serialize_error(message: str) -> str:
    """Serializes error message to JSON string."""
    return json.dumps({"error": message})
