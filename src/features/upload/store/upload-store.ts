import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  UploadRole,
  QueuedFile,
  BucketSummary,
  FaceAnalysisResult,
} from '../types';

const BATCH_SIZE = 5;

const yieldToMain = (): Promise<void> => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, 0));
  });
};

interface UploadStore {
  // Current selected role
  activeRole: UploadRole;
  setActiveRole: (role: UploadRole) => void;

  // Upload queues for each role
  groomQueue: QueuedFile[];
  brideQueue: QueuedFile[];

  // Add files to queue (synchronous - for backward compatibility)
  addToQueue: (files: File[], role: UploadRole) => QueuedFile[];

  // Add files to queue (async with batch processing for better UI responsiveness)
  addToQueueAsync: (files: File[], role: UploadRole) => Promise<QueuedFile[]>;

  // Update queue item
  updateQueueItem: (
    id: string,
    role: UploadRole,
    updates: Partial<QueuedFile>
  ) => void;

  // Remove from queue
  removeFromQueue: (id: string, role: UploadRole) => void;

  // Clear queue
  clearQueue: (role: UploadRole) => void;

  // Get queue by role
  getQueue: (role: UploadRole) => QueuedFile[];

  // Get bucket summary
  getBucketSummary: (role: UploadRole) => BucketSummary;

  // Reset store
  reset: () => void;
}

const initialState = {
  activeRole: 'groom' as UploadRole,
  groomQueue: [] as QueuedFile[],
  brideQueue: [] as QueuedFile[],
};

export const useUploadStore = create<UploadStore>((set, get) => ({
  ...initialState,

  setActiveRole: (role) => set({ activeRole: role }),

  addToQueue: (files, role) => {
    const newItems: QueuedFile[] = files.map((file) => ({
      id: uuidv4(),
      file,
      role,
      status: 'pending' as const,
      progress: 0,
      previewUrl: URL.createObjectURL(file),
    }));

    set((state) => ({
      [role === 'groom' ? 'groomQueue' : 'brideQueue']: [
        ...state[role === 'groom' ? 'groomQueue' : 'brideQueue'],
        ...newItems,
      ],
    }));

    return newItems;
  },

  addToQueueAsync: async (files, role) => {
    if (files.length === 0) return [];

    const allItems: QueuedFile[] = [];
    const queueKey = role === 'groom' ? 'groomQueue' : 'brideQueue';

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const batchItems: QueuedFile[] = batch.map((file) => ({
        id: uuidv4(),
        file,
        role,
        status: 'pending' as const,
        progress: 0,
        previewUrl: URL.createObjectURL(file),
      }));

      allItems.push(...batchItems);

      // Incremental state update
      set((state) => ({
        [queueKey]: [...state[queueKey], ...batchItems],
      }));

      // Yield to main thread between batches (except for last batch)
      if (i + BATCH_SIZE < files.length) {
        await yieldToMain();
      }
    }

    return allItems;
  },

  updateQueueItem: (id, role, updates) => {
    const queueKey = role === 'groom' ? 'groomQueue' : 'brideQueue';
    set((state) => ({
      [queueKey]: state[queueKey].map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  },

  removeFromQueue: (id, role) => {
    const queueKey = role === 'groom' ? 'groomQueue' : 'brideQueue';
    set((state) => {
      const item = state[queueKey].find((i) => i.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return {
        [queueKey]: state[queueKey].filter((item) => item.id !== id),
      };
    });
  },

  clearQueue: (role) => {
    const queueKey = role === 'groom' ? 'groomQueue' : 'brideQueue';
    const queue = get()[queueKey];

    // Revoke all preview URLs
    queue.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    set({ [queueKey]: [] });
  },

  getQueue: (role) => {
    return role === 'groom' ? get().groomQueue : get().brideQueue;
  },

  getBucketSummary: (role) => {
    const queue = role === 'groom' ? get().groomQueue : get().brideQueue;
    const completedItems = queue.filter(
      (item) => item.status === 'completed' && item.analysis
    );

    const summary: BucketSummary = {
      bucketA: 0,
      bucketB: 0,
      bucketC: 0,
      bucketD: 0,
      total: completedItems.length,
      usableCount: 0,
    };

    completedItems.forEach((item) => {
      if (item.analysis) {
        switch (item.analysis.bucket) {
          case 'A':
            summary.bucketA++;
            break;
          case 'B':
            summary.bucketB++;
            break;
          case 'C':
            summary.bucketC++;
            break;
          case 'D':
            summary.bucketD++;
            break;
        }
      }
    });

    // Calculate usable count (A + B + C, excluding D)
    summary.usableCount = summary.bucketA + summary.bucketB + summary.bucketC;

    return summary;
  },

  reset: () => {
    const { groomQueue, brideQueue } = get();

    // Cleanup preview URLs
    [...groomQueue, ...brideQueue].forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    set(initialState);
  },
}));
