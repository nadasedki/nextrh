import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CertificationStatus } from '@/types';

interface StatusBadgeProps {
  status: CertificationStatus;
  className?: string;
  showDot?: boolean;
}

const statusConfig: Record<CertificationStatus, { label: string; className: string; dotColor: string }> = {
  active: {
    label: 'Active',
    className: 'bg-success/10 text-success hover:bg-success/20 border-success/20',
    dotColor: 'bg-success',
  },
  expiring_soon: {
    label: 'Expiring Soon',
    className: 'bg-warning/10 text-warning hover:bg-warning/20 border-warning/20',
    dotColor: 'bg-warning',
  },
  expired: {
    label: 'Expired',
    className: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20',
    dotColor: 'bg-destructive',
  },
  unknown: {
    label: 'Unknown',
    className: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    dotColor: 'bg-slate-500',
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, showDot = true }) => {
  // 1. Normalize the status (handle uppercase from backend and null values)
  const normalizedStatus = (status?.toLowerCase() || 'unknown') as string;

  // 2. Safely get the config or use the 'unknown' fallback
  const config = statusConfig[normalizedStatus] || statusConfig.unknown;
  return (
    <Badge variant="outline" className={cn('font-medium', config.className, className)}>
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', config.dotColor)} />}
      {config.label === 'Unknown' ? status : config.label}
    </Badge>
  );
};

export default StatusBadge;
