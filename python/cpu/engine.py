"""Small dispatcher for CPU scheduling algorithms."""

from .fcfs import FCFS
from .round_robin import RoundRobin
from .sjf import SJF
from .srtf import SRTF


class CPUEngine:
    """Select a CPU algorithm without putting algorithm logic in the runner."""

    ALGORITHMS = {
        "FCFS": FCFS,
        "SJF": SJF,
        "SRTF": SRTF,
        "RR": RoundRobin,
    }

    @classmethod
    def run(cls, algorithm, process, quantum=None):
        if algorithm not in cls.ALGORITHMS:
            raise ValueError(f"Unsupported CPU algorithm: {algorithm}.")

        if algorithm == "RR":
            return cls.ALGORITHMS[algorithm](process, quantum)

        return cls.ALGORITHMS[algorithm](process)
