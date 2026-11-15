"""CLI adapter: stdin -> use case -> stdout."""

import sys
from engine.adapters.json_io import parse_request, serialize_response, serialize_error
from engine.application.run_race import RunRaceUseCase


def run_cli() -> int:
    """Reads request from stdin, executes search algorithms, and writes result to stdout."""
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            sys.stderr.write(serialize_error("Empty request input on stdin.\n"))
            return 1

        grid, start, goal, algorithms = parse_request(raw_input)
        use_case = RunRaceUseCase()
        results = use_case.execute(grid, start, goal, algorithms)
        response_json = serialize_response(results)

        sys.stdout.write(response_json)
        sys.stdout.flush()
        return 0

    except Exception as exc:
        sys.stderr.write(serialize_error(str(exc)) + "\n")
        sys.stderr.flush()
        return 1
