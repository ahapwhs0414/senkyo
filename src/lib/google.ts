import { z } from "zod";
export const googlePlaceSchema = z.object({
  id: z.string(),
  displayName: z.object({ text: z.string() }),
  formattedAddress: z.string().optional(),
  location: z
    .object({ latitude: z.number(), longitude: z.number() })
    .optional(),
  rating: z.number().optional(),
  userRatingCount: z.number().optional(),
  priceLevel: z.string().optional(),
  priceRange: z
    .object({
      startPrice: z
        .object({ currencyCode: z.string(), units: z.string().optional() })
        .optional(),
      endPrice: z
        .object({ currencyCode: z.string(), units: z.string().optional() })
        .optional(),
    })
    .optional(),
  regularOpeningHours: z
    .object({ weekdayDescriptions: z.array(z.string()).optional() })
    .optional(),
  nationalPhoneNumber: z.string().optional(),
  websiteUri: z
    .url()
    .refine((v) => ["http:", "https:"].includes(new URL(v).protocol))
    .optional(),
  googleMapsUri: z.string().optional(),
  photos: z
    .array(
      z.object({
        name: z.string(),
        authorAttributions: z
          .array(
            z.object({
              displayName: z.string().optional(),
              uri: z.string().optional(),
              photoUri: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});
export type GooglePlace = z.infer<typeof googlePlaceSchema>;

export function googleErrorMessage(body: unknown): string {
  const parsed = z
    .object({
      error: z
        .object({
          details: z
            .array(z.object({ reason: z.string().optional() }))
            .optional(),
        })
        .optional(),
    })
    .safeParse(body);
  const reasons = parsed.success
    ? (parsed.data.error?.details?.map((d) => d.reason) ?? [])
    : [];
  if (reasons.includes("API_KEY_HTTP_REFERRER_BLOCKED"))
    return "Google 장소 서비스가 서버 접근을 차단했습니다. 서버용 키의 웹사이트 제한 설정을 확인해주세요.";
  if (
    reasons.includes("SERVICE_DISABLED") ||
    reasons.includes("API_KEY_SERVICE_BLOCKED")
  )
    return "Google Places API (New)가 허용되지 않았습니다. 장소 서비스 설정을 확인해주세요.";
  if (reasons.includes("BILLING_DISABLED"))
    return "Google 장소 서비스의 결제 설정을 확인해주세요.";
  return "Google 장소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
}
