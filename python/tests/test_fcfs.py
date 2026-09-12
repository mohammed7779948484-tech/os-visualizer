from __future__ import annotations

import unittest

from python.cpu.fcfs import FCFSValidationError, schedule_fcfs


class FCFSTests(unittest.TestCase):
    def test_normal_sequence(self) -> None:
        result = schedule_fcfs(
            [
                {"id": "P1", "arrival": 0, "burst": 4},
                {"id": "P2", "arrival": 1, "burst": 3},
                {"id": "P3", "arrival": 2, "burst": 2},
            ]
        )

        self.assertEqual([item["finish"] for item in result["processes"]], [4, 7, 9])
        self.assertEqual([item["waiting"] for item in result["processes"]], [0, 3, 5])
        self.assertEqual(result["metrics"]["cpuIdleTime"], 0)

    def test_same_arrival_preserves_input_order(self) -> None:
        result = schedule_fcfs(
            [
                {"id": "P2", "arrival": 0, "burst": 2},
                {"id": "P1", "arrival": 0, "burst": 1},
            ]
        )

        run_order = [segment["processId"] for segment in result["timeline"] if segment["kind"] == "run"]
        self.assertEqual(run_order, ["P2", "P1"])

    def test_cpu_idle_gap(self) -> None:
        result = schedule_fcfs(
            [
                {"id": "P1", "arrival": 0, "burst": 4},
                {"id": "P2", "arrival": 1, "burst": 3},
                {"id": "P3", "arrival": 10, "burst": 2},
            ]
        )

        self.assertEqual(
            result["timeline"],
            [
                {"kind": "run", "processId": "P1", "start": 0, "end": 4},
                {"kind": "run", "processId": "P2", "start": 4, "end": 7},
                {"kind": "idle", "processId": None, "start": 7, "end": 10},
                {"kind": "run", "processId": "P3", "start": 10, "end": 12},
            ],
        )
        self.assertEqual(result["metrics"]["cpuIdleTime"], 3)
        self.assertEqual([item["finish"] for item in result["processes"]], [4, 7, 12])
        self.assertAlmostEqual(result["metrics"]["averageWaiting"], 1.0)
        self.assertAlmostEqual(result["metrics"]["averageTurnaround"], 4.0)
        event_types = [event["type"] for event in result["events"]]
        self.assertIn("idle_start", event_types)
        self.assertIn("idle_end", event_types)
        idle_event = next(event for event in result["events"] if event["type"] == "idle_start")
        self.assertEqual(idle_event["time"], 7)
        self.assertEqual(idle_event["until"], 10)
        self.assertEqual(idle_event["state"]["cpu"], None)

    def test_single_process(self) -> None:
        result = schedule_fcfs([{"id": "P1", "arrival": 3, "burst": 5}])

        self.assertEqual(result["processes"][0]["finish"], 8)
        self.assertEqual(result["processes"][0]["waiting"], 0)
        self.assertEqual(result["metrics"]["cpuIdleTime"], 3)

    def test_negative_arrival_is_invalid(self) -> None:
        with self.assertRaises(FCFSValidationError):
            schedule_fcfs([{"id": "P1", "arrival": -1, "burst": 2}])

    def test_zero_or_negative_burst_is_invalid(self) -> None:
        for burst in (0, -2):
            with self.subTest(burst=burst), self.assertRaises(FCFSValidationError):
                schedule_fcfs([{"id": "P1", "arrival": 0, "burst": burst}])

    def test_duplicate_id_and_fractional_times_are_invalid(self) -> None:
        with self.assertRaises(FCFSValidationError) as context:
            schedule_fcfs([
                {"id": "P1", "arrival": 0, "burst": 2},
                {"id": "P1", "arrival": 1.5, "burst": 1},
            ])

        paths = {detail["path"] for detail in context.exception.details}
        self.assertIn("processes[1].id", paths)
        self.assertIn("processes[1].arrival", paths)

    def test_event_states_keep_non_preemptive_cpu_owner(self) -> None:
        result = schedule_fcfs([
            {"id": "P1", "arrival": 0, "burst": 4},
            {"id": "P2", "arrival": 1, "burst": 1},
        ])

        p2_arrival = next(event for event in result["events"] if event["type"] == "arrival" and event["processId"] == "P2")
        self.assertEqual(p2_arrival["state"]["cpu"], "P1")
        self.assertEqual(p2_arrival["state"]["running"]["remaining"], 3)
        self.assertEqual(p2_arrival["state"]["readyQueue"], ["P2"])

        p1_execute = next(event for event in result["events"] if event["type"] == "execute" and event["processId"] == "P1")
        self.assertEqual(p1_execute["state"]["running"]["executed"], 4)
        self.assertEqual(p1_execute["state"]["running"]["remaining"], 0)


if __name__ == "__main__":
    unittest.main()
