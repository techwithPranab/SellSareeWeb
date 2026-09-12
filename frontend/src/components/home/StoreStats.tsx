'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, Users } from 'lucide-react';
import { settingService, type StoreStats as StoreStatsData } from '@/services/setting.service';

export default function StoreStats() {
  const [stats, setStats] = useState<StoreStatsData | null>(null);

  useEffect(() => {
    let active = true;
    settingService.getStoreStats()
      .then(({ stats }) => { if (active) setStats(stats); })
      .catch(() => { /* Keep unavailable statistics hidden. */ });
    return () => { active = false; };
  }, []);

  if (!stats) return null;

  return (
    <section className="border-b border-border bg-white py-10 md:py-14" aria-labelledby="store-stats-title">
      <div className="container-custom text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">The PP’s Aura family</p>
        <h2 id="store-stats-title" className="mt-2 font-playfair text-2xl font-bold text-foreground md:text-3xl">
          A part of your saree stories
        </h2>
        <dl className="mx-auto mt-8 grid max-w-2xl grid-cols-2 divide-x divide-border">
          {[
            { label: 'Sarees Sold', value: stats.sareesSold, icon: ShoppingBag },
            { label: 'Customers Served', value: stats.customersServed, icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center px-3">
              <Icon className="mb-3 h-6 w-6 text-primary" aria-hidden="true" />
              <dt className="order-last mt-2 text-sm text-muted-foreground">{label}</dt>
              <dd className="font-playfair text-3xl font-bold tabular-nums text-primary md:text-5xl">
                {value.toLocaleString('en-IN')}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-xs text-muted-foreground">Based on delivered orders. Every customer counted once.</p>
      </div>
    </section>
  );
}
