import type { SimulationEvent } from "../types"

export function describeEvent(event: SimulationEvent): { title: string; detail: string } {
  const processId = event.processId ?? "العملية"

  switch (event.type) {
    case "simulation_start":
      return { title: "تهيئة العرض", detail: "استلمت الواجهة جدول التنفيذ المحسوب من بايثون وأصبحت جاهزة لإعادة عرضه." }
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
        detail: "يعرض المختبر قرار التنفيذ الذي أعادته خوارزمية FCFS في بايثون.",
      }
    case "complete":
      return {
        title: `اكتمال ${processId}`,
        detail: `انتهت عند t=${event.finish}؛ زمن الدوران ${event.turnaround}t والانتظار ${event.waiting}t.`,
      }
    case "idle_start":
      return {
        title: "بدء خمول المعالج",
        detail: `لا توجد عملية مجدولة للتنفيذ. تستمر فترة الخمول حتى t=${event.until}.`,
      }
    case "idle_end":
      return { title: "انتهاء الخمول", detail: "انتهت فترة الخمول المحسوبة وأصبح جدول التنفيذ جاهزًا للمقطع التالي." }
    case "simulation_complete":
      return {
        title: "اكتمل العرض",
        detail: `تم عرض الجدول المحسوب لعدد ${event.processCount} عمليات بالكامل.`,
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
