import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createFirCase, listFirCases, type CaseListItem } from '../../api/fir';
import Icon from '../../components/Icon';
import { useDocumentTitle } from '../../useDocumentTitle';

/**
 * FIR Assistant home page.
 *
 * Explains what the FIR Assistant does, allows starting a new case,
 * and shows recent cases. Clearly distinguished from Legal Research.
 */
export default function FirHomePage() {
  useDocumentTitle('FIR Assistant');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: recentCases, isLoading: loadingCases } = useQuery({
    queryKey: ['fir-cases'],
    queryFn: () => listFirCases(10),
    staleTime: 30_000,
  });

  async function startNewCase() {
    setStarting(true);
    setError(null);
    try {
      const data = await createFirCase('en');
      window.location.href = `/fir/case/${data.case_id}`;
    } catch (err: any) {
      setError(err?.message ?? 'Could not create a new case. Please try again.');
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-stone-400 mb-3">
          <Link to="/" className="hover:text-maroon-700 transition-colors">Home</Link>
          <Icon name="chevronRight" size={12} />
          <span>FIR Assistant</span>
        </div>
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
          FIR Intake Assistant
        </h1>
        <p className="mt-2 text-sm text-stone-600 max-w-2xl">
          An AI-assisted chatbot that helps you describe an incident in your own words and
          organises the information into a structured case record. It asks follow-up questions
          where important details are missing.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="mb-8 rounded-lg border border-gold-200 bg-gold-50 p-4">
        <p className="flex items-start gap-2 text-xs text-gold-700">
          <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
          <span>
            <strong>Academic prototype.</strong> This assistant organises information you provide.
            It does not determine guilt, does not replace the police or a lawyer, and any legal
            classification must be independently verified before official submission.
          </span>
        </p>
      </div>

      {/* How it works */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-stone-700 mb-3">How it works</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: 'chat' as const, title: 'Describe the incident', desc: 'Tell the assistant what happened in your own words.' },
            { icon: 'search' as const, title: 'Answer questions', desc: 'The assistant asks follow-up questions to fill in important details.' },
            { icon: 'document' as const, title: 'Review the summary', desc: 'Review the structured information before confirming.' },
            { icon: 'summary' as const, title: 'Confirm and download', desc: 'Confirm the record and download the structured JSON.' },
          ].map((step) => (
            <div key={step.title} className="flex items-start gap-3 rounded-lg border border-stone-200 bg-white p-3">
              <Icon name={step.icon} size={16} className="mt-0.5 text-maroon-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-stone-800">{step.title}</p>
                <p className="text-xs text-stone-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Start button */}
      <div className="mb-8">
        <button
          onClick={startNewCase}
          disabled={starting}
          className="inline-flex items-center gap-2 rounded-md bg-maroon-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-maroon-700 disabled:opacity-50"
        >
          <Icon name="chat" size={15} />
          {starting ? 'Starting…' : 'Start a new FIR case'}
        </button>
        {error && (
          <p className="mt-3 rounded-md border border-vermilion-200 bg-vermilion-50 p-3 text-sm text-vermilion-700">
            {error}
          </p>
        )}
      </div>

      {/* Recent cases */}
      {recentCases && recentCases.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-stone-700 mb-3">Recent cases</h2>
          <ul className="space-y-2">
            {recentCases.map((c: CaseListItem) => (
              <li key={c.case_id}>
                <Link
                  to={`/fir/case/${c.case_id}`}
                  className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3 transition-colors hover:border-terracotta-300"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-800">{c.case_id}</p>
                    <p className="text-xs text-stone-400">
                      Created {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                  <StatusPill status={c.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loadingCases && (
        <p className="text-sm text-stone-500">Loading recent cases…</p>
      )}

      {/* Separator from Legal Research */}
      <div className="mt-10 border-t border-stone-200 pt-6">
        <p className="text-xs text-stone-400">
          The FIR Assistant is a separate feature from Legal Research. Information you provide
          here is not shared with the legal search, case analysis, or citation tools.
        </p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    in_progress: 'bg-gold-50 text-gold-700 border-gold-200',
    awaiting_confirmation: 'bg-navy-50 text-navy-600 border-navy-200',
    complete: 'bg-sage-50 text-sage-700 border-sage-200',
  };
  const labels: Record<string, string> = {
    in_progress: 'In progress',
    awaiting_confirmation: 'Awaiting review',
    complete: 'Confirmed',
  };
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium ${styles[status] || 'bg-stone-100 text-stone-600 border-stone-300'}`}>
      {labels[status] || status}
    </span>
  );
}
