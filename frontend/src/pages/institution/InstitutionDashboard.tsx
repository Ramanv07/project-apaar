import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Upload, AlertTriangle, Users, BookOpen, ShieldCheck, ArrowRight } from 'lucide-react';

const FALLBACK_CURRENT_INSTITUTION = {
  id: "1",
  aicte_id: "1-10998877",
  name: "Institute of Technology & Advanced Management, Meerut",
  state: "Uttar Pradesh",
  region: "Northern",
  address: "NH-58, Delhi-Haridwar Bypass Road, Meerut, Uttar Pradesh 250005",
  nodal_officer_name: "Prof. Rajesh Sharma",
  nodal_officer_email: "nodal@itam-meerut.ac.in",
  nodal_officer_phone_masked: "+91 ******3456",
  status: "FLAGGED",
  review_score: 65,
  review_reasons: [
    "40 students share identical mobile hash (+91 ******3456)",
    "Course IT exceeded regular approved intake by 13 admissions"
  ],
  total_approved_intake: 240,
  total_enrolled: 268,
  unconfirmed_rate: 18.2,
  open_flags_count: 2,
  programmes: [
    {
      id: "p1",
      programme_name: "Engineering & Technology",
      course_name: "B.Tech Computer Science & Engineering",
      level: "Undergraduate",
      approved_intake: 120,
      supernumerary_cap_percent: 20,
      nri_quota_percent: 5,
      is_nba_accredited: true,
      enrolled_count: 138,
      supernumerary_enrolled: 18,
      unconfirmed_count: 12,
      disputed_count: 1
    },
    {
      id: "p2",
      programme_name: "Engineering & Technology",
      course_name: "B.Tech Information Technology",
      level: "Undergraduate",
      approved_intake: 60,
      supernumerary_cap_percent: 20,
      nri_quota_percent: 5,
      is_nba_accredited: false,
      enrolled_count: 73,
      supernumerary_enrolled: 13,
      unconfirmed_count: 8,
      disputed_count: 0
    },
    {
      id: "p3",
      programme_name: "Engineering & Technology",
      course_name: "B.Tech Mechanical Engineering",
      level: "Undergraduate",
      approved_intake: 60,
      supernumerary_cap_percent: 20,
      nri_quota_percent: 5,
      is_nba_accredited: false,
      enrolled_count: 57,
      supernumerary_enrolled: 2,
      unconfirmed_count: 4,
      disputed_count: 0
    }
  ]
};

