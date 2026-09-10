import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { networkService } from '@/services/networkService';
import type { NetworkStateInfo } from '@/services/networkService';
import { useIsMounted } from '@/hooks/useIsMounted';

const initial: NetworkStateInfo = {
  status: 'unknown',
  isConnected: false,
  isInternetReachable: null,
};

export function useNetworkStatus(): NetworkStateInfo {
  const [state, setState] = useState<NetworkStateInfo>(initial);
  const isMounted = useIsMounted();

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      const next = await networkService.getState();
      if (active && isMounted()) setState(next);
    };

    refresh();

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refresh();
    });

    return () => {
      active = false;
      sub.remove();
    };
  }, [isMounted]);

  return state;
}
