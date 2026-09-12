import unittest

from python.memory.best_fit import BestFit
from python.memory.first_fit import FirstFit
from python.memory.worst_fit import WorstFit


BLOCKS = [100, 500, 200, 300, 600]
PROCESSES = [
    {"id": "P1", "size": 212},
    {"id": "P2", "size": 417},
    {"id": "P3", "size": 112},
    {"id": "P4", "size": 426},
]


class MemoryAllocationTests(unittest.TestCase):
    def test_first_fit_reuses_remaining_space(self):
        result = FirstFit(BLOCKS, PROCESSES)
        allocations = result["allocations"]
        self.assertEqual([(a["pid"], a["block"]) for a in allocations], [
            ("P1", "B2"),
            ("P2", "B5"),
            ("P3", "B2"),
            ("P4", "-"),
        ])
        self.assertEqual(allocations[2]["block_size"], 288)
        self.assertEqual(allocations[2]["free_space"], 176)
        self.assertEqual(result["remaining_blocks"], [100, 176, 200, 300, 183])

    def test_best_fit(self):
        result = BestFit(BLOCKS, PROCESSES)
        self.assertEqual([a["block"] for a in result["allocations"]], ["B4", "B2", "B3", "B5"])
        self.assertEqual(result["remaining_blocks"], [100, 83, 88, 88, 174])

    def test_worst_fit(self):
        result = WorstFit(BLOCKS, PROCESSES)
        self.assertEqual([a["block"] for a in result["allocations"]], ["B5", "B2", "B5", "-"])
        self.assertEqual(result["remaining_blocks"], [100, 83, 200, 300, 276])


if __name__ == "__main__":
    unittest.main()
