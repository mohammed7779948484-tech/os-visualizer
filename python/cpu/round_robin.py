"""Round Robin (RR) CPU scheduling."""


def RoundRobin(process, q):
    """Run Round Robin using time quantum q and return academic results."""

    proc_copy = [p.copy() for p in process]
    for p in proc_copy:
        p["RT"] = p["BT"]

    # RR arrivals must enter the ready queue by arrival time. Python's stable
    # sort preserves original input order when arrival times are equal.
    proc_copy.sort(key=lambda x: x["AT"])

    current = 0
    total_TAT = 0
    total_WT = 0
    total_idle = 0

    results = []
    queue = []
    schedule = []
    n = len(proc_copy)

    while proc_copy or queue:
        while proc_copy and proc_copy[0]["AT"] <= current:
            queue.append(proc_copy.pop(0))

        if not queue:
            next_AT = proc_copy[0]["AT"]
            schedule.append({"P": None, "start": current, "end": next_AT})
            total_idle += next_AT - current
            current = next_AT
            continue

        p = queue.pop(0)
        run_time = min(q, p["RT"])

        if schedule and schedule[-1]["P"] == p["P"]:
            schedule[-1]["end"] += run_time
        else:
            schedule.append({"P": p["P"], "start": current, "end": current + run_time})

        current += run_time
        p["RT"] -= run_time

        # Processes that arrive during this quantum join before the current
        # process is re-queued, matching standard RR ready-queue behavior.
        while proc_copy and proc_copy[0]["AT"] <= current:
            queue.append(proc_copy.pop(0))

        if p["RT"] == 0:
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
        else:
            queue.append(p)

    return {
        "processes": results,
        "schedule": schedule,
        "average_TAT": round(total_TAT / n, 3),
        "average_WT": round(total_WT / n, 3),
        "idle_time": total_idle,
        "total_time": current,
        "quantum": q,
    }
