"""First Fit memory allocation."""


def FirstFit(blocks, process):
    """Allocate each process to the first block with enough remaining space."""

    copy_block = blocks.copy()
    result = []

    for p in process:
        suitable = [j for j, block in enumerate(copy_block) if block >= p["size"]]

        if suitable:
            j = suitable[0]
            block_size = copy_block[j]
            free_space = block_size - p["size"]

            result.append({
                "pid": p["id"],
                "process_size": p["size"],
                "block": f"B{j + 1}",
                "block_size": block_size,
                "free_space": free_space,
                "status": "Allocated",
            })
            copy_block[j] = free_space
        else:
            result.append({
                "pid": p["id"],
                "process_size": p["size"],
                "block": "-",
                "block_size": "-",
                "free_space": "-",
                "status": "Not Allocated",
            })

    return {"allocations": result, "remaining_blocks": copy_block}
