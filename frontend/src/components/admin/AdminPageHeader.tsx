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
    <div className="mb-5 flex flex-col items-stretch justify-between gap-4 sm:mb-6 sm:flex-row sm:items-start">
      <div className="min-w-0">
        {backHref && (
          <Link
            href={asRoute(backHref)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
        )}
        <h1 className="break-words font-playfair text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="w-full shrink-0 [&>*]:w-full sm:w-auto sm:[&>*]:w-auto">{action}</div>}
    </div>
  );
}
