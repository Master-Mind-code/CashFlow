export interface SecurgenScanner {
  scanCard(): Promise<string>;
  scanFingerprint(): Promise<{ success: boolean; score: number }>;
}

export const mockSecurgen: SecurgenScanner = {
  scanCard: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // Simulate reading a specific account number from a card
    return 'ACC-123-456-789';
  },
  scanFingerprint: async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Simulate a successful biometric match
    return { success: true, score: 0.98 };
  },
};
