"""Tests for NavX Algorithm Engine."""

import unittest
from engine.domain.grid import Grid
from engine.domain.algorithms.bfs import BreadthFirstSearch
from engine.domain.algorithms.dfs import DepthFirstSearch
from engine.domain.algorithms.greedy import GreedyBestFirstSearch
from engine.domain.algorithms.a_star import AStarSearch
from engine.application.run_race import RunRaceUseCase
from engine.adapters.json_io import parse_request, serialize_response


class TestAlgorithmEngine(unittest.TestCase):

    def test_grid_validation(self):
        with self.assertRaises(ValueError):
            Grid([])
        with self.assertRaises(ValueError):
            Grid([[1, 5], [1]])
        with self.assertRaises(ValueError):
            Grid([[1, 2], [1, 1]])

    def test_open_grid_navigation(self):
        matrix = [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1]
        ]
        grid = Grid(matrix)
        start = (0, 0)
        goal = (2, 2)

        algos = [BreadthFirstSearch(), DepthFirstSearch(), GreedyBestFirstSearch(), AStarSearch()]
        for algo in algos:
            res = algo.search(grid, start, goal)
            self.assertIsNotNone(res.path, f"{algo.name} failed to find path")
            self.assertEqual(res.path[0], start)
            self.assertEqual(res.path[-1], goal)
            self.assertIsNotNone(res.cost)
            self.assertGreater(len(res.explored), 0)

    def test_astar_finds_optimal_cost_over_traffic(self):
        # Grid where direct path goes through heavy traffic (cost 5) at (0, 1)
        # Detour is longer in cell count, but lower in fuel cost
        # (0,0) -open- (0,1: traffic=5) -open- (0,2)  [cost = 5 + 1 = 6]
        # (1,0) -open- (1,1: open=1)    -open- (1,2)  [detour: 1 + 1 + 1 + 1 = 4]
        matrix = [
            [1, 5, 1],
            [1, 1, 1]
        ]
        grid = Grid(matrix)
        start = (0, 0)
        goal = (0, 2)

        astar = AStarSearch()
        res_astar = astar.search(grid, start, goal)
        self.assertIsNotNone(res_astar.path)
        self.assertEqual(res_astar.cost, 4, f"A* should find detour cost 4, got {res_astar.cost}")

        # Ensure A* cost <= other algorithms
        bfs = BreadthFirstSearch()
        res_bfs = bfs.search(grid, start, goal)
        self.assertLessEqual(res_astar.cost, res_bfs.cost)

    def test_blocked_path_returns_none(self):
        matrix = [
            [1, -1, 1],
            [-1, -1, 1],
            [1, 1, 1]
        ]
        grid = Grid(matrix)
        start = (0, 0)
        goal = (2, 2)

        use_case = RunRaceUseCase()
        results = use_case.execute(grid, start, goal)
        for r in results:
            self.assertIsNone(r.path)
            self.assertIsNone(r.cost)

    def test_json_contract_v1(self):
        request_json = '{"contractVersion": 1, "grid": [[1, 5, -1], [1, 1, 1]], "start": [0, 0], "goal": [1, 2]}'
        grid, start, goal = parse_request(request_json)
        self.assertEqual(grid.rows, 2)
        self.assertEqual(grid.cols, 3)
        self.assertEqual(start, (0, 0))
        self.assertEqual(goal, (1, 2))

        use_case = RunRaceUseCase()
        results = use_case.execute(grid, start, goal)
        resp_json = serialize_response(results)
        self.assertIn('"contractVersion":1', resp_json)
        self.assertIn('"results":', resp_json)
        self.assertIn('"algorithm":"A*"', resp_json)


if __name__ == "__main__":
    unittest.main()
