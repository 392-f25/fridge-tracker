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
    <div className="mb-8">
      {criticalWarnings.length > 0 && (
        <div className="bg-gradient-to-br from-[#fef2f2] to-[#fee2e2] border-[3px] border-[#fecaca] rounded-2xl p-6 mb-4 shadow-[0_4px_16px_rgba(239,68,68,0.15)] relative overflow-hidden">
          <div className="absolute -top-5 -right-5 w-[100px] h-[100px] bg-[var(--critical-red)] opacity-10 rounded-full" />

          <div className="flex items-center mb-3 relative">
            <span className="text-3xl mr-3">🚨</span>
            <h3 className="m-0 text-[#dc2626] text-xl font-bold tracking-tight">
              Critical Alerts
            </h3>
          </div>

          <ul className="m-0 mt-3 pl-6 text-[#991b1b] relative">
            {criticalWarnings.map(warning => (
              <li key={warning.item.id} className="mb-2 text-[15px] leading-relaxed">
                <strong className="font-bold">{warning.item.name}</strong>{' '}
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
        <div className="bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] border-[3px] border-[#fde68a] rounded-2xl p-6 shadow-[0_4px_16px_rgba(245,158,11,0.15)] relative overflow-hidden">
          <div className="absolute -top-5 -right-5 w-[100px] h-[100px] bg-[var(--warning-orange)] opacity-10 rounded-full" />

          <div className="flex items-center mb-3 relative">
            <span className="text-3xl mr-3">⏰</span>
            <h3 className="m-0 text-[#d97706] text-xl font-bold tracking-tight">
              Expiring Soon
            </h3>
          </div>

          <ul className="m-0 mt-3 pl-6 text-[#92400e] relative">
            {otherWarnings.map(warning => (
              <li key={warning.item.id} className="mb-2 text-[15px] leading-relaxed">
                <strong className="font-bold">{warning.item.name}</strong> expires in {warning.daysUntilExpiration} day
                {warning.daysUntilExpiration !== 1 ? 's' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
