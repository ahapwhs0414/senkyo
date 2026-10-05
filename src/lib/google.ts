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
