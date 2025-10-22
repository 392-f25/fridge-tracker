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
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#10b981';
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
        border: `2px solid ${getSeverityColor()}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
            {item.name}
          </h3>
          <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
            <span style={{ marginRight: '16px' }}>
              📦 {item.quantity} {item.unit}
            </span>
            <span>🏷️ {item.category}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>
            <div>Purchased: {formatDate(item.purchaseDate)}</div>
            <div
              style={{
                color: getSeverityColor(),
                fontWeight: '600',
                marginTop: '4px',
              }}
            >
              {getExpirationText()}
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(item.id)}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#dc2626')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#ef4444')}
        >
          Remove
        </button>
      </div>
    </div>
  );
};
