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

  const fetchInstitutions = async () => {
    try {
      const res = await api.get('/institutions');
      setInstitutions(res.data);
      
      const queryInst = searchParams.get('inst');
      if (queryInst) {
        setSelectedInstId(queryInst);
        loadInstitutionReview(queryInst);
      } else if (res.data.length > 0) {
        // Default to Meerut (Planted cluster institution)
        const meerut = res.data.find((i: any) => i.aicte_id === '1-10998877') || res.data[0];
        setSelectedInstId(meerut.id);
        loadInstitutionReview(meerut.id);
      }
    } catch (err) {
      console.error('Failed to load institutions:', err);
    }
  };

  const loadInstitutionReview = async (instId: string) => {
    setLoading(true);
    setSelectedEvidence(null);
    try {
      const [scoreRes, graphRes, allotRes] = await Promise.all([
        api.get(`/review/score/${instId}`),
        api.get(`/review/fraud-graph/${instId}`),
        api.get(`/review/allotment-reconciliation/${instId}`)
      ]);
      setReviewScore(scoreRes.data);
      setGraphData(graphRes.data);
      setAllotmentData(allotRes.data);
      if (graphRes.data.evidence_summary?.length > 0) {
        setSelectedEvidence(graphRes.data.evidence_summary[0]);
      }
    } catch (err) {
      console.error('Failed to load review data:', err);
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
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Inspected Institution:</div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                {reviewScore.institution_name}
              </h2>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                State: {reviewScore.state} | Monitored Admissions: {reviewScore.metrics?.total_admissions} | Unconfirmed: {reviewScore.metrics?.unconfirmed_count} ({reviewScore.metrics?.unconfirmed_rate}%)
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Review Score</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: reviewScore.review_score >= 60 ? '#dc2626' : reviewScore.review_score >= 35 ? '#d97706' : '#15803d' }}>
                    {reviewScore.review_score}
                  </span>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>/ 100</span>
                </div>
              </div>
              <StatusBadge label={reviewScore.status.replace(/_/g, ' ')} code={reviewScore.status} />
            </div>
          </div>

          {/* Plain Language Reasons List */}
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Specific Flagged Indicators ({reviewScore.reasons.length}):
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
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                Contact Identifier Linkage Network
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#64748b' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: '#1b2a49', borderRadius: '50%' }} /> Institution
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: '#dc2626', borderRadius: '50%' }} /> Shared Contact
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: '#0f4c81', borderRadius: '50%' }} /> Student
                </span>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={650}
              height={440}
              style={{ width: '100%', height: '440px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '2px' }}
            />
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Red edges denote shared phone/email hashes connecting separate student admission records.
            </div>
          </div>

          {/* Right Side Panel: Evidence Drawer */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
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
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                State Centralised Merit Allotment Reconciliation
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Verification of State Quota, TFW, and EWS seats against mock state merit counseling registry.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
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
