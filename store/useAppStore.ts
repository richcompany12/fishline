import { create } from 'zustand';
import { MySetting, saveMySetting, loadMySetting } from '@/lib/storage';

export interface CountItem {
  id: string;
  name: string;
  count: number;
}

interface AppState {
  userId: string;
  setUserId: (id: string) => void;
  boatRatio: number;
  setBoatRatio: (v: number) => void;
  mySetting: MySetting | null;
  saveUserSetting: (setting: MySetting) => Promise<void>;
  loadUserSetting: () => Promise<void>;
  items: CountItem[];
  curId: string;
  setCurId: (id: string) => void;
  addItem: (name: string) => void;
  deleteItem: (id: string) => void;
  plusCount: (id: string) => void;
  minusCount: (id: string) => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  userId: 'guest',
  setUserId: (id) => set({ userId: id }),

  boatRatio: 60,
  setBoatRatio: (v) => set({ boatRatio: v }),

  mySetting: null,
  saveUserSetting: async (setting) => {
    const { userId } = get();
    set({ mySetting: setting });
    if (userId !== 'guest') await saveMySetting(userId, setting);
  },
  loadUserSetting: async () => {
    const { userId } = get();
    if (userId === 'guest') return;
    const setting = await loadMySetting(userId);
    if (setting) set({ mySetting: setting });
  },

  items: [
    { id: '1', name: '갑오징어', count: 0 },
    { id: '2', name: '쭈꾸미', count: 0 },
  ],
  curId: '1',
  setCurId: (id) => set({ curId: id }),

  addItem: (name) => {
    const id = Date.now().toString();
    set(state => ({
      items: [...state.items, { id, name, count: 0 }],
      curId: id,
    }));
  },

  deleteItem: (id) => {
    set(state => ({
      items: state.items.filter(i => i.id !== id),
      curId: state.curId === id
        ? state.items.find(i => i.id !== id)?.id || ''
        : state.curId,
    }));
  },

  plusCount: (id) => set(state => ({
    items: state.items.map(i =>
      i.id === id ? { ...i, count: i.count + 1 } : i
    ),
  })),

  minusCount: (id) => set(state => ({
    items: state.items.map(i =>
      i.id === id && i.count > 0 ? { ...i, count: i.count - 1 } : i
    ),
  })),

  resetAll: () => set(state => ({
    items: state.items.map(i => ({ ...i, count: 0 })),
  })),
}));