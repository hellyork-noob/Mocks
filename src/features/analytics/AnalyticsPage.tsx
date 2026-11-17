import { useEffect, useState } from 'react';
import { BarChart3, PlusCircle } from 'lucide-react';
import type { Mock, Exam, CustomExamProfile } from '../../data/types';
import DashboardPriorities from './DashboardPriorities';
import DetailedMetrics from './DetailedMetrics';

export default function AnalyticsPage({ mocks, exams, exam, onAdd, profile, onChange }: {
  mocks: Mock[]; exams: Exam[]; exam: string; onAdd: () => void;
  profile?: CustomExamProfile; onChange: () => void;
}) {
  const [providerFilter, setProviderFilter] = useState('All');
  const openKey = `aa_metrics_open_${encodeURIComponent(exam)}`;
  const [open, setOpen] = useState(() => localStorage.getItem(openKey) !== 'false');
  useEffect(() => { setOpen(localStorage.getItem(openKey) !== 'false'); }, [openKey]);
  const examMocks = mocks.filter(mock => mock.exam === exam);
  const providers = [...new Set(examMocks.map(mock => mock.provider?.trim() || 'Unspecified'))].sort();
  const provider = providerFilter === 'All' || providers.includes(providerFilter) ? providerFilter : 'All';
  const selected = examMocks.filter(mock => provider === 'All' || (mock.provider?.trim() || 'Unspecified') === provider);
  const toggle = (value: boolean) => { setOpen(value); localStorage.setItem(openKey, String(value)); };
  const explore = () => {
    toggle(true);
    requestAnimationFrame(() => {
      const details = document.getElementById('detailed-performance-metrics');
      details?.scrollIntoView({ block: 'start' });
      details?.querySelector('summary')?.focus({ preventScroll: true });
    });
  };
  return <div className="p3-analytics">
    <div className="analyticsbar">
      <div><span className="eyebrow">{exam} | PERFORMANCE INTELLIGENCE</span><h2>Advanced analytics</h2></div>
      <div className="toolbar">
        <label className="v21-analytics-provider">Provider<select aria-label="Filter analytics by provider" value={provider} onChange={event => setProviderFilter(event.target.value)}><option value="All">All providers</option>{providers.map(value => <option key={value}>{value}</option>)}</select></label>
        <button type="button" className="secondary metrics-jump" onClick={explore}><BarChart3 size={16}/> Detailed metrics</button>
        <button type="button" className="primary" onClick={onAdd}><PlusCircle size={16}/> Add mock</button>
      </div>
    </div>
    <DashboardPriorities mocks={selected} exams={exams} exam={exam} profile={profile} onChange={onChange}/>
    <DetailedMetrics key={exam} mocks={examMocks} exam={exam} profile={profile} provider={provider} providers={providers} onProviderChange={setProviderFilter} open={open} onOpenChange={toggle} onAdd={onAdd}/>
  </div>;
}
