import type { SimulationEvent } from "../types"

export function describeEvent(event: SimulationEvent): { title: string; detail: string } {
  const processId = event.processId ?? "العملية"

  switch (event.type) {
    case "simulation_start":
      return { title: "تهيئة المجدول", detail: "تم تحميل عبء العمل وأصبح المجدول جاهزًا للتنفيذ." }
    case "arrival":
      return {
        title: `وصول ${processId}`,
        detail: event.state.cpu
          ? `انضمت ${processId} إلى قائمة الجاهزين بينما تواصل ${event.state.cpu} التنفيذ دون استباق.`
          : `وصلت ${processId} بزمن تنفيذ ${event.burst}t وأصبحت جاهزة للإرسال.`,
      }
    case "dispatch":
      return {
        title: `إرسال ${processId} إلى المعالج`,
        detail: "اختار FCFS أقدم عملية جاهزة وفق ترتيب الوصول والإدخال.",
      }
    case "execute":
      return {
        title: `إنهاء دفعة ${processId}`,
        detail: `استهلكت ${processId} زمن التنفيذ المطلوب بالكامل وأصبح المتبقي 0t.`,
      }
    case "complete":
      return {
        title: `اكتمال ${processId}`,
        detail: `انتهت عند t=${event.finish}؛ زمن الدوران ${event.turnaround}t والانتظار ${event.waiting}t.`,
      }
    case "idle_start":
      return {
        title: "بدء خمول المعالج",
        detail: `لا توجد عملية جاهزة. سيبقى المعالج خاملًا حتى t=${event.until}.`,
      }
    case "idle_end":
      return { title: "انتهاء الخمول", detail: "وصلت عملية جديدة ويمكن للمجدول استئناف الإرسال." }
    case "simulation_complete":
      return {
        title: "اكتملت المحاكاة",
        detail: `اكتمل تنفيذ ${event.processCount} عمليات وأصبحت النتائج النهائية جاهزة.`,
      }
  }
}

export function translatePythonError(code: string, fallback: string) {
  switch (code) {
    case "VALIDATION_ERROR":
      return "تحقق من أزمنة الوصول والتنفيذ ثم أعد المحاولة."
    case "UNSUPPORTED_ALGORITHM":
      return "هذه الخوارزمية لم تُربط ببايثون بعد."
    case "PYTHON_UNAVAILABLE":
      return "تعذر تشغيل مفسر بايثون المحلي."
    default:
      return fallback
  }
}
