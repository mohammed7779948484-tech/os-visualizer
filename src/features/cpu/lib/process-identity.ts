const processColors = [
  "var(--process-1)",
  "var(--process-2)",
  "var(--process-3)",
  "var(--process-4)",
  "var(--process-5)",
  "var(--process-6)",
]

export function getProcessColor(processId: string) {
  const numberedProcess = /^P(\d+)$/.exec(processId)
  if (numberedProcess) return processColors[Math.max(0, Number(numberedProcess[1]) - 1) % processColors.length]

  let hash = 0
  for (const character of processId) hash = ((hash * 31) + character.codePointAt(0)!) >>> 0
  const index = hash % processColors.length
  return processColors[index % processColors.length]
}