export const InstitutionDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [institution, setInstitution] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstitutionData();
  }, [user]);

  const fetchInstitutionData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/institutions/current');
      if (res.data && res.data.name && Array.isArray(res.data.programmes)) {
        setInstitution(res.data);
      } else {
        setInstitution(FALLBACK_CURRENT_INSTITUTION);
      }
    } catch (err) {
      console.warn('Failed to load institution profile, using fallback:', err);
      setInstitution(FALLBACK_CURRENT_INSTITUTION);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-400 dark:text-zinc-500 font-mono text-sm">
        Loading institutional compliance records...
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="statutory-alert-box danger text-xs">
        No institution record found associated with this nodal officer account.
      </div>
    );
  }

  const totalIntake = institution.programmes.reduce((acc: number, p: any) => acc + p.approved_intake, 0);
  const totalEnrolled = institution.programmes.reduce((acc: number, p: any) => acc + p.enrolled_count, 0);
  const utilPercent = totalIntake ? Math.round((totalEnrolled / totalIntake) * 100) : 0;
  const isOverIntake = totalEnrolled > totalIntake * 1.15;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white tracking-tight font-display">
            {institution.name}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            AICTE ID: <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold">{institution.aicte_id}</span> • State: {institution.state} ({institution.region} Region)
          </p>
        </div>
        <div>
          <button
            onClick={() => navigate('/upload-admissions')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Admissions</span>
          </button>
        </div>
      </div>

      {/* Institutional Compliance Status Banner */}
      <div className="bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold font-display">
              Nodal Officer
            </div>
            <div className="text-base font-bold text-zinc-950 dark:text-white font-display mt-0.5">
              {institution.nodal_officer_name}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {institution.nodal_officer_email} • Contact: <span className="font-mono">{institution.nodal_officer_phone_masked}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[11px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
                Review Score
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight text-zinc-950 dark:text-white">
                <span className={institution.review_score >= 60 ? 'text-rose-600 dark:text-rose-400' : institution.review_score >= 35 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                  {institution.review_score}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal ml-1">/ 100</span>
              </div>
            </div>
            <StatusBadge label={(institution.status || 'COMPLIANT').replace(/_/g, ' ')} code={institution.status || 'COMPLIANT'} />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Approved Regular Intake"
          value={totalIntake.toLocaleString()}
          subtext="Approved by AICTE Council"
        />
        <StatCard
          title="Enrolled Admissions"
          value={totalEnrolled.toLocaleString()}
          subtext={`${utilPercent}% Intake Utilisation`}
          trend={`${utilPercent}%`}
          isPositive={!isOverIntake}
        />
        <StatCard
          title="Unconfirmed Rate"
          value={`${institution.unconfirmed_rate}%`}
          subtext="Two-Key Confirmation Grace Period"
          trend={institution.unconfirmed_rate > 30 ? 'Scrutiny' : 'Normal'}
          isPositive={institution.unconfirmed_rate <= 30}
        />
        <StatCard
          title="Active Programmes"
          value={institution.programmes.length}
          subtext="Approved UG / PG Courses"
        />
      </div>

      {/* Programme Breakdown Table */}
      <div className="bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs transition-colors space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
          <h2 className="text-sm font-bold text-zinc-950 dark:text-white font-display tracking-tight">
            Departmental Intake Quota Allocation & Supernumerary Limits
          </h2>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Audited under AICTE Approval Process Handbook (2025-26)
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#121316] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3">Programme / Level</th>
                <th className="px-4 py-3">Course Name</th>
                <th className="px-4 py-3">Approved Intake</th>
                <th className="px-4 py-3">Supernumerary Limit</th>
                <th className="px-4 py-3">Actual Enrolled</th>
                <th className="px-4 py-3">Unconfirmed</th>
                <th className="px-4 py-3">Accreditation</th>
                <th className="px-4 py-3">Capacity Headroom</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-zinc-800 dark:text-zinc-200 font-normal">
              {institution.programmes.map((p: any) => {
                const superPermitted = Math.floor(p.approved_intake * (p.supernumerary_cap_percent / 100));
                const totalCeiling = p.approved_intake + superPermitted;
                const headroom = totalCeiling - p.enrolled_count;
                const isOver = headroom < 0;

                return (
                  <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-[#1f2128] transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="status-badge slate text-[10px] mr-1.5">{p.level}</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{p.programme_name}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-950 dark:text-white whitespace-nowrap">{p.course_name}</td>
                    <td className="px-4 py-3 font-mono tabular-nums">{p.approved_intake}</td>
                    <td className="px-4 py-3 font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                      +{superPermitted} ({p.supernumerary_cap_percent}%)
                    </td>
                    <td className={`px-4 py-3 font-mono font-bold tabular-nums ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-950 dark:text-white'}`}>
                      {p.enrolled_count}
                    </td>
                    <td className={`px-4 py-3 font-mono tabular-nums ${p.unconfirmed_count > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-zinc-500'}`}>
                      {p.unconfirmed_count}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge label={p.is_nba_accredited ? 'NBA Accredited' : 'Non-Accredited'} variant={p.is_nba_accredited ? 'green' : 'slate'} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`font-mono text-xs font-semibold ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isOver ? `Ceiling Breached (${headroom})` : `${headroom} seats available`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Shortcut Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => navigate('/discrepancies')}
          className="group p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#16181d] hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer transition-all shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm font-display">
              <AlertTriangle className="w-4 h-4" />
              <span>Discrepancy Resolution Queue</span>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Review pending phonetic Hindi-English transliterations and DOB mismatches requiring Nodal Officer validation.
          </p>
        </div>

        <div
          onClick={() => navigate('/students')}
          className="group p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#16181d] hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer transition-all shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-sm font-display">
              <Users className="w-4 h-4" />
              <span>Search & Manage Enrolment Records</span>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Inspect active APAAR IDs, Two-Key confirmation timestamps, and generate student verification tokens.
          </p>
        </div>
      </div>

    </div>
  );
};
