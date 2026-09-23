import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/routePaths';
import { endpoints } from '../../utils/endpoints';
import client from '../../utils/client';
import { useFetchAPI } from '../../hooks/useFetchAPI';
import type { ApiSuccess } from '@brainx/shared';

type Step = 1 | 2 | 3;

interface ProfileMe {
  full_name: string | null;
}

const features = [
  { title: 'AI Agents', description: 'Orchestrate intelligent agents for your workflows.' },
  { title: 'Role Management', description: 'Invite teammates and control access by role.' },
  { title: 'Analytics', description: 'Track usage and performance at a glance.' },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [fullName, setFullName] = useState('');

  const { data: profile } = useFetchAPI<void, ProfileMe>({
    apiFunction: () =>
      client
        .get<ApiSuccess<ProfileMe>>(endpoints.auth.me)
        .then((r) => ({ ...r, data: r.data.data })),
    apiCallCondition: true,
    dependencyArray: [],
    hideErrorMessage: true,
  });

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  const [saveTrigger, setSaveTrigger] = useState(0);
  const { isLoading: isSaving } = useFetchAPI<void, void>({
    apiFunction: () =>
      client
        .patch<ApiSuccess<void>>(endpoints.auth.me, { full_name: fullName })
        .then((r) => ({ ...r, data: undefined })),
    apiCallCondition: saveTrigger > 0,
    dependencyArray: [saveTrigger],
    errorMessage: 'Failed to save your name. Please try again.',
    successCb: () => setStep(2),
  });

  const [completeTrigger, setCompleteTrigger] = useState(0);
  const { isLoading: isCompleting } = useFetchAPI<void, void>({
    apiFunction: () =>
      client
        .patch<ApiSuccess<void>>(endpoints.onboarding.complete)
        .then((r) => ({ ...r, data: undefined })),
    apiCallCondition: completeTrigger > 0,
    dependencyArray: [completeTrigger],
    errorMessage: 'Something went wrong. Please try again.',
    successCb: () => navigate(ROUTES.dashboard, { replace: true }),
  });

  if (step === 1) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600">
          Step 1 of 3
        </p>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Profile Setup</h1>

        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="full-name">
          Full Name
        </label>
        <input
          id="full-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
          className="mb-6 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <button
          onClick={() => setSaveTrigger((t) => t + 1)}
          disabled={!fullName.trim() || isSaving}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-brand-700 transition-colors"
        >
          {isSaving ? 'Saving…' : 'Next'}
        </button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600">
          Step 2 of 3
        </p>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Explore Features</h1>
        <p className="mb-6 text-sm text-gray-500">Here's what BrainX can do for you.</p>

        <ul className="mb-8 space-y-4">
          {features.map((f) => (
            <li key={f.title} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="font-semibold text-gray-800">{f.title}</p>
              <p className="text-sm text-gray-500">{f.description}</p>
            </li>
          ))}
        </ul>

        <button
          onClick={() => setStep(3)}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          Next
        </button>
        <button
          onClick={() => setCompleteTrigger((t) => t + 1)}
          disabled={isCompleting}
          className="mt-2 w-full text-center text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          Skip
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600">
        Step 3 of 3
      </p>
      <h1 className="mb-3 text-2xl font-bold text-gray-900">All Set!</h1>
      <p className="mb-8 text-sm text-gray-500">You're ready to start using BrainX.</p>

      <button
        onClick={() => setCompleteTrigger((t) => t + 1)}
        disabled={isCompleting}
        className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-brand-700 transition-colors"
      >
        {isCompleting ? 'Loading…' : 'Go to Dashboard'}
      </button>
    </div>
  );
};

export default OnboardingPage;
