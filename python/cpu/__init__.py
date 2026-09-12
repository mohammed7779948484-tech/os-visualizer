"""CPU scheduling algorithms."""

from .fcfs import FCFSValidationError, schedule_fcfs

__all__ = ["FCFSValidationError", "schedule_fcfs"]
