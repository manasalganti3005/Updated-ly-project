import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { confirmFirCase, getFirCase } from '../../api/fir';
import Icon from '../../components/Icon';
import { useDocumentTitle } from '../../useDocumentTitle';

/**
 * FIR Confirmation page.
 *
 * Provides explicit confirmation before finalization. The user must
 * actively confirm — navigation to this page is NOT confirmation.
 * Uses the FIR backend's existing confirmation mechanism.
 */
export default function FirConfirmPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  useDocumentTitle('Confirm FIR');

  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ['fir-case', caseId],
    queryFn: () => getFirCase(caseId!),
    enabled: !!caseId,
  });

  async function handleConfirm() {
    if (!caseId) return;
    setConfirming(true);
    setError(null);
    try {
      const result = await confirmFirCase(caseId, true);
      if (result.status === 'complete') {
        navigate(`/fir/case/${caseId}/output`);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Confirmation failed. Please try again.');
    } finally {
      setConfirming(false);
    }
  }

  async function handleReopen() {
    if (!caseId) return;
    setConfirming(true);
    setError(null);
    try {
      await confirmFirCase(caseId, false);
      navigate(`/fir/case/${caseId}`);
    } catch (err: any) {
      setError(err?.message ?? 'Could not reopen the case. Please try again.');
    } finally {
      setConfirming(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 text-sm text-stone-500">
        Loading case data…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="rounded-md border border-vermilion-200 bg-vermilion-50 p-3 text-sm text-vermilion-700">
          {(loadError as Error).message}
        </p>
        <Link to="/fir" className="mt-4 inline-block text-sm text-maroon-700 hover:underline">
          Back to FIR Assistant
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const state = data.case_state;
  const openContradictions = state.contradictions.filter((c) => !c.resolved);
  const missingRequired = state.missing_information.filter((m) => m.priority !== 'optional');

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-stone-400 mb-4">
        <Link to="/fir" className="hover:text-maroon-700 transition-colors">FIR Assistant</Link>
        <Icon name="chevronRight" size={12} />
        <Link to={`/fir/case/${caseId}`} className="hover:text-maroon-700 transition-colors">
          Case {caseId}
        </Link>
        <Icon name="chevronRight" size={12} />
        <span>Confirm</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">
          Confirm the Case Record
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Please review the information below. Once confirmed, the case will be marked as complete
          and the structured record will be available for download.
        </p>
      </div>

      {/* Summary */}
      <div className="mb-6 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-medium text-stone-700 mb-3">Case summary</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <div>
            <dt className="text-stone-400">Case ID</dt>
            <dd className="text-stone-700 font-mono">{state.case_id}</dd>
          </div>
          <div>
            <dt className="text-stone-400">Status</dt>
            <dd className="text-stone-700 capitalize">{state.status.replace('_', ' ')}</dd>
          </div>
          <div>
            <dt className="text-stone-400">Turns</dt>
            <dd className="text-stone-700">{state.turn_count}</dd>
          </div>
          <div>
            <dt className="text-stone-400">Completion</dt>
            <dd className="text-stone-700">{state.completion_percentage}%</dd>
          </div>
          <div>
            <dt className="text-stone-400">Accused</dt>
            <dd className="text-stone-700">{state.accused.length}</dd>
          </div>
          <div>
            <dt className="text-stone-400">Acts recorded</dt>
            <dd className="text-stone-700">{state.acts.length}</dd>
          </div>
          <div>
            <dt className="text-stone-400">Injuries</dt>
            <dd className="text-stone-700">{state.injuries.length}</dd>
          </div>
          <div>
            <dt className="text-stone-400">Evidence items</dt>
            <dd className="text-stone-700">{state.evidence.length}</dd>
          </div>
        </dl>
      </div>

      {/* Open contradictions warning */}
      {openContradictions.length > 0 && (
        <div className="mb-6 rounded-lg border border-vermilion-200 bg-vermilion-50 p-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-vermilion-700 mb-2">
            <Icon name="alert" size={15} />
            Unresolved contradictions ({openContradictions.length})
          </h2>
          <ul className="space-y-1">
            {openContradictions.map((c) => (
              <li key={c.contradiction_id} className="text-xs text-vermilion-700">
                {c.explanation}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-vermilion-600">
            These contradictions are still open. You can go back to clarify them, or proceed with
            confirmation as-is.
          </p>
        </div>
      )}

      {/* Missing information warning */}
      {missingRequired.length > 0 && (
        <div className="mb-6 rounded-lg border border-gold-200 bg-gold-50 p-4">
          <h2 className="text-sm font-medium text-gold-700 mb-2">
            Still missing ({missingRequired.length} items)
          </h2>
          <ul className="space-y-1">
            {missingRequired.slice(0, 8).map((m) => (
              <li key={m.field} className="text-xs text-gold-700">
                {m.field.replace(/_/g, ' ')} ({m.priority})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Final summary */}
      {state.final_summary && (
        <div className="mb-6 rounded-lg border border-stone-200 bg-stone-50 p-4">
          <h2 className="text-sm font-medium text-stone-700 mb-2">Review summary</h2>
          <pre className="whitespace-pre-wrap text-xs text-stone-600 font-sans leading-relaxed">
            {state.final_summary}
          </pre>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md border border-vermilion-200 bg-vermilion-50 p-3 text-sm text-vermilion-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="inline-flex items-center gap-2 rounded-md bg-maroon-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-maroon-700 disabled:opacity-50"
        >
          <Icon name="summary" size={15} />
          {confirming ? 'Confirming…' : 'Confirm — this is correct'}
        </button>
        <button
          onClick={handleReopen}
          disabled={confirming}
          className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 disabled:opacity-50"
        >
          <Icon name="back" size={15} />
          I need to correct something
        </button>
      </div>

      <p className="mt-4 text-xs text-stone-400">
        Confirmation is explicit and recorded. You can reopen the case later if needed.
      </p>
    </div>
  );
}
