"""Shortest Job First (SJF) non-preemptive CPU scheduling."""


def SJF(process):
    """Run non-preemptive SJF and return its academic results."""

    proc_copy = [p.copy() for p in process]

    current = 0
    total_TAT = 0
    total_WT = 0
    total_idle = 0

    results = []
    schedule = []

    while proc_copy:
        queue = [p for p in proc_copy if p["AT"] <= current]

        if not queue:
            if schedule and schedule[-1]["P"] is None:
                schedule[-1]["end"] += 1
            else:
                schedule.append({"P": None, "start": current, "end": current + 1})
            total_idle += 1
            current += 1
            continue

        # min() preserves the original input order when BT values are equal.
        p = min(queue, key=lambda x: x["BT"])
        start = current
        current += p["BT"]

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
        schedule.append({"P": p["P"], "start": start, "end": FT})

        total_TAT += TAT
        total_WT += WT
        proc_copy.remove(p)

    return {
        "processes": results,
        "schedule": schedule,
        "average_TAT": round(total_TAT / len(process), 3),
        "average_WT": round(total_WT / len(process), 3),
        "idle_time": total_idle,
        "total_time": current,
    }
