"""Shortest Remaining Time First (SRTF) CPU scheduling."""


def SRTF(process):
    """Run preemptive SJF/SRTF and return its academic results."""

    proc_copy = [p.copy() for p in process]
    for p in proc_copy:
        p["RT"] = p["BT"]

    current = 0
    completed = 0
    total_TAT = 0
    total_WT = 0
    total_idle = 0

    results = []
    schedule = []
    n = len(proc_copy)

    while completed != n:
        queue = [p for p in proc_copy if p["AT"] <= current and p["RT"] > 0]

        if not queue:
            if schedule and schedule[-1]["P"] is None:
                schedule[-1]["end"] += 1
            else:
                schedule.append({"P": None, "start": current, "end": current + 1})
            total_idle += 1
            current += 1
            continue

        # min() preserves original input order when remaining times are equal.
        p = min(queue, key=lambda x: x["RT"])

        if schedule and schedule[-1]["P"] == p["P"]:
            schedule[-1]["end"] += 1
        else:
            schedule.append({"P": p["P"], "start": current, "end": current + 1})

        p["RT"] -= 1
        current += 1

        if p["RT"] == 0:
            completed += 1

            FT = current
            TAT = FT - p["AT"]
            WT = TAT - p["BT"]

            results.append({
                "P": p["P"],
                "AT": p["AT"],
                "BT": p["BT"],
                "FT": FT,
                "TAT": TAT,
                "WT": WT,
            })

            total_TAT += TAT
            total_WT += WT

    return {
        "processes": results,
        "schedule": schedule,
        "average_TAT": round(total_TAT / n, 3),
        "average_WT": round(total_WT / n, 3),
        "idle_time": total_idle,
        "total_time": current,
    }
