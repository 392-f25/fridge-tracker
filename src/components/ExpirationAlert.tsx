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
    <div style={{ marginBottom: '32px' }}>
      {criticalWarnings.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '3px solid #fecaca',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '16px',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            background: 'var(--critical-red)',
            opacity: 0.1,
            borderRadius: '50%'
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px',
            position: 'relative'
          }}>
            <span style={{ fontSize: '32px', marginRight: '12px' }}>🚨</span>
            <h3 style={{
              margin: 0,
              color: '#dc2626',
              fontSize: '20px',
              fontWeight: '700',
              letterSpacing: '-0.02em'
            }}>
              Critical Alerts
            </h3>
          </div>

          <ul style={{
            margin: '12px 0 0 0',
            paddingLeft: '24px',
            color: '#991b1b',
            position: 'relative'
          }}>
            {criticalWarnings.map(warning => (
              <li key={warning.item.id} style={{
                marginBottom: '8px',
                fontSize: '15px',
                lineHeight: '1.5'
              }}>
                <strong style={{ fontWeight: '700' }}>{warning.item.name}</strong>{' '}
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
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '3px solid #fde68a',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            background: 'var(--warning-orange)',
            opacity: 0.1,
            borderRadius: '50%'
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px',
            position: 'relative'
          }}>
            <span style={{ fontSize: '32px', marginRight: '12px' }}>⏰</span>
            <h3 style={{
              margin: 0,
              color: '#d97706',
              fontSize: '20px',
              fontWeight: '700',
              letterSpacing: '-0.02em'
            }}>
              Expiring Soon
            </h3>
          </div>

          <ul style={{
            margin: '12px 0 0 0',
            paddingLeft: '24px',
            color: '#92400e',
            position: 'relative'
          }}>
            {otherWarnings.map(warning => (
              <li key={warning.item.id} style={{
                marginBottom: '8px',
                fontSize: '15px',
                lineHeight: '1.5'
              }}>
                <strong style={{ fontWeight: '700' }}>{warning.item.name}</strong> expires in {warning.daysUntilExpiration} day
                {warning.daysUntilExpiration !== 1 ? 's' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
