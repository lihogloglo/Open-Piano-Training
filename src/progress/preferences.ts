import { z } from 'zod';
const score = z.number().min(0).max(1);
export const preferencesSchema = z
  .object({
    theme: z.enum(['dark', 'light', 'system']),
    onboarded: z.boolean(),
    deviceId: z.string().nullable(),
    audioEnabled: z.boolean(),
    masterVolume: score,
    metronomeVolume: score,
    dailyMinutes: z.number().int().min(5).max(60),
    latencyOffsetMs: z.number().finite().min(-500).max(500),
    sidebarExpanded: z.boolean(),
    readStrandEnabled: z.boolean(),
    reducedMotion: z.boolean(),
    largePractice: z.boolean().optional(),
    creativeFocus: z.enum(['melody', 'rhythm', 'harmony']).optional(),
  })
  .partial();

export function readPreferences(): z.infer<typeof preferencesSchema> {
  try {
    return preferencesSchema.parse(JSON.parse(localStorage.getItem('ks.settings.v1') ?? '{}'));
  } catch {
    return {};
  }
}
