// 📁 src/constants/bookingSteps.ts
export const bookingStepKeys = [
  'timeline.steps.0',
  'timeline.steps.1',
  'timeline.steps.2',
  'timeline.steps.3',
] as const;

export type BookingStepKey = (typeof bookingStepKeys)[number];
