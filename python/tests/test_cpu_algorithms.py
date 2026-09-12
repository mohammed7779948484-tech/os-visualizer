import unittest

from python.cpu.round_robin import RoundRobin
from python.cpu.sjf import SJF
from python.cpu.srtf import SRTF


PROCESSES = [
    {"P": "P1", "AT": 0, "BT": 7},
    {"P": "P2", "AT": 2, "BT": 4},
    {"P": "P3", "AT": 4, "BT": 1},
]


class SJFTests(unittest.TestCase):
    def test_non_preemptive_sjf(self):
        result = SJF(PROCESSES)
        self.assertEqual(result["schedule"], [
            {"P": "P1", "start": 0, "end": 7},
            {"P": "P3", "start": 7, "end": 8},
            {"P": "P2", "start": 8, "end": 12},
        ])
        by_id = {p["P"]: p for p in result["processes"]}
        self.assertEqual(by_id["P1"]["WT"], 0)
        self.assertEqual(by_id["P2"]["WT"], 6)
        self.assertEqual(by_id["P3"]["WT"], 3)
        self.assertEqual(result["average_WT"], 3.0)
        self.assertEqual(result["average_TAT"], 7.0)

    def test_sjf_keeps_input_order_on_equal_burst(self):
        result = SJF([
            {"P": "P2", "AT": 0, "BT": 2},
            {"P": "P1", "AT": 0, "BT": 2},
        ])
        self.assertEqual([s["P"] for s in result["schedule"]], ["P2", "P1"])


class SRTFTests(unittest.TestCase):
    def test_preemption_schedule(self):
        result = SRTF(PROCESSES)
        self.assertEqual(result["schedule"], [
            {"P": "P1", "start": 0, "end": 2},
            {"P": "P2", "start": 2, "end": 4},
            {"P": "P3", "start": 4, "end": 5},
            {"P": "P2", "start": 5, "end": 7},
            {"P": "P1", "start": 7, "end": 12},
        ])
        by_id = {p["P"]: p for p in result["processes"]}
        self.assertEqual(by_id["P1"]["WT"], 5)
        self.assertEqual(by_id["P2"]["WT"], 1)
        self.assertEqual(by_id["P3"]["WT"], 0)
        self.assertEqual(result["average_WT"], 2.0)
        self.assertEqual(result["average_TAT"], 6.0)

    def test_srtf_tracks_idle_time(self):
        result = SRTF([{"P": "P1", "AT": 3, "BT": 1}])
        self.assertEqual(result["schedule"][0], {"P": None, "start": 0, "end": 3})
        self.assertEqual(result["idle_time"], 3)


class RoundRobinTests(unittest.TestCase):
    def test_round_robin_quantum_two(self):
        result = RoundRobin(PROCESSES, 2)
        self.assertEqual(result["schedule"], [
            {"P": "P1", "start": 0, "end": 2},
            {"P": "P2", "start": 2, "end": 4},
            {"P": "P1", "start": 4, "end": 6},
            {"P": "P3", "start": 6, "end": 7},
            {"P": "P2", "start": 7, "end": 9},
            {"P": "P1", "start": 9, "end": 12},
        ])
        by_id = {p["P"]: p for p in result["processes"]}
        self.assertEqual(by_id["P1"]["WT"], 5)
        self.assertEqual(by_id["P2"]["WT"], 3)
        self.assertEqual(by_id["P3"]["WT"], 2)
        self.assertEqual(result["average_WT"], 3.333)
        self.assertEqual(result["average_TAT"], 7.333)
        self.assertEqual(result["quantum"], 2)

    def test_arrivals_are_enqueued_by_arrival_time(self):
        result = RoundRobin([
            {"P": "P1", "AT": 0, "BT": 2},
            {"P": "P2", "AT": 5, "BT": 1},
            {"P": "P3", "AT": 2, "BT": 1},
        ], 1)
        self.assertEqual(result["schedule"], [
            {"P": "P1", "start": 0, "end": 2},
            {"P": "P3", "start": 2, "end": 3},
            {"P": None, "start": 3, "end": 5},
            {"P": "P2", "start": 5, "end": 6},
        ])
        self.assertEqual(result["idle_time"], 2)


if __name__ == "__main__":
    unittest.main()
