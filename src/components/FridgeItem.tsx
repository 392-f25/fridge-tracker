import React from 'react';
import type { FridgeItem as FridgeItemType } from '../types';
import { calculateDaysUntilExpiration, formatDate, getExpirationSeverity } from '../utils/dateUtils';

interface FridgeItemProps {
  item: FridgeItemType;
  onDelete: (id: string) => void;
  onEdit: (item: FridgeItemType) => void;
}

export const FridgeItemComponent: React.FC<FridgeItemProps> = ({ item, onDelete, onEdit }) => {
  const daysUntilExpiration = calculateDaysUntilExpiration(item.expirationDate);
  const severity = getExpirationSeverity(daysUntilExpiration);

  const getSeverityClasses = () => {
    switch (severity) {
      case 'critical':
        return {
          background: 'bg-gradient-to-br from-[#fef2f2] to-[#fee2e2]',
          border: 'border-[#fecaca]',
          badge: 'bg-[var(--critical-red)]',
          text: 'text-[var(--critical-red)]'
        };
      case 'warning':
        return {
          background: 'bg-gradient-to-br from-[#fffbeb] to-[#fef3c7]',
          border: 'border-[#fde68a]',
          badge: 'bg-[var(--warning-orange)]',
          text: 'text-[var(--warning-orange)]'
        };
      default:
        return {
          background: 'bg-gradient-to-br from-[#f0fdfa] to-[#ccfbf1]',
          border: 'border-[#a7f3d0]',
          badge: 'bg-[var(--fresh-mint)]',
          text: 'text-[var(--fresh-mint)]'
        };
    }
  };

  const severityClasses = getSeverityClasses();

  const getExpirationText = () => {
    if (daysUntilExpiration < 0) {
      return `Expired ${Math.abs(daysUntilExpiration)} day${Math.abs(daysUntilExpiration) !== 1 ? 's' : ''} ago`;
    } else if (daysUntilExpiration === 0) {
      return 'Expires today!';
    } else if (daysUntilExpiration === 1) {
      return 'Expires tomorrow';
    } else {
      return `Expires in ${daysUntilExpiration} days`;
    }
  };

  return (
    <div className={`${severityClasses.background} border-2 ${severityClasses.border} rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200 relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-20 h-20 ${severityClasses.badge} opacity-10 rounded-tl-none rounded-tr-2xl rounded-bl-[100%] rounded-br-none`} />

      <div className="flex justify-between items-start relative">
        <div className="flex-1">
          <h3 className="m-0 mb-3 text-xl font-bold text-[var(--text-primary)] tracking-tight">
            {item.name}
          </h3>

          <div className="flex gap-3 mb-3 flex-wrap">
            <span className="bg-white/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] inline-flex items-center gap-1.5 border border-[var(--border-light)]">
              📦 {item.quantity} {item.unit}
            </span>
            <span className="bg-white/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] inline-flex items-center gap-1.5 border border-[var(--border-light)]">
              🏷️ {item.category}
            </span>
          </div>

          <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
            <div className="font-medium">
              Purchased: {formatDate(item.purchaseDate)}
            </div>
            <div className={`${severityClasses.text} font-bold mt-1.5 text-sm flex items-center gap-1.5`}>
              {severity === 'critical' && '🚨'}
              {severity === 'warning' && '⚠️'}
              {severity === 'info' && '✅'}
              {getExpirationText()}
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onEdit(item)}
            className="bg-gradient-to-br from-[var(--fresh-cyan)] to-[var(--cool-sky)] text-white border-none rounded-xl px-4 py-2.5 cursor-pointer text-sm font-bold shadow-[0_2px_8px_rgba(6,182,212,0.3)] transition-all duration-200 whitespace-nowrap"
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white border-none rounded-xl px-4 py-2.5 cursor-pointer text-sm font-bold shadow-[0_2px_8px_rgba(239,68,68,0.3)] transition-all duration-200 whitespace-nowrap"
          >
            🗑️ Remove
          </button>
        </div>
      </div>
    </div>
  );
};
