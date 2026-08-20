import { SapBydClient } from './types';
import { MockSapBydClient } from './MockSapBydClient';
import { RealSapBydClient } from './RealSapBydClient';

export * from './types';
export * from './MockSapBydClient';
export * from './RealSapBydClient';

/**
 * Creates and returns the active SAP ByD Client instance based on VITE_SAP_BYD_USE_MOCK.
 */
export function getSapBydClient(): SapBydClient {
  const useMock = import.meta.env.VITE_SAP_BYD_USE_MOCK !== 'false';

  if (useMock) {
    return new MockSapBydClient(450);
  }

  return new RealSapBydClient();
}

export const defaultSapBydClient = getSapBydClient();
