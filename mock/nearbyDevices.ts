import { NearbyDevice } from '../types';

export const MOCK_NEARBY_DEVICES: NearbyDevice[] = [
  {
    id: 'dev_john',
    name: 'John K. (Galaxy S24)',
    phone: '+256 701 444 888',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    status: 'connected',
    signalStrength: 95,
    lastSeen: 'Just now',
  },
  {
    id: 'dev_sarah',
    name: 'Sarah C. (iPhone 15 Pro)',
    phone: '+1 415 555 0192',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    status: 'searching',
    signalStrength: 82,
    lastSeen: '1m ago',
  },
  {
    id: 'dev_alex',
    name: 'Alex R. (Pixel 8)',
    phone: '+256 772 987 654',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    status: 'waiting',
    signalStrength: 68,
    lastSeen: '2m ago',
  },
];
