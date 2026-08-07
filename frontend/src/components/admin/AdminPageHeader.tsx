import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { asRoute } from '@/utils/helpers';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  action?: React.ReactNode;
}

export default function AdminPageHeader({ title, description, backHref, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        {backHref && (
          <Link
            href={asRoute(backHref)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
        )}
        <h1 className="font-playfair text-2xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
