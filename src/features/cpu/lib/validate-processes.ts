import type { ProcessInput, SimulationError } from "../types"

export function validateProcessInputs(processes: ProcessInput[]): SimulationError | null {
  if (processes.length === 0) {
    return { code: "EMPTY_WORKLOAD", message: "أضف عملية واحدة على الأقل قبل تشغيل المحاكاة." }
  }

  const seenIds = new Set<string>()
  for (let index = 0; index < processes.length; index += 1) {
    const process = processes[index]
    if (!process.id.trim()) {
      return { code: "INVALID_PROCESS_ID", message: `معرّف العملية رقم ${index + 1} غير صالح.` }
    }
    if (seenIds.has(process.id)) {
      return { code: "DUPLICATE_PROCESS_ID", message: `معرّف العملية ${process.id} مكرر.` }
    }
    if (!Number.isInteger(process.arrival) || process.arrival < 0) {
      return { code: "INVALID_ARRIVAL", message: `زمن الوصول للعملية ${process.id} يجب أن يكون عددًا صحيحًا أكبر من أو يساوي 0.` }
    }
    if (!Number.isInteger(process.burst) || process.burst <= 0) {
      return { code: "INVALID_BURST", message: `زمن التنفيذ للعملية ${process.id} يجب أن يكون عددًا صحيحًا أكبر من 0.` }
    }
    seenIds.add(process.id)
  }

  return null
}
