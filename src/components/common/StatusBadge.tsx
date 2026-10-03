import React from 'react';
import { ReportStatus } from '../../types/reports';
import { AlertCircle, Clock, CheckCircle2, Archive } from 'lucide-react';

interface StatusBadgeProps {
  status: ReportStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'NEW':
        return {
          label: 'NEW',
          subLabel: 'Bagong Pasok',
          bg: 'bg-amber-50 border-amber-300 text-amber-900',
          icon: AlertCircle,
          dotColor: 'bg-amber-500',
        };
      case 'PROCESSING':
        return {
          label: 'PROCESSING',
          subLabel: 'Kasalukuyang Inaaksyunan',
          bg: 'bg-blue-50 border-blue-300 text-blue-900',
          icon: Clock,
          dotColor: 'bg-blue-600',
        };
      case 'COMPLETED':
        return {
          label: 'COMPLETED',
          subLabel: 'Tapos Na',
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
          icon: CheckCircle2,
          dotColor: 'bg-emerald-600',
        };
      case 'ARCHIVED':
        return {
          label: 'ARCHIVED',
          subLabel: 'Naka-archive',
          bg: 'bg-slate-100 border-slate-300 text-slate-700',
          icon: Archive,
          dotColor: 'bg-slate-500',
        };
      default:
        return {
          label: status,
          subLabel: '',
          bg: 'bg-slate-100 border-slate-300 text-slate-700',
          icon: AlertCircle,
          dotColor: 'bg-slate-400',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-md border select-none ${
        isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${config.bg} ${className}`}
      title={`Status: ${config.label} (${config.subLabel})`}
    >
      <Icon className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};
