import React from 'react';
import type { FridgeItem as FridgeItemType } from '../types';
import { calculateDaysUntilExpiration, formatDate, getExpirationSeverity } from '../utils/dateUtils';

interface FridgeItemProps {
  item: FridgeItemType;
  onDelete: (id: string) => void;
}

export const FridgeItemComponent: React.FC<FridgeItemProps> = ({ item, onDelete }) => {
  const daysUntilExpiration = calculateDaysUntilExpiration(item.expirationDate);
  const severity = getExpirationSeverity(daysUntilExpiration);

  const getSeverityColor = () => {
    switch (severity) {
      case 'critical':
        return 'var(--critical-red)';
      case 'warning':
        return 'var(--warning-orange)';
      default:
        return 'var(--fresh-mint)';
    }
  };

  const getSeverityBackground = () => {
    switch (severity) {
      case 'critical':
        return 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)';
      case 'warning':
        return 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)';
      default:
        return 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)';
    }
  };

  const getSeverityBorder = () => {
    switch (severity) {
      case 'critical':
        return '2px solid #fecaca';
      case 'warning':
        return '2px solid #fde68a';
      default:
        return '2px solid #a7f3d0';
    }
  };

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
    <div
      style={{
        background: getSeverityBackground(),
        border: getSeverityBorder(),
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 80,
        height: 80,
        background: getSeverityColor(),
        opacity: 0.1,
        borderRadius: '0 16px 0 100%',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', position: 'relative' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '20px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em'
          }}>
            {item.name}
          </h3>

          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '12px',
            flexWrap: 'wrap'
          }}>
            <span style={{
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--border-light)'
            }}>
              📦 {item.quantity} {item.unit}
            </span>
            <span style={{
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--border-light)'
            }}>
              🏷️ {item.category}
            </span>
          </div>

          <div style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6'
          }}>
            <div style={{ fontWeight: 500 }}>
              Purchased: {formatDate(item.purchaseDate)}
            </div>
            <div
              style={{
                color: getSeverityColor(),
                fontWeight: '700',
                marginTop: '6px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {severity === 'critical' && '🚨'}
              {severity === 'warning' && '⚠️'}
              {severity === 'info' && '✅'}
              {getExpirationText()}
            </div>
          </div>
        </div>

        <button
          onClick={() => onDelete(item.id)}
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '700',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          🗑️ Remove
        </button>
      </div>
    </div>
  );
};
