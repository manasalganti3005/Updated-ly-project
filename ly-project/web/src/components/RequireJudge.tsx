import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { canUseJudgeTools } from '../api/judge';
import { RequireAuth, useAuth } from '../auth';
import Icon from './Icon';

/**
 * Gate for the judges' research desk. Unlike RequireAuth's silent redirect, a
 * logged-in user who cannot enter is told why — a judge still awaiting
 * verification should know that is the only thing in the way.
 *
 * Convenience only: /api/judge/* enforces the same rule on the server.
 */
export default function RequireJudge({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <Gate>{children}</Gate>
    </RequireAuth>
  );
}

function Gate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (canUseJudgeTools(user)) return <>{children}</>;

  const pendingJudge = user?.role === 'judge';
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <Icon name="shield" size={28} className="mx-auto text-gold-500" />
      <h1 className="mt-3 font-serif text-xl font-semibold text-stone-900">Judges’ research desk</h1>
      <p className="mt-2 text-sm text-stone-600">
        {pendingJudge
          ? user?.verification.status === 'rejected'
            ? 'Your judge verification was not approved. Update your court details on your profile to have it reviewed again.'
            : 'Your account is waiting for an admin to verify your court details. The desk opens as soon as it is approved.'
          : 'These tools are for verified judges. Everything they draw on — judgments, citations and treatment — is open to everyone in search and on each case page.'}
      </p>
      <Link to={pendingJudge ? '/profile' : '/'} className="mt-5 inline-block text-sm font-medium text-maroon-700 hover:underline">
        {pendingJudge ? 'Go to your profile →' : 'Back to search →'}
      </Link>
    </div>
  );
}
