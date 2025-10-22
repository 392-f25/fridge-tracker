import React from 'react';
import type { ExpirationWarning } from '../types';

interface ExpirationAlertProps {
  warnings: ExpirationWarning[];
}

export const ExpirationAlert: React.FC<ExpirationAlertProps> = ({ warnings }) => {
  if (warnings.length === 0) {
    return null;
  }

  const criticalWarnings = warnings.filter(w => w.severity === 'critical');
  const otherWarnings = warnings.filter(w => w.severity !== 'critical');

  return (
    <div style={{ marginBottom: '24px' }}>
      {criticalWarnings.length > 0 && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>⚠️</span>
            <h3 style={{ margin: 0, color: '#dc2626', fontSize: '18px', fontWeight: '600' }}>
              Critical Alerts
            </h3>
          </div>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#991b1b' }}>
            {criticalWarnings.map(warning => (
              <li key={warning.item.id} style={{ marginBottom: '4px' }}>
                <strong>{warning.item.name}</strong>{' '}
                {warning.daysUntilExpiration < 0
                  ? `expired ${Math.abs(warning.daysUntilExpiration)} day${Math.abs(warning.daysUntilExpiration) !== 1 ? 's' : ''} ago`
                  : warning.daysUntilExpiration === 0
                  ? 'expires today!'
                  : `expires in ${warning.daysUntilExpiration} day${warning.daysUntilExpiration !== 1 ? 's' : ''}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {otherWarnings.length > 0 && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>⏰</span>
            <h3 style={{ margin: 0, color: '#d97706', fontSize: '18px', fontWeight: '600' }}>
              Expiring Soon
            </h3>
          </div>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#92400e' }}>
            {otherWarnings.map(warning => (
              <li key={warning.item.id} style={{ marginBottom: '4px' }}>
                <strong>{warning.item.name}</strong> expires in {warning.daysUntilExpiration} day
                {warning.daysUntilExpiration !== 1 ? 's' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
