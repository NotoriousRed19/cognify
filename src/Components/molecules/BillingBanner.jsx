import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function BillingBanner({ subscription }) {
  if (!subscription || subscription.plan_status !== 'ACTIVE') return null;
  if (!subscription.next_billing_date) return null;

  const nextBilling = new Date(subscription.next_billing_date);
  const now = new Date();
  const diffTime = nextBilling - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 0 && diffDays <= 5) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md shadow-sm">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800 font-medium">
              Tu plan vencerá en {diffDays} días.{' '}
              <a 
                href="https://wa.me/584246270071?text=Hola,%20deseo%20renovar%20mi%20plan%20en%20Cognify"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold hover:text-yellow-900"
              >
                Contacta a administración
              </a>
              {' '}para renovarlo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
