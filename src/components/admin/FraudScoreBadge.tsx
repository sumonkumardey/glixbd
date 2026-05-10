import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, ShieldX, Info } from 'lucide-react';
import { checkCustomerFraud, FraudStats } from '@/src/services/fraudService';
import { cn } from '@/src/lib/utils';

export default function FraudScoreBadge({ phone }: { phone: string }) {
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (phone) {
      checkCustomerFraud(phone).then(res => {
        setStats(res);
        setLoading(false);
      });
    }
  }, [phone]);

  if (loading) return <div className="w-16 h-4 bg-gray-100 animate-pulse rounded"></div>;
  if (!stats || stats.totalOrders === 0) return (
    <div className="flex items-center gap-1 text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
      <Info size={10} />
      NEW CUSTOMER
    </div>
  );

  const colors = {
    low: "bg-green-50 text-green-600 border-green-100",
    medium: "bg-amber-50 text-amber-600 border-amber-100",
    high: "bg-red-50 text-red-600 border-red-100"
  };

  const Icons = {
    low: <ShieldCheck size={10} />,
    medium: <ShieldAlert size={10} />,
    high: <ShieldX size={10} />
  };

  const labels = {
    low: "Low Risk",
    medium: "Moderate Risk",
    high: "High Risk (Fraud?)"
  };

  return (
    <div className={cn(
      "flex flex-col gap-1 inline-flex",
    )}>
      <div className={cn(
        "flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-sm",
        colors[stats.riskLevel]
      )}>
        {Icons[stats.riskLevel]}
        {labels[stats.riskLevel]}
      </div>
      <div className="text-[8px] font-bold text-text-muted px-1">
        Orders: {stats.totalOrders} | Success: {Math.round(stats.successRate)}% | Cancelled: {stats.cancelledCount}
      </div>
    </div>
  );
}
