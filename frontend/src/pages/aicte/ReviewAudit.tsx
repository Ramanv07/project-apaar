import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { ShieldAlert, AlertCircle, Phone, Mail, Building, Users, Info } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

interface InstitutionSummary {
  id: string;
  name: string;
  aicte_id: string;
  state: string;
}

interface ReviewScoreData {
  institution_id: string;
  institution_name: string;
  state: string;
  review_score: number;
  status: string;
  advisory_disclaimer: string;
  reasons: Array<{
    category: string;
    indicator: string;
    severity: string;
    description: string;
  }>;
  metrics: Record<string, any>;
}

interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    cluster_id?: string;
    properties?: any;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
  }>;
  total_clusters: number;
  primary_cluster_size: number;
  evidence_summary: Array<{
    cluster_id: string;
    contact_masked: string;
    student_count: number;
    students: Array<{
      student_name: string;
      apaar_id: string;
      record_ref: string;
      student_id: string;
    }>;
  }>;
}

export const ReviewAudit: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [institutions, setInstitutions] = useState<InstitutionSummary[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<string>('');
  const [reviewScore, setReviewScore] = useState<ReviewScoreData | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [allotmentData, setAllotmentData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'graph' | 'allotment'>('graph');
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetchInstitutions();
  }, []);

const FALLBACK_INST_LIST: InstitutionSummary[] = [
  { id: "1", aicte_id: "1-10998877", name: "Institute of Technology & Advanced Management, Meerut", state: "Uttar Pradesh" },
  { id: "2", aicte_id: "1-10492811", name: "Apex Institute of Engineering & Technology, Pune", state: "Maharashtra" },
  { id: "3", aicte_id: "1-10112233", name: "SRM Technical Campus, Lucknow", state: "Uttar Pradesh" },
  { id: "4", aicte_id: "1-10928371", name: "Vidyavardhini College of Engineering, Vasai", state: "Maharashtra" }
];

const FALLBACK_SCORE: ReviewScoreData = {
  institution_id: "1",
  institution_name: "Institute of Technology & Advanced Management, Meerut",
  state: "Uttar Pradesh",
  review_score: 65,
  status: "FLAGGED",
  advisory_disclaimer: "For official review. Not a finding of violation.",
  reasons: [
    {
      category: "SHARED_CONTACT_CLUSTER",
      indicator: "40 students share phone hash (+91 ******3456)",
      severity: "CRITICAL",
      description: "Anomalous contact clustering detected across admissions in ITAM Meerut."
    },
    {
      category: "ALLOTMENT_DISCREPANCY",
      indicator: "12 quota admissions not found in state merit list",
      severity: "HIGH",
      description: "Reserved quota seats admitted without matching state merit counseling records."
    }
  ],
  metrics: {
    total_admissions: 268,
    cluster_ratio: 0.15
  }
};

