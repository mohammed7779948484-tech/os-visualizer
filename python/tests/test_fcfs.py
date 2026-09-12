import unittest

from python.cpu.fcfs import FCFS


class FCFSTests(unittest.TestCase):
    def test_professor_example(self):
        result = FCFS([
            {"P": 1, "AT": 0, "BT": 4},
            {"P": 2, "AT": 1, "BT": 3},
            {"P": 3, "AT": 3, "BT": 2},
        ])

        self.assertEqual([p["FT"] for p in result["processes"]], [4, 7, 9])
        self.assertEqual([p["TAT"] for p in result["processes"]], [4, 6, 6])
        self.assertEqual([p["WT"] for p in result["processes"]], [0, 3, 4])
        self.assertEqual(result["average_TAT"], 5.333)
        self.assertEqual(result["average_WT"], 2.333)
        self.assertEqual(result["idle_time"], 0)

    def test_same_arrival_preserves_input_order(self):
        result = FCFS([
            {"P": "P2", "AT": 0, "BT": 2},
            {"P": "P1", "AT": 0, "BT": 1},
        ])
        self.assertEqual([p["P"] for p in result["processes"]], ["P2", "P1"])

    def test_cpu_idle_gap(self):
        result = FCFS([
            {"P": "P1", "AT": 0, "BT": 4},
            {"P": "P2", "AT": 1, "BT": 3},
            {"P": "P3", "AT": 10, "BT": 2},
        ])

        self.assertEqual(result["schedule"], [
            {"P": "P1", "start": 0, "end": 4},
            {"P": "P2", "start": 4, "end": 7},
            {"P": None, "start": 7, "end": 10},
            {"P": "P3", "start": 10, "end": 12},
        ])
        self.assertEqual(result["idle_time"], 3)
        self.assertEqual(result["total_time"], 12)
        self.assertEqual([p["FT"] for p in result["processes"]], [4, 7, 12])
        self.assertEqual(result["average_WT"], 1.0)
        self.assertEqual(result["average_TAT"], 4.0)

    def test_initial_idle_time(self):
        result = FCFS([{"P": "P1", "AT": 3, "BT": 5}])
        self.assertEqual(result["schedule"][0], {"P": None, "start": 0, "end": 3})
        self.assertEqual(result["processes"][0]["FT"], 8)
        self.assertEqual(result["processes"][0]["WT"], 0)
        self.assertEqual(result["idle_time"], 3)

    def test_unsorted_input_is_scheduled_by_arrival(self):
        result = FCFS([
            {"P": "late", "AT": 5, "BT": 1},
            {"P": "early", "AT": 0, "BT": 1},
        ])
        self.assertEqual([p["P"] for p in result["processes"]], ["early", "late"])
        self.assertEqual([segment["P"] for segment in result["schedule"] if segment["P"]], ["early", "late"])


if __name__ == "__main__":
    unittest.main()
