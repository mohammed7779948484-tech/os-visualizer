"""First-Come, First-Served (FCFS) CPU scheduling."""


def FCFS(process):
    """Run FCFS and return its academic results."""

    process = sorted(process, key=lambda x: x["AT"])

    current = 0
    total_TAT = 0
    total_WT = 0
    total_idle = 0

    results = []
    schedule = []

    for p in process:
        if current < p["AT"]:
            schedule.append({"P": None, "start": current, "end": p["AT"]})
            total_idle += p["AT"] - current
            current = p["AT"]

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

    return {
        "processes": results,
        "schedule": schedule,
        "average_TAT": round(total_TAT / len(process), 3),
        "average_WT": round(total_WT / len(process), 3),
        "idle_time": total_idle,
        "total_time": current,
    }
