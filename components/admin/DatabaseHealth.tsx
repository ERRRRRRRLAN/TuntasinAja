'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function DatabaseHealth() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tables' | 'cleanup'>('overview')
  const [refreshing, setRefreshing] = useState(false)

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.database.getStats.useQuery(undefined, {
    refetchInterval: 60000, // Refetch every minute
  })

  const { data: tableSizes, isLoading: sizesLoading, refetch: refetchSizes } = trpc.database.getTableSizes.useQuery(undefined, {
    refetchInterval: 60000,
  })

  const { data: dbSize, isLoading: dbSizeLoading, refetch: refetchDbSize } = trpc.database.getDatabaseSize.useQuery(undefined, {
    refetchInterval: 60000,
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchStats(), refetchSizes(), refetchDbSize()])
    setRefreshing(false)
  }

  const isLoading = statsLoading || sizesLoading || dbSizeLoading

  // Calculate database usage percentage (assuming 500MB limit for Supabase free tier)
  const getUsagePercentage = (sizeStr: string): number => {
    if (!sizeStr || sizeStr === 'Unknown') return 0
    const sizeMB = parseFloat(sizeStr.replace(/[^\d.]/g, ''))
    if (sizeStr.includes('GB')) {
      return Math.min((sizeMB * 1024 / 500) * 100, 100)
    }
    return Math.min((sizeMB / 500) * 100, 100)
  }

  const usagePercentage = dbSize ? getUsagePercentage(dbSize) : 0
  const isWarning = usagePercentage >= 80
  const isDanger = usagePercentage >= 90

  if (isLoading) {
    return (
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <LoadingSpinner />
          <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>
            Memuat data database...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <h3 style={{
          marginTop: 0,
          marginBottom: 0,
          fontSize: '1.25rem',
          fontWeight: 600,
        }}>
          💾 Database Health & Monitoring
        </h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            opacity: refreshing ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          {refreshing ? 'Memuat...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Database Size Alert */}
      {dbSize && dbSize !== 'Unknown' && (
        <div style={{
          padding: '1rem',
          backgroundColor: isDanger
            ? 'rgba(239, 68, 68, 0.1)'
            : isWarning
            ? 'rgba(245, 158, 11, 0.1)'
            : 'rgba(59, 130, 246, 0.1)',
          border: `1px solid ${
            isDanger
              ? 'rgba(239, 68, 68, 0.3)'
              : isWarning
              ? 'rgba(245, 158, 11, 0.3)'
              : 'rgba(59, 130, 246, 0.3)'
          }`,
          borderRadius: '8px',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <div>
              <strong style={{ color: 'var(--text)' }}>
                {isDanger ? '⚠️ Database Size Warning!' : isWarning ? '⚠️ Database Size Alert' : '📊 Database Size'}
              </strong>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                Total Size: <strong>{dbSize}</strong> / 500 MB (Supabase Free Tier Limit)
              </div>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: isDanger ? 'var(--danger)' : isWarning ? '#f59e0b' : 'var(--primary)' }}>
              {usagePercentage.toFixed(1)}%
            </div>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginTop: '0.5rem',
          }}>
            <div style={{
              width: `${Math.min(usagePercentage, 100)}%`,
              height: '100%',
              backgroundColor: isDanger ? 'var(--danger)' : isWarning ? '#f59e0b' : 'var(--primary)',
              transition: 'width 0.3s ease',
            }} />
          </div>
          {isWarning && (
            <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              {isDanger
                ? '🚨 Database hampir penuh! Segera lakukan cleanup atau upgrade plan.'
                : '⚠️ Database sudah mencapai 80% kapasitas. Pertimbangkan untuk melakukan cleanup.'}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid var(--border)',
        overflowX: 'auto',
      }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'overview' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'overview' ? 'white' : 'var(--text-light)',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'overview' ? 600 : 400,
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            marginBottom: '-2px',
            whiteSpace: 'nowrap',
          }}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'tables' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'tables' ? 'white' : 'var(--text-light)',
            border: 'none',
            borderBottom: activeTab === 'tables' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'tables' ? 600 : 400,
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            marginBottom: '-2px',
            whiteSpace: 'nowrap',
          }}
        >
          📋 Table Statistics
        </button>
        <button
          onClick={() => setActiveTab('cleanup')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'cleanup' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'cleanup' ? 'white' : 'var(--text-light)',
            border: 'none',
            borderBottom: activeTab === 'cleanup' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'cleanup' ? 600 : 400,
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            marginBottom: '-2px',
            whiteSpace: 'nowrap',
          }}
        >
          🧹 Cleanup Recommendations
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && stats && (
        <div>
          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>
                Total Rows
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text)' }}>
                {stats.summary.totalRows.toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>
                Total Tables
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text)' }}>
                {stats.summary.totalTables}
              </div>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>
                Database Size
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text)' }}>
                {dbSize || 'Unknown'}
              </div>
            </div>
          </div>

          {/* Oldest Records */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 600 }}>
              📅 Oldest Records
            </h4>
            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
              {stats.oldestRecords.user && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-light)' }}>Oldest User:</span>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                    {format(new Date(stats.oldestRecords.user), 'd MMMM yyyy', { locale: id })}
                  </span>
                </div>
              )}
              {stats.oldestRecords.thread && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-light)' }}>Oldest Thread:</span>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                    {format(new Date(stats.oldestRecords.thread), 'd MMMM yyyy', { locale: id })}
                  </span>
                </div>
              )}
              {stats.oldestRecords.history && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-light)' }}>Oldest History:</span>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                    {format(new Date(stats.oldestRecords.history), 'd MMMM yyyy', { locale: id })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tables' && stats && (
        <div>
          {/* Table Sizes (if available) */}
          {tableSizes && tableSizes.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
                📏 Table Sizes (PostgreSQL)
              </h4>
              <div style={{
                overflowX: 'auto',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                        Table Name
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>
                        Rows
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>
                        Table Size
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>
                        Total Size
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableSizes.map((table, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', color: 'var(--text)' }}>
                          {table.tableName}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text)' }}>
                          {table.rowCount.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text)' }}>
                          {table.tableSize}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text)', fontWeight: 500 }}>
                          {table.totalSize}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Row Counts */}
          <div>
            <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
              📊 Row Counts per Table
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}>
              {stats.tableStats.map((table, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>
                    {table.name}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
                    {table.count.toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cleanup' && stats && (
        <div>
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px',
            fontSize: '0.875rem',
            color: 'var(--text-light)',
            marginBottom: '1.5rem',
          }}>
            <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text)' }}>
              ℹ️ Catatan:
            </strong>
            <p style={{ margin: 0 }}>
              Rekomendasi cleanup ini membantu menghemat space database. Pastikan untuk backup data sebelum melakukan cleanup.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Old History */}
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: stats.cleanupRecommendations.oldHistory > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                  📜 History &gt; 30 Hari
                </h4>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: stats.cleanupRecommendations.oldHistory > 0 ? '#f59e0b' : 'var(--text-light)',
                }}>
                  {stats.cleanupRecommendations.oldHistory.toLocaleString('id-ID')}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-light)' }}>
                History yang lebih dari 30 hari dapat dihapus untuk menghemat space. Data ini sudah tersimpan di history dan tidak diperlukan untuk operasi normal.
              </p>
            </div>

            {/* Inactive Threads */}
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: stats.cleanupRecommendations.inactiveThreads > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                  📝 Thread Tidak Aktif &gt; 90 Hari
                </h4>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: stats.cleanupRecommendations.inactiveThreads > 0 ? '#f59e0b' : 'var(--text-light)',
                }}>
                  {stats.cleanupRecommendations.inactiveThreads.toLocaleString('id-ID')}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-light)' }}>
                Thread yang tidak pernah dikomentari dan tidak pernah diselesaikan oleh siapa pun, lebih dari 90 hari, dapat dihapus.
              </p>
            </div>

            {/* Orphaned User Statuses */}
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: stats.cleanupRecommendations.orphanedUserStatuses > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                  🔗 Orphaned User Statuses
                </h4>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: stats.cleanupRecommendations.orphanedUserStatuses > 0 ? 'var(--danger)' : 'var(--text-light)',
                }}>
                  {stats.cleanupRecommendations.orphanedUserStatuses.toLocaleString('id-ID')}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-light)' }}>
                User statuses yang merujuk ke thread atau comment yang sudah tidak ada. Data ini dapat dihapus dengan aman.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

