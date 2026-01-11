import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
    SchoolIcon,
    UserIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    PlusIcon,
    SettingsIcon,
    CheckIcon,
    AlertTriangleIcon,
    XIcon,
    SearchIcon,
    BookIcon,
    CrownIcon,
    TrashIcon,
    EditIcon,
    XCloseIcon
} from '@/components/ui/Icons'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import EditUserForm from './EditUserForm'
import ClassSubscriptionManager from './ClassSubscriptionManager'
import { toast } from '@/components/ui/ToastContainer'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function AdminUnified() {
    const utils = trpc.useUtils()
    const { data: unifiedData, isLoading, refetch } = trpc.school.getUnifiedManagementData.useQuery()

    // UI State
    const [expandedSchoolId, setExpandedSchoolId] = useState<string | null>(null)
    const [subTab, setSubTab] = useState<'classes' | 'students'>('classes')
    const [searchQuery, setSearchQuery] = useState('')

    // CRUD State
    const [isCreatingSchool, setIsCreatingSchool] = useState(false)
    const [editingSchool, setEditingSchool] = useState<any>(null)
    const [schoolFormData, setSchoolFormData] = useState({ name: '', address: '' })
    const [deleteSchoolId, setDeleteSchoolId] = useState<string | null>(null)

    const [isAddingClassToId, setIsAddingClassToId] = useState<string | null>(null)
    const [newClassName, setNewClassName] = useState('')
    const [deleteClassId, setDeleteClassId] = useState<string | null>(null)

    const [editingUser, setEditingUser] = useState<any>(null)
    const [editingSubscription, setEditingSubscription] = useState<string | null>(null)

    // Mutations
    const createSchool = trpc.school.create.useMutation({
        onSuccess: () => {
            utils.school.getUnifiedManagementData.invalidate()
            setIsCreatingSchool(false)
            setSchoolFormData({ name: '', address: '' })
            toast.success('Sekolah berhasil dibuat')
        },
        onError: (err) => toast.error(err.message)
    })

    const updateSchool = trpc.school.update.useMutation({
        onSuccess: () => {
            utils.school.getUnifiedManagementData.invalidate()
            setEditingSchool(null)
            toast.success('Sekolah berhasil diperbarui')
        },
        onError: (err) => toast.error(err.message)
    })

    const deleteSchool = trpc.school.delete.useMutation({
        onSuccess: () => {
            utils.school.getUnifiedManagementData.invalidate()
            setDeleteSchoolId(null)
            if (expandedSchoolId === deleteSchoolId) setExpandedSchoolId(null)
            toast.success('Sekolah berhasil dihapus')
        },
        onError: (err) => toast.error(err.message)
    })

    const addClass = trpc.school.addClass.useMutation({
        onSuccess: () => {
            utils.school.getUnifiedManagementData.invalidate()
            setNewClassName('')
            setIsAddingClassToId(null)
            toast.success('Kelas berhasil ditambahkan')
        },
        onError: (err) => toast.error(err.message)
    })

    const removeClass = trpc.school.removeClass.useMutation({
        onSuccess: () => {
            utils.school.getUnifiedManagementData.invalidate()
            setDeleteClassId(null)
            toast.success('Kelas berhasil dihapus')
        },
        onError: (err) => toast.error(err.message)
    })

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <LoadingSpinner size={32} />
                <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>Memuat data terpadu...</p>
            </div>
        )
    }

    const filteredSchools = unifiedData?.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getStatusBadge = (sub: any) => {
        if (!sub) return <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>-</span>

        // Status logic ( simplified from SubscriptionList )
        const now = new Date()
        const endDate = new Date(sub.subscriptionEndDate)
        const isExpired = endDate < now

        if (isExpired) {
            return (
                <span style={{
                    color: '#ef4444',
                    background: '#fee2e2',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.7rem',
                    fontWeight: 600
                }}>
                    <XIcon size={12} /> Expired
                </span>
            )
        }
        return (
            <span style={{
                color: '#10b981',
                background: '#d1fae5',
                padding: '0.125rem 0.5rem',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.7rem',
                fontWeight: 600
            }}>
                <CheckIcon size={12} /> Aktif
            </span>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header & Global Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Pusat Komando Admin</h2>
                    <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.875rem' }}>Kelola seluruh ekosistem melalui satu pintu.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '250px' }}>
                        <SearchIcon size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                        <input
                            type="text"
                            placeholder="Cari sekolah..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>
                    <button
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={() => {
                            setSchoolFormData({ name: '', address: '' })
                            setIsCreatingSchool(true)
                        }}
                    >
                        <PlusIcon size={16} /> Sekolah
                    </button>
                </div>
            </div>

            {/* Main School Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
                                <th style={{ width: '50px' }}></th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-light)', fontSize: '0.875rem' }}>Sekolah</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-light)', fontSize: '0.875rem' }}>Kelas</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-light)', fontSize: '0.875rem' }}>Siswa</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-light)', fontSize: '0.875rem' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSchools?.map((school) => (
                                <Fragment key={school.id}>
                                    <tr
                                        style={{
                                            borderBottom: '1px solid var(--border)',
                                            cursor: 'pointer',
                                            background: expandedSchoolId === school.id ? 'var(--bg-secondary)' : 'transparent',
                                            transition: 'background 0.2s'
                                        }}
                                        onClick={() => setExpandedSchoolId(expandedSchoolId === school.id ? null : school.id)}
                                    >
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ color: expandedSchoolId === school.id ? 'var(--primary)' : 'var(--text-light)' }}>
                                                {expandedSchoolId === school.id ? <ChevronDownIcon size={20} /> : <ChevronRightIcon size={20} />}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '0.75rem',
                                                    background: expandedSchoolId === school.id ? 'white' : 'var(--bg-secondary)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: expandedSchoolId === school.id ? 'var(--primary)' : 'inherit',
                                                    boxShadow: expandedSchoolId === school.id ? 'var(--shadow-sm)' : 'none'
                                                }}>
                                                    <SchoolIcon size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{school.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{school.address || 'Tanpa alamat'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span className="badge-count">{school.totalClasses}</span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span className="badge-count" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>{school.totalStudents}</span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                                <button className="btn-icon" title="Edit Sekolah" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingSchool(school);
                                                    setSchoolFormData({ name: school.name, address: school.address || '' });
                                                }}>
                                                    <EditIcon size={18} />
                                                </button>
                                                <button className="btn-icon" title="Hapus Sekolah" style={{ color: 'var(--danger)' }} onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteSchoolId(school.id);
                                                }}>
                                                    <TrashIcon size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Detail View */}
                                    {expandedSchoolId === school.id && (
                                        <tr style={{ background: 'var(--bg-secondary)' }}>
                                            <td colSpan={5} style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                                                <div style={{
                                                    background: 'white',
                                                    borderRadius: '0 0 1rem 1rem',
                                                    padding: '1.5rem',
                                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                                                    border: '1px solid var(--border)',
                                                    borderTop: 'none'
                                                }}>
                                                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                                                        <button
                                                            onClick={() => setSubTab('classes')}
                                                            style={{
                                                                padding: '0.75rem 0', background: 'none', border: 'none', cursor: 'pointer',
                                                                color: subTab === 'classes' ? 'var(--primary)' : 'var(--text-light)',
                                                                borderBottom: subTab === 'classes' ? '2px solid var(--primary)' : '2px solid transparent',
                                                                fontWeight: subTab === 'classes' ? 600 : 500,
                                                                fontSize: '0.875rem'
                                                            }}
                                                        >
                                                            Kelas & Subscription
                                                        </button>
                                                        <button
                                                            onClick={() => setSubTab('students')}
                                                            style={{
                                                                padding: '0.75rem 0', background: 'none', border: 'none', cursor: 'pointer',
                                                                color: subTab === 'students' ? 'var(--primary)' : 'var(--text-light)',
                                                                borderBottom: subTab === 'students' ? '2px solid var(--primary)' : '2px solid transparent',
                                                                fontWeight: subTab === 'students' ? 600 : 500,
                                                                fontSize: '0.875rem'
                                                            }}
                                                        >
                                                            Daftar Siswa
                                                        </button>
                                                    </div>

                                                    {subTab === 'classes' ? (
                                                        <div className="sub-section">
                                                            <div style={{ overflowX: 'auto' }}>
                                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                                    <thead>
                                                                        <tr style={{ color: 'var(--text-light)', fontSize: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                                                            <th style={{ padding: '0.75rem 0.5rem' }}>Nama Kelas</th>
                                                                            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Siswa</th>
                                                                            <th style={{ padding: '0.75rem 0.5rem' }}>Subscription</th>
                                                                            <th style={{ padding: '0.75rem 0.5rem' }}>Berakhir</th>
                                                                            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Aksi</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {school.classes.map(cls => (
                                                                            <tr key={cls.id} className="row-hover">
                                                                                <td style={{ padding: '0.75rem 0.5rem' }}>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                                        <BookIcon size={14} style={{ color: 'var(--text-light)' }} />
                                                                                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{cls.name}</span>
                                                                                        {(cls as any).isLegacy && <span className="badge-legacy">Legacy</span>}
                                                                                    </div>
                                                                                </td>
                                                                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '0.875rem' }}>{cls.userCount}</td>
                                                                                <td style={{ padding: '0.75rem 0.5rem' }}>{getStatusBadge(cls.subscription)}</td>
                                                                                <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                                                                    {cls.subscription ? format(new Date(cls.subscription.subscriptionEndDate), 'dd MMM yyyy', { locale: id }) : '-'}
                                                                                </td>
                                                                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                                                        <button
                                                                                            className="btn-action"
                                                                                            onClick={() => setEditingSubscription(cls.name)}
                                                                                        >
                                                                                            Update Subs
                                                                                        </button>
                                                                                        <button
                                                                                            className="btn-icon-small"
                                                                                            onClick={() => setDeleteClassId(cls.id)}
                                                                                            style={{ color: 'var(--danger)' }}
                                                                                        >
                                                                                            <XCloseIcon size={14} />
                                                                                        </button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>

                                                            {isAddingClassToId === school.id ? (
                                                                <form
                                                                    onSubmit={(e) => {
                                                                        e.preventDefault();
                                                                        if (newClassName.trim()) {
                                                                            addClass.mutate({ schoolId: school.id, name: newClassName });
                                                                        }
                                                                    }}
                                                                    style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}
                                                                >
                                                                    <input
                                                                        autoFocus
                                                                        type="text"
                                                                        value={newClassName}
                                                                        onChange={(e) => setNewClassName(e.target.value)}
                                                                        placeholder="Nama Kelas (cth: X RPL 1)"
                                                                        className="form-input"
                                                                        style={{ flex: 1, height: '38px', fontSize: '0.875rem' }}
                                                                    />
                                                                    <button type="submit" className="btn btn-primary btn-sm" disabled={addClass.isLoading}>
                                                                        {addClass.isLoading ? '...' : 'Simpan'}
                                                                    </button>
                                                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddingClassToId(null)}>
                                                                        Batal
                                                                    </button>
                                                                </form>
                                                            ) : (
                                                                <button className="btn-add-dashed" style={{ marginTop: '1rem' }} onClick={() => setIsAddingClassToId(school.id)}>
                                                                    <PlusIcon size={14} /> Tambah Kelas
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <SchoolStudentList schoolId={school.id} onEditUser={setEditingUser} />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals for CRUD */}
            {(isCreatingSchool || editingSchool) && (
                <div className="modal-overlay" onClick={() => { setIsCreatingSchool(false); setEditingSchool(null); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                            {editingSchool ? 'Edit Sekolah' : 'Tambah Sekolah Baru'}
                        </h3>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (editingSchool) {
                                    updateSchool.mutate({ id: editingSchool.id, ...schoolFormData });
                                } else {
                                    createSchool.mutate(schoolFormData);
                                }
                            }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                        >
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Nama Sekolah</label>
                                <input
                                    required
                                    type="text"
                                    value={schoolFormData.name}
                                    onChange={(e) => setSchoolFormData({ ...schoolFormData, name: e.target.value })}
                                    className="form-input"
                                    placeholder="Contoh: SMA Negeri 1..."
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Alamat (Opsional)</label>
                                <textarea
                                    value={schoolFormData.address}
                                    onChange={(e) => setSchoolFormData({ ...schoolFormData, address: e.target.value })}
                                    className="form-input"
                                    rows={3}
                                    placeholder="Jl. Pendidikan No. 1..."
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => { setIsCreatingSchool(false); setEditingSchool(null); }}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={createSchool.isLoading || updateSchool.isLoading}>
                                    {createSchool.isLoading || updateSchool.isLoading ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editingSubscription && (
                <div className="modal-overlay" onClick={() => setEditingSubscription(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <ClassSubscriptionManager
                            kelas={editingSubscription}
                            onSuccess={() => {
                                setEditingSubscription(null)
                                utils.school.getUnifiedManagementData.invalidate()
                            }}
                            onCancel={() => setEditingSubscription(null)}
                        />
                    </div>
                </div>
            )}

            {editingUser && (
                <div className="modal-overlay" onClick={() => setEditingUser(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: '1rem' }}>
                        <EditUserForm
                            user={editingUser}
                            onSuccess={() => {
                                setEditingUser(null)
                                utils.school.getUnifiedManagementData.invalidate()
                            }}
                            onCancel={() => setEditingUser(null)}
                        />
                    </div>
                </div>
            )}

            {/* Confirmations */}
            <ConfirmDialog
                isOpen={!!deleteSchoolId}
                title="Hapus Sekolah"
                message="Yakin ingin menghapus sekolah ini? Semua kelas dan data terkait akan ikut terhapus."
                confirmText="Hapus"
                cancelText="Batal"
                danger
                isLoading={deleteSchool.isLoading}
                onConfirm={() => deleteSchoolId && deleteSchool.mutate({ id: deleteSchoolId })}
                onCancel={() => setDeleteSchoolId(null)}
            />

            <ConfirmDialog
                isOpen={!!deleteClassId}
                title="Hapus Kelas"
                message="Yakin ingin menghapus kelas ini?"
                confirmText="Hapus"
                cancelText="Batal"
                danger
                isLoading={removeClass.isLoading}
                onConfirm={() => deleteClassId && removeClass.mutate({ classId: deleteClassId })}
                onCancel={() => setDeleteClassId(null)}
            />

            {/* Styles */}
            <style jsx>{`
        .btn-icon-small {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-light);
          padding: 0.25rem;
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .btn-icon-small:hover {
          background: #fee2e2;
          color: #ef4444;
        }
        .badge-count {
          display: inline-block;
          padding: 0.25rem 0.625rem;
          background: var(--primary);
          color: white;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 28px;
        }
        .badge-legacy {
          font-size: 10px;
          background: #fee2e2;
          color: #b91c1c;
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 600;
        }
        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-light);
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }
        .btn-icon:hover {
          background: white;
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }
        .btn-action {
          padding: 0.375rem 0.75rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-action:hover {
          background: white;
          border-color: var(--primary);
          color: var(--primary);
        }
        .btn-add-dashed {
          width: 100%;
          padding: 0.75rem;
          background: none;
          border: 2px dashed var(--border);
          border-radius: 0.75rem;
          color: var(--text-light);
          font-size: 0.875rem;
          display: flex;
          alignItems: center;
          justifyContent: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-add-dashed:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(var(--primary-rgb), 0.02);
        }
        .row-hover {
          transition: background 0.15s;
        }
        .row-hover:hover {
          background: rgba(var(--primary-rgb), 0.01);
        }
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.4);
          display: flex; alignItems: center; justifyContent: center;
          z-index: 1000;
          backdrop-filter: blur(8px);
        }
        .modal-content {
          background: var(--card);
          padding: 2rem;
          border-radius: 1.25rem;
          width: 90%;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        }
      `}</style>
        </div>
    )
}

function SchoolStudentList({ schoolId, onEditUser }: { schoolId: string, onEditUser: (user: any) => void }) {
    const { data: students, isLoading } = trpc.auth.getUsersBySchool.useQuery({ schoolId })
    const [filter, setFilter] = useState('')

    if (isLoading) return <LoadingSpinner size={24} style={{ margin: '2rem auto' }} />

    const filtered = students?.filter(s =>
        s.name.toLowerCase().includes(filter.toLowerCase()) ||
        s.email.toLowerCase().includes(filter.toLowerCase()) ||
        s.kelas?.toLowerCase().includes(filter.toLowerCase())
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
                <SearchIcon size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                    type="text"
                    placeholder="Cari nama, email, atau kelas..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.25rem', fontSize: '0.875rem', height: '36px' }}
                />
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ color: 'var(--text-light)', fontSize: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '0.75rem 0.5rem' }}>Siswa</th>
                            <th style={{ padding: '0.75rem 0.5rem' }}>Kelas</th>
                            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered?.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem 0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {user.isAdmin && <CrownIcon size={14} style={{ color: 'var(--primary)' }} />}
                                        <div>
                                            <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.875rem' }}>{user.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '0.75rem 0.5rem' }}>
                                    <span style={{ fontSize: '0.875rem' }}>{user.kelas || '-'}</span>
                                </td>
                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                    <button className="btn-icon" onClick={() => onEditUser(user)}>
                                        <SettingsIcon size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered?.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.875rem', padding: '1rem' }}>Tidak ada siswa ditemukan.</p>
                )}
            </div>
        </div>
    )
}

function Fragment({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
