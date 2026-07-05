import { create } from "zustand";
import { SyncState, SyncStatus, UserProfile } from "@/lib/sync/types";

interface SyncStoreState extends SyncState {
  setStatus: (status: SyncStatus) => void;
  setLastSyncAt: (lastSyncAt: string | null) => void;
  setError: (error: string | null) => void;
  setIsOnline: (isOnline: boolean) => void;
  setPendingCount: (pendingCount: number) => void;
  setProfile: (profile: UserProfile | null) => void;
  reset: () => void;
}

const initialState: SyncState = {
  status: "idle",
  lastSyncAt: null,
  error: null,
  isOnline: true,
  pendingCount: 0,
  profile: null,
};

export const useSyncStore = create<SyncStoreState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  setError: (error) => set({ error }),
  setIsOnline: (isOnline) => set({ isOnline }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setProfile: (profile) => set({ profile }),
  reset: () => set(initialState),
}));
