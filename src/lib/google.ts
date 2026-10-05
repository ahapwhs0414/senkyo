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

export function googleErrorInfo(
  body: unknown,
  httpStatus?: number,
): { message: string; code: string } {
  const parsed = z
    .object({
      error: z
        .object({
          status: z.string().optional(),
          message: z.string().optional(),
          details: z
            .array(z.object({ reason: z.string().optional() }))
            .optional(),
        })
        .optional(),
    })
    .safeParse(body);
  const error = parsed.success ? parsed.data.error : undefined;
  const reasons = error?.details?.map((d) => d.reason) ?? [];
  const knownReasons = [
    "API_KEY_HTTP_REFERRER_BLOCKED",
    "API_KEY_IP_ADDRESS_BLOCKED",
    "API_KEY_INVALID",
    "API_KEY_EXPIRED",
    "API_KEY_NOT_FOUND",
    "API_KEY_SERVICE_BLOCKED",
    "SERVICE_DISABLED",
    "BILLING_DISABLED",
    "BILLING_NOT_ACTIVE",
    "QUOTA_EXCEEDED",
  ];
  let code =
    reasons.find((r) => r && knownReasons.includes(r)) ??
    ([
      "INVALID_ARGUMENT",
      "PERMISSION_DENIED",
      "UNAUTHENTICATED",
      "RESOURCE_EXHAUSTED",
      "NOT_FOUND",
      "UNAVAILABLE",
      "INTERNAL",
    ].includes(error?.status ?? "")
      ? error!.status!
      : "UNKNOWN");
  if (error?.message?.includes("API key not valid")) code = "API_KEY_INVALID";
  const messages: Record<string, string> = {
    API_KEY_HTTP_REFERRER_BLOCKED:
      "Google 장소 서비스가 서버 접근을 차단했습니다. 서버용 키의 웹사이트 제한 설정을 확인해주세요.",
    API_KEY_IP_ADDRESS_BLOCKED:
      "Google 장소 서비스가 서버 IP를 차단했습니다. 서버용 키의 IP 제한 설정을 확인해주세요.",
    API_KEY_INVALID:
      "Google 서버용 API 키가 유효하지 않습니다. Vercel Production 환경변수를 확인하고 재배포해주세요.",
    API_KEY_EXPIRED:
      "Google 서버용 API 키가 만료되었습니다. 서버용 키를 갱신해주세요.",
    API_KEY_NOT_FOUND:
      "Google 서버용 API 키를 찾을 수 없습니다. 배포 환경변수를 확인해주세요.",
    SERVICE_DISABLED:
      "Google Places API (New)가 허용되지 않았습니다. 장소 서비스 설정을 확인해주세요.",
    API_KEY_SERVICE_BLOCKED:
      "서버용 키에 Google Places API (New)가 허용되지 않았습니다.",
    BILLING_DISABLED: "Google 장소 서비스의 결제 설정을 확인해주세요.",
    BILLING_NOT_ACTIVE: "Google 장소 서비스의 결제 설정을 확인해주세요.",
    QUOTA_EXCEEDED:
      "Google 장소 서비스의 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
    RESOURCE_EXHAUSTED:
      "Google 장소 서비스의 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
    PERMISSION_DENIED:
      "Google 장소 서비스의 접근 권한이 없습니다. 배포된 서버용 키의 API·접근·결제 설정을 확인해주세요.",
    UNAUTHENTICATED:
      "Google 서버용 API 키 인증에 실패했습니다. 배포 환경변수를 확인해주세요.",
    NOT_FOUND:
      "Google에서 이 장소를 찾을 수 없습니다. 정확한 지점을 다시 검색해 연결해주세요.",
    INVALID_ARGUMENT:
      "Google 장소 요청을 처리하지 못했습니다. 검색어나 장소 연결을 확인해주세요.",
  };
  return {
    code,
    message:
      messages[code] ??
      (httpStatus === 429
        ? messages.RESOURCE_EXHAUSTED
        : "Google 장소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."),
  };
}
export function googleErrorMessage(body: unknown): string {
  return googleErrorInfo(body).message;
}
