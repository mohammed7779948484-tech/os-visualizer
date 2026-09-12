"""Small dispatcher for memory-allocation algorithms."""

from .best_fit import BestFit
from .first_fit import FirstFit
from .worst_fit import WorstFit


class MemoryEngine:
    """Select a memory algorithm without mixing allocation logic into runner.py."""

    ALGORITHMS = {
        "FIRST_FIT": FirstFit,
        "BEST_FIT": BestFit,
        "WORST_FIT": WorstFit,
    }

    @classmethod
    def run(cls, algorithm, blocks, process):
        if algorithm not in cls.ALGORITHMS:
            raise ValueError(f"Unsupported memory algorithm: {algorithm}.")

        return cls.ALGORITHMS[algorithm](blocks, process)
