import { useState } from 'react'
import { Copy, Network, Check, Flag, ArrowUpRight } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { DUPLICATE_DETECTOR_LABELS } from '@/utils/constants'
import type { DuplicateDetector, Severity } from '@/types'

interface ClusterItem {
  id: string
  status: 'OPEN' | 'CONFIRMED' | 'LEGITIMATE' | 'ESCALATED'
  severity: Severity
  detector: DuplicateDetector
  similarity: number
  members: Array<{ institution: string; document: string; app: string }>
  detail: string
}

const initialClusters: ClusterItem[] = [
  {
    id: 'cluster-001',
    status: 'OPEN',
    severity: 'HIGH',
    detector: 'D1',
    similarity: 100,
    members: [
      { institution: 'Sample College of Engineering, Pune (INST-0005)', document: 'Fire Safety NOC', app: 'APP-2026-0005' },
      { institution: 'Sample Technical Academy, Lucknow (INST-0006)', document: 'Fire Safety NOC', app: 'APP-2026-0006' },
    ],
    detail: 'Exact file SHA-256 match. Same 1.2 MB PDF uploaded under two different institutions.',
  },
  {
    id: 'cluster-002',
    status: 'OPEN',
    severity: 'HIGH',
    detector: 'D4',
    similarity: 100,
    members: [
      { institution: 'Sample Institute, Hyderabad (INST-0008)', document: 'Fee Payment Proof', app: 'APP-2026-0008' },
      { institution: 'Sample Polytechnic, Chennai (INST-0009)', document: 'Fee Payment Proof', app: 'APP-2026-0009' },
    ],
    detail: 'Same transaction reference TXN-2026-88432 used in fee payment proofs for two different institutions.',
  },
  {
    id: 'cluster-003',
    status: 'OPEN',
    severity: 'HIGH',
    detector: 'D5',
    similarity: 96,
    members: [
      { institution: 'Sample Engineering College, Mumbai (INST-0002)', document: 'Computer Lab Photo', app: 'APP-2026-0002' },
      { institution: 'Sample Institute, Delhi (INST-0004)', document: 'Computer Lab Photo', app: 'APP-2026-0004' },
    ],
    detail: 'pHash Hamming distance 3. ORB matching: 47 inliers with RANSAC. Same photo with minor cropping.',
  },
  {
    id: 'cluster-004',
    status: 'OPEN',
    severity: 'HIGH',
    detector: 'D4',
    similarity: 100,
    members: [
      { institution: 'Sample Technical Institute, Kolkata (INST-0007)', document: 'Faculty List', app: 'APP-2026-0007' },
      { institution: 'Sample Engineering Academy, Jaipur (INST-0010)', document: 'Faculty List', app: 'APP-2026-0010' },
    ],
    detail: 'Faculty ID FAC-2024-0891 (Dr. Priya Menon, CSE) listed at both institutions in the same cycle.',
  },
]

export default function DuplicatesPage() {
  const { success, warning, info } = useToast()
  const [clusters, setClusters] = useState<ClusterItem[]>(initialClusters)

  const handleUpdateStatus = (clusterId: string, newStatus: ClusterItem['status']) => {
    setClusters(prev => prev.map(c => c.id === clusterId ? { ...c, status: newStatus } : c))
    if (newStatus === 'CONFIRMED') {
      warning('Duplicate Confirmed', `Cluster ${clusterId.split('-')[1]} confirmed as multi-institutional reuse.`)
    } else if (newStatus === 'LEGITIMATE') {
      success('Marked Legitimate', `Cluster ${clusterId.split('-')[1]} marked as legitimate shared entity / common facility.`)
    } else {
      info('Escalated', `Cluster ${clusterId.split('-')[1]} escalated for state directorate inspection.`)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Copy className="w-7 h-7 text-primary-500" />
          Cross-Institution Duplicate Detection
        </h1>
        <p className="text-sm text-slate-500 mt-1">Multi-layer detection (SHA-256, pHash, MinHash, and Faculty ID overlap)</p>
      </div>

      <div className="space-y-4">
        {clusters.map(cluster => (
          <GlassCard key={cluster.id}>
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                  <Network className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Cluster {cluster.id.split('-')[1]}</h3>
                    <Badge variant="severity" severity={cluster.severity} />
                    <Badge label={DUPLICATE_DETECTOR_LABELS[cluster.detector]} />
                    <span className="text-xs text-slate-400 font-semibold">Similarity: {cluster.similarity}%</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      cluster.status === 'CONFIRMED' ? 'bg-red-500 text-white' :
                      cluster.status === 'LEGITIMATE' ? 'bg-emerald-500 text-white' :
                      cluster.status === 'ESCALATED' ? 'bg-amber-500 text-white' :
                      'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {cluster.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{cluster.detail}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Flag className="w-4 h-4" />}
                  onClick={() => handleUpdateStatus(cluster.id, 'CONFIRMED')}
                >
                  Confirm Duplicate
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Check className="w-4 h-4" />}
                  onClick={() => handleUpdateStatus(cluster.id, 'LEGITIMATE')}
                >
                  Legitimate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ArrowUpRight className="w-4 h-4" />}
                  onClick={() => handleUpdateStatus(cluster.id, 'ESCALATED')}
                >
                  Escalate
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cluster.members.map((member, i) => (
                <div key={i} className="px-4 py-3 rounded-2xl bg-white/20 dark:bg-slate-800/20 border border-white/10 dark:border-slate-700/15">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{member.institution}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{member.document}</p>
                  <p className="text-xs text-primary-500 font-mono font-medium mt-0.5">{member.app}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
