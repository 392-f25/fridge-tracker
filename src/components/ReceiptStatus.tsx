import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database, useAuthState } from '../utils/firebase';

interface Receipt {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  itemCount?: number;
  error?: string;
  store?: string;
  date?: string;
}

export default function ReceiptStatus() {
  const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);
  const { user } = useAuthState();

  useEffect(() => {
    if (!user) return;

    const processedRef = ref(database, 'receipts/processed');
    const failedRef = ref(database, 'receipts/failed');

    // Listen for processed receipts
    const processedListener = onValue(processedRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const receipts = Object.entries(data)
          .filter(([_, receipt]: [string, any]) => receipt.userId === user.uid)
          .map(([id, receipt]: [string, any]) => ({
            id,
            status: 'completed' as const,
            itemCount: receipt.itemCount,
            store: receipt.store,
            date: receipt.date
          }))
          .slice(0, 5); // Show last 5 receipts

        setRecentReceipts(prev => {
          const failed = prev.filter(r => r.status === 'failed');
          return [...receipts, ...failed];
        });
      }
    });

    // Listen for failed receipts
    const failedListener = onValue(failedRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const receipts = Object.entries(data)
          .filter(([_, receipt]: [string, any]) => receipt.userId === user.uid)
          .map(([id, receipt]: [string, any]) => ({
            id,
            status: 'failed' as const,
            error: receipt.error
          }))
          .slice(0, 5);

        setRecentReceipts(prev => {
          const completed = prev.filter(r => r.status === 'completed');
          return [...completed, ...receipts];
        });
      }
    });

    return () => {
      off(processedRef, 'value', processedListener);
      off(failedRef, 'value', failedListener);
    };
  }, [user]);

  if (recentReceipts.length === 0) return null;

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <h3 className="text-lg font-bold mb-3 text-[#0f172a]">Recent Receipts</h3>
      <div className="space-y-2">
        {recentReceipts.map((receipt) => (
          <div
            key={receipt.id}
            className={`p-3 rounded-xl border-2 ${
              receipt.status === 'completed'
                ? 'border-[#10b981] bg-[#10b981]/10'
                : receipt.status === 'failed'
                ? 'border-[#ef4444] bg-[#ef4444]/10'
                : 'border-[#fb923c] bg-[#fb923c]/10'
            }`}
          >
            {receipt.status === 'completed' && (
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium text-[#0f172a]">
                    {receipt.itemCount} items added
                  </span>
                  {receipt.store && (
                    <span className="text-sm text-[#475569] ml-2">
                      from {receipt.store}
                    </span>
                  )}
                </div>
                <span className="text-[#10b981] text-sm">✓</span>
              </div>
            )}
            {receipt.status === 'failed' && (
              <div>
                <span className="font-medium text-[#ef4444]">Processing failed</span>
                <p className="text-sm text-[#475569] mt-1">{receipt.error}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
