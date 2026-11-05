import { z } from "zod";
import { SystemType, JobType } from "../types/workorder.enums";

export const headerSchema = z
  .object({
    systemType: z.union([z.literal(SystemType.System1), z.literal(SystemType.System2)]),
    jobType: z.union([
      z.literal(JobType.Montage),
      z.literal(JobType.Replace),
      z.literal(JobType.Fault),
    ]),

    // artık free-text değil: seçilen müşteri id
    // "OTHER" = Diğer seçeneği
    customerId: z.string().nullable(),

    // sadece OTHER seçilince doldurulacak
    customerOther: z.string().optional(),

    notes: z.string().optional(),
    faultCause: z.string().optional(),
    faultResolution: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    // müşteri seçilmesi zorunlu
    if (!val.customerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerId"],
        message: "Müşteri seçmelisin",
      });
      return;
    }

    // Diğer seçildiyse detay zorunlu
    if (val.customerId === "OTHER") {
      const other = (val.customerOther ?? "").trim();
      if (other.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerOther"],
          message: "Diğer müşteri bilgisi çok kısa",
        });
      }
    }
  });

export type HeaderFormValues = z.infer<typeof headerSchema>;