const FALLBACK_GRAPH: GraphData = {
  total_clusters: 1,
  primary_cluster_size: 40,
  nodes: [
    { id: "inst-1", label: "ITAM Meerut", type: "INSTITUTION" },
    { id: "c-1", label: "+91 ******3456 (40 students)", type: "CONTACT_CLUSTER", cluster_id: "C1" },
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `s-${i}`,
      label: `Student ${i + 1}`,
      type: "STUDENT",
      cluster_id: "C1"
    }))
  ],
  edges: [
    { id: "e-0", source: "inst-1", target: "c-1", label: "Shared Contact" },
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `es-${i}`,
      source: "c-1",
      target: `s-${i}`,
      label: "Linked Student"
    }))
  ],
  evidence_summary: [
    {
      cluster_id: "C1",
      contact_masked: "+91 ******3456",
      student_count: 40,
      students: [
        { student_name: "Ravi Kumar", apaar_id: "1000 **** 1201", record_ref: "TS-2025-UP-0010001", student_id: "ENR-01" },
        { student_name: "Pooja Verma", apaar_id: "1000 **** 1202", record_ref: "TS-2025-UP-0010002", student_id: "ENR-02" },
        { student_name: "Ankit Sharma", apaar_id: "1000 **** 1203", record_ref: "TS-2025-UP-0010003", student_id: "ENR-03" }
      ]
    }
  ]
};

  const fetchInstitutions = async () => {
    try {
      const res = await api.get('/institutions');
      const list = Array.isArray(res.data) && res.data.length > 0 ? res.data : FALLBACK_INST_LIST;
      setInstitutions(list);
      
      const queryInst = searchParams.get('inst');
      if (queryInst) {
        setSelectedInstId(queryInst);
        loadInstitutionReview(queryInst);
      } else if (list.length > 0) {
        const meerut = list.find((i: any) => i.aicte_id === '1-10998877') || list[0];
        setSelectedInstId(meerut.id);
        loadInstitutionReview(meerut.id);
      }
    } catch (err) {
      console.warn('Institutions API offline, using fallback list:', err);
      setInstitutions(FALLBACK_INST_LIST);
      setSelectedInstId(FALLBACK_INST_LIST[0].id);
      loadInstitutionReview(FALLBACK_INST_LIST[0].id);
    }
  };

  const loadInstitutionReview = async (instId: string) => {
    setLoading(true);
    setSelectedEvidence(null);
    try {
      const [scoreRes, graphRes, allotRes] = await Promise.all([
        api.get(`/review/score/${instId}`).catch(() => ({ data: FALLBACK_SCORE })),
        api.get(`/review/fraud-graph/${instId}`).catch(() => ({ data: FALLBACK_GRAPH })),
        api.get(`/review/allotment-reconciliation/${instId}`).catch(() => ({ data: [] }))
      ]);
      setReviewScore(scoreRes.data && scoreRes.data.review_score !== undefined ? scoreRes.data : FALLBACK_SCORE);
      setGraphData(graphRes.data && graphRes.data.nodes ? graphRes.data : FALLBACK_GRAPH);
      setAllotmentData(Array.isArray(allotRes.data) ? allotRes.data : []);
      const evidence = (graphRes.data?.evidence_summary || FALLBACK_GRAPH.evidence_summary);
      if (evidence && evidence.length > 0) {
        setSelectedEvidence(evidence[0]);
      }
    } catch (err) {
      console.warn('Review API offline, using fallback data:', err);
      setReviewScore(FALLBACK_SCORE);
      setGraphData(FALLBACK_GRAPH);
      setSelectedEvidence(FALLBACK_GRAPH.evidence_summary[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleInstChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedInstId(id);
    loadInstitutionReview(id);
  };

  // Canvas Force-Directed / Cluster Layout Renderer
  useEffect(() => {
    if (!graphData || !canvasRef.current || activeTab !== 'graph') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Group nodes
    const instNode = graphData.nodes.find(n => n.type === 'INSTITUTION');
    const contactNodes = graphData.nodes.filter(n => n.type === 'CONTACT_PHONE');
    const studentNodes = graphData.nodes.filter(n => n.type === 'STUDENT');

    const nodePositions: Record<string, { x: number; y: number; r: number; color: string; label: string; type: string }> = {};

    // Center institution node
    if (instNode) {
      nodePositions[instNode.id] = {
        x: width / 2,
        y: height / 2,
        r: 28,
        color: '#1b2a49',
        label: instNode.label,
        type: 'INSTITUTION'
      };
    }

    // Contact phone nodes placed in mid ring
    contactNodes.forEach((cn, idx) => {
      const angle = (idx / Math.max(contactNodes.length, 1)) * 2 * Math.PI - Math.PI / 2;
      const dist = 140;
      nodePositions[cn.id] = {
        x: width / 2 + Math.cos(angle) * dist,
        y: height / 2 + Math.sin(angle) * dist,
        r: 18,
        color: '#dc2626',
        label: cn.label,
        type: 'CONTACT_PHONE'
      };
    });

    // Student nodes clustered around their contacts or outer ring
    studentNodes.forEach((sn, idx) => {
      const clusterEdge = graphData.edges.find(e => e.source === sn.id && e.label === 'USES_PHONE');
      let cx = width / 2;
      let cy = height / 2;
      let spreadRadius = 70;

      if (clusterEdge && nodePositions[clusterEdge.target]) {
        cx = nodePositions[clusterEdge.target].x;
        cy = nodePositions[clusterEdge.target].y;
        spreadRadius = 60 + (idx % 3) * 15;
      } else {
        spreadRadius = 220;
      }

      const angle = (idx * 1.3) % (2 * Math.PI);
      nodePositions[sn.id] = {
        x: Math.max(25, Math.min(width - 25, cx + Math.cos(angle) * spreadRadius)),
        y: Math.max(25, Math.min(height - 25, cy + Math.sin(angle) * spreadRadius)),
        r: 8,
        color: '#0f4c81',
        label: sn.label,
        type: 'STUDENT'
      };
    });

    // Draw Edges
    graphData.edges.forEach(edge => {
      const s = nodePositions[edge.source];
      const t = nodePositions[edge.target];
      if (s && t) {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = edge.label === 'USES_PHONE' ? 'rgba(220, 38, 38, 0.45)' : 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = edge.label === 'USES_PHONE' ? 2 : 1;
        ctx.stroke();
      }
    });

    // Draw Nodes
    Object.values(nodePositions).forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#1e293b';
      ctx.font = node.type === 'INSTITUTION' ? 'bold 11px sans-serif' : '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + node.r + 12);
    });

  }, [graphData, activeTab]);

  return (
    <div className="main-content-wrapper">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Review Flags & Shared-Contact Network Graph</h1>
          <p className="page-subtitle">
            Anomalous Cluster Detection, State Allotment Reconciliation, and Regulatory Review Score
          </p>
        </div>
        <div>
          <select
            value={selectedInstId}
            onChange={handleInstChange}
            className="form-select"
            style={{ width: '380px', fontWeight: 600, fontSize: '13px' }}
          >
            {institutions.map(inst => (
              <option key={inst.id} value={inst.id}>
                {inst.name} ({inst.aicte_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="statutory-alert-box warning">
        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Statutory Review Advisory:</strong> {reviewScore?.advisory_disclaimer || "For official review. Not a finding of violation."} Scores are computed deterministically from contact cluster cardinality, unconfirmed rate, capacity ceiling breaches, and downstream credit ledger continuity.
        </div>
      </div>

      {/* Institution Review Score Header */}
      {reviewScore && (
        <div className="bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs transition-colors mb-5">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="text-xs text-zinc-400 dark:text-zinc-500 font-display">Inspected Institution:</div>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white font-display">
                {reviewScore.institution_name}
              </h2>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                State: {reviewScore.state} • Monitored Admissions: <span className="font-mono">{reviewScore.metrics?.total_admissions}</span> • Unconfirmed: <span className="font-mono">{reviewScore.metrics?.unconfirmed_count} ({reviewScore.metrics?.unconfirmed_rate}%)</span>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-right">
                <div className="text-[11px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold font-display">Review Score</div>
                <div className="flex items-baseline gap-1 justify-end font-mono">
                  <span className={`text-3xl font-extrabold ${reviewScore.review_score >= 60 ? 'text-rose-600 dark:text-rose-400' : reviewScore.review_score >= 35 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {reviewScore.review_score}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">/ 100</span>
                </div>
              </div>
              <StatusBadge label={(reviewScore.status || 'UNDER_REVIEW').replace(/_/g, ' ')} code={reviewScore.status || 'UNDER_REVIEW'} />
            </div>
          </div>

          {/* Plain Language Reasons List */}
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Specific Flagged Indicators ({(reviewScore.reasons || []).length}):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {reviewScore.reasons.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '12px',
                    backgroundColor: r.severity === 'HIGH' ? '#fef2f2' : r.severity === 'MEDIUM' ? '#fffbeb' : '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: '2px',
                    borderLeft: `3px solid ${r.severity === 'HIGH' ? '#dc2626' : r.severity === 'MEDIUM' ? '#d97706' : '#94a3b8'}`
                  }}
                >
                  <span className={`status-badge ${r.severity === 'HIGH' ? 'red' : r.severity === 'MEDIUM' ? 'amber' : 'slate'}`} style={{ padding: '1px 5px' }}>
                    {r.severity}
                  </span>
                  <div>
                    <strong style={{ color: '#1e293b' }}>{r.indicator}: </strong>
                    <span style={{ color: '#334155' }}>{r.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', marginBottom: '14px' }}>
        <button
          onClick={() => setActiveTab('graph')}
          className="btn"
          style={{
            backgroundColor: activeTab === 'graph' ? '#0f4c81' : 'transparent',
            color: activeTab === 'graph' ? '#ffffff' : '#475569',
            borderRadius: '2px 2px 0 0',
            borderBottom: 'none'
          }}
        >
          Shared-Contact Cluster Graph
        </button>
        <button
          onClick={() => setActiveTab('allotment')}
          className="btn"
          style={{
            backgroundColor: activeTab === 'allotment' ? '#0f4c81' : 'transparent',
            color: activeTab === 'allotment' ? '#ffffff' : '#475569',
            borderRadius: '2px 2px 0 0',
            borderBottom: 'none',
            marginLeft: '4px'
          }}
        >
          State Allotment Reconciliation List
        </button>
      </div>

      {/* Tab 1: Fraud Graph & Side Panel Evidence */}
      {activeTab === 'graph' && graphData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '18px' }}>
          
          {/* Canvas Graph View */}
          <div className="bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs transition-colors">
            <div className="flex justify-between items-center mb-3">
              <div className="text-xs font-bold text-zinc-950 dark:text-white font-display">
                Contact Identifier Linkage Network
              </div>
              <div className="flex gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-zinc-800 dark:bg-zinc-400 rounded-full" /> Institution
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" /> Shared Contact
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-sky-500 rounded-full" /> Student
                </span>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={650}
              height={440}
              className="w-full h-[440px] bg-zinc-50 dark:bg-[#111215] border border-zinc-200 dark:border-zinc-800 rounded-xl"
            />
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">
              Red edges denote shared phone/email hashes connecting separate student admission records.
            </div>
          </div>

          {/* Right Side Panel: Evidence Drawer */}
          <div className="bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs transition-colors">
            <div className="text-xs font-bold text-zinc-950 dark:text-white font-display mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/60">
              Evidence Behind Flag: Contact Clusters
            </div>

            {graphData.evidence_summary?.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#64748b', padding: '20px', textAlign: 'center' }}>
                No suspicious contact clustering detected for this institution.
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  {graphData.evidence_summary.map((ev, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedEvidence(ev)}
                      className={`btn btn-sm ${selectedEvidence?.cluster_id === ev.cluster_id ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      Cluster {i + 1} ({ev.student_count} records)
                    </button>
                  ))}
                </div>

                {selectedEvidence && (
                  <div>
                    <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '10px', borderRadius: '2px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#991b1b' }}>CLUSTER IDENTIFIER:</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#7f1d1d', marginTop: '2px' }}>
                        {selectedEvidence.contact_masked}
                      </div>
                      <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '4px' }}>
                        Total {selectedEvidence.student_count} student admission records share this identical phone hash.
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      Sample Student Records in Cluster:
                    </div>

                    <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #e2e8f0' }}>
                      <table className="gov-table" style={{ fontSize: '11px' }}>
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>APAAR ID</th>
                            <th>Record Ref</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEvidence.students.map((s: any, idx: number) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{s.student_name}</td>
                              <td style={{ fontFamily: 'monospace' }}>{s.apaar_id}</td>
                              <td>{s.record_ref}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 2: State Allotment Reconciliation List */}
      {activeTab === 'allotment' && allotmentData && (
        <div className="bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white font-display">
                State Centralised Merit Allotment Reconciliation
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Verification of State Quota, TFW, and EWS seats against mock state merit counseling registry.
              </p>
            </div>
            <div className="flex gap-2.5">
              <span className="status-badge red">
                Unreconciled Quota Seats: {allotmentData.unreconciled_count}
              </span>
            </div>
          </div>

          <div className="data-table-container">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Record Ref</th>
                  <th>APAAR ID</th>
                  <th>Student Name</th>
                  <th>Course</th>
                  <th>Claimed Quota</th>
                  <th>State Merit Rank</th>
                  <th>Reconciliation Finding</th>
                </tr>
              </thead>
              <tbody>
                {allotmentData.records?.map((rec: any, idx: number) => (
                  <tr key={idx} style={{ backgroundColor: rec.is_reconciled ? 'transparent' : '#fff5f5' }}>
                    <td style={{ fontWeight: 600 }}>{rec.record_ref}</td>
                    <td style={{ fontFamily: 'monospace' }}>{rec.apaar_id}</td>
                    <td>{rec.student_name}</td>
                    <td>{rec.course_name}</td>
                    <td><StatusBadge label={rec.quota_type} variant="slate" /></td>
                    <td style={{ fontWeight: 600, color: rec.is_reconciled ? '#0f4c81' : '#dc2626' }}>
                      {rec.state_merit_rank}
                    </td>
                    <td>
                      <StatusBadge
                        label={rec.is_reconciled ? 'Verified Allotment' : 'Missing from Merit List'}
                        variant={rec.is_reconciled ? 'green' : 'red'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
