export const MOCK_DELAY_MS = 120;

export async function mockDelay(ms: number = MOCK_DELAY_MS): Promise<void> {
  if (ms <= 0) return;
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
