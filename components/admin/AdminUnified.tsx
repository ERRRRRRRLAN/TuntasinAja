import { useState, useEffect, Fragment } from 'react'
import { createPortal } from 'react-dom'
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
import Modal from '@/components/ui/Modal'

export default function AdminUnified() {
    const utils = trpc.useUtils()
    const { data: unifiedData, isLoading } = trpc.school.getUnifiedManagementData.useQuery()

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

    // Modals are now handled by the Modal component which has internal scroll locking

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

        const now = new Date()
        const endDate = new Date(sub.subscriptionEndDate)
        const isExpired = endDate < now

        if (isExpired) {
            return (
                <span className="status-badge" style={{ color: '#be123c', background: '#fff1f2', border: '1px solid #fecdd3' }}>
                    <XIcon size={12} /> Expired
                </span>
            )
        }
        return (
            <span className="status-badge" style={{ color: '#047857', background: '#ecfdf5', border: '1px solid #d1fae5' }}>
                <CheckIcon size={12} /> Aktif
            </span>
        )
    }

    return (
        <>
            {/* Modals for CRUD using generic Modal component */}
            <Modal
                isOpen={isCreatingSchool || !!editingSchool}
                onClose={() => { setIsCreatingSchool(false); setEditingSchool(null); }}
                title={editingSchool ? 'Edit Sekolah' : 'Tambah Sekolah Baru'}
                maxWidth="450px"
            >
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
            </Modal>

            <Modal
                isOpen={!!editingSubscription}
                onClose={() => setEditingSubscription(null)}
                maxWidth="450px"
                showCloseButton={true}
            >
                {editingSubscription && (
                    <ClassSubscriptionManager
                        kelas={editingSubscription}
                        isModal={true}
                        onSuccess={() => {
                            setEditingSubscription(null)
                            utils.school.getUnifiedManagementData.invalidate()
                        }}
                        onCancel={() => setEditingSubscription(null)}
                    />
                )}
            </Modal>

            <Modal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                maxWidth="600px"
            >
                {editingUser && (
                    <EditUserForm
                        user={editingUser}
                        isModal={true}
                        onSuccess={() => {
                            setEditingUser(null)
                            utils.school.getUnifiedManagementData.invalidate()
                        }}
                        onCancel={() => setEditingUser(null)}
                    />
                )}
            </Modal>

            {/* Confirmations remain using ConfirmDialog for now as it's already robust */}
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

            <div className="admin-unified-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    gap: '1.5rem',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Pusat Komando</h2>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>Manajemen sekolah, kelas, dan siswa dalam satu pusat kendali.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                            <SearchIcon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input
                                type="text"
                                placeholder="Cari sekolah atau alamat..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="form-input"
                                style={{ paddingLeft: '2.75rem', height: '44px', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', width: '100%' }}
                            />
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ height: '44px', borderRadius: '1rem', padding: '0 1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px 0 rgba(var(--primary-rgb), 0.39)' }}
                            onClick={() => {
                                setSchoolFormData({ name: '', address: '' })
                                setIsCreatingSchool(true)
                            }}
                        >
                            <PlusIcon size={18} /> Sekolah
                        </button>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '1.25rem', border: '1px solid var(--border)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1.5px solid var(--border)' }}>
                                <th style={{ width: '60px' }}></th>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-light)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sekolah</th>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-light)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kelas</th>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-light)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Siswa</th>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-light)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSchools?.map((school) => (
                                <Fragment key={school.id}>
                                    <tr
                                        className={`school-row ${expandedSchoolId === school.id ? 'expanded' : ''}`}
                                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                                        onClick={() => setExpandedSchoolId(expandedSchoolId === school.id ? null : school.id)}
                                    >
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{
                                                color: expandedSchoolId === school.id ? 'var(--primary)' : 'var(--text-light)',
                                                transition: 'transform 0.3s ease',
                                                transform: expandedSchoolId === school.id ? 'rotate(90deg)' : 'rotate(0deg)'
                                            }}>
                                                <ChevronRightIcon size={20} />
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    width: '44px', height: '44px', borderRadius: '1rem',
                                                    background: expandedSchoolId === school.id ? 'var(--primary)10' : 'var(--bg-secondary)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: expandedSchoolId === school.id ? 'var(--primary)' : 'var(--text-light)',
                                                    transition: 'all 0.3s',
                                                    boxShadow: expandedSchoolId === school.id ? 'inset 0 0 0 1px var(--primary)30' : 'none'
                                                }}>
                                                    <SchoolIcon size={22} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>{school.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.125rem' }}>{school.address || 'Alamat belum disetel'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                                            <span className="badge-count" style={{ background: expandedSchoolId === school.id ? 'var(--primary)' : 'var(--bg-secondary)', color: expandedSchoolId === school.id ? 'white' : 'var(--text)' }}>
                                                {school.totalClasses}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                                            <span className="badge-count" style={{ background: 'transparent', border: '1.5px solid var(--border)', color: 'var(--text)' }}>
                                                {school.totalStudents}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button className="btn-icon" title="Edit Sekolah" style={{
                                                    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'white', color: 'var(--text-light)', transition: 'all 0.2s', cursor: 'pointer'
                                                }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary)30'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--text-light)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingSchool(school);
                                                        setSchoolFormData({ name: school.name, address: school.address || '' });
                                                    }}>
                                                    <EditIcon size={20} />
                                                </button>
                                                <button className="btn-icon" title="Hapus Sekolah" style={{
                                                    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'white', color: 'var(--text-light)', transition: 'all 0.2s', cursor: 'pointer'
                                                }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fee2e2'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--text-light)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteSchoolId(school.id);
                                                    }}>
                                                    <TrashIcon size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {expandedSchoolId === school.id && (
                                        <tr style={{ background: 'var(--bg-secondary)' }}>
                                            <td colSpan={5} style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                                                <div className="detail-container" style={{
                                                    background: 'white', borderRadius: '0 0 1.5rem 1.5rem',
                                                    padding: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                                                    border: '1.5px solid var(--border)', borderTop: 'none'
                                                }}>
                                                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1.5px solid var(--border)' }}>
                                                        <button onClick={() => setSubTab('classes')} className={`sub-tab-btn ${subTab === 'classes' ? 'active' : ''}`}>Kelas & Subscription</button>
                                                        <button onClick={() => setSubTab('students')} className={`sub-tab-btn ${subTab === 'students' ? 'active' : ''}`}>Daftar Siswa</button>
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
                                                                                        <button className="btn-action" onClick={() => setEditingSubscription(cls.name)}>Update Subs</button>
                                                                                        <button className="btn-icon-small" onClick={() => setDeleteClassId(cls.id)} style={{ color: 'var(--danger)' }}><XCloseIcon size={14} /></button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            {isAddingClassToId === school.id ? (
                                                                <form onSubmit={(e) => { e.preventDefault(); if (newClassName.trim()) addClass.mutate({ schoolId: school.id, name: newClassName }); }} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                                    <input autoFocus type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="Nama Kelas (cth: X RPL 1)" className="form-input" style={{ flex: 1, height: '38px', fontSize: '0.875rem' }} />
                                                                    <button type="submit" className="btn btn-primary btn-sm" disabled={addClass.isLoading}>{addClass.isLoading ? '...' : 'Simpan'}</button>
                                                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddingClassToId(null)}>Batal</button>
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

            {/* Modals are already portaled inside the Modal/ConfirmDialog components */}

            <style jsx>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .admin-unified-container {
                    animation: fadeInUp 0.4s ease-out forwards;
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.2rem 0.6rem;
                    border-radius: 9999px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }
                .badge-count {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 2rem;
                    height: 2rem;
                    padding: 0 0.5rem;
                    border-radius: 0.75rem;
                    font-size: 0.875rem;
                    font-weight: 700;
                    transition: all 0.3s;
                }
                .badge-legacy {
                    font-size: 0.65rem;
                    padding: 0.1rem 0.4rem;
                    background: #fef3c7;
                    color: #92400e;
                    border-radius: 0.25rem;
                    font-weight: 700;
                }
                .btn-icon-small {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    alignItems: center;
                    justifyContent: center;
                    border-radius: 0.625rem;
                    border: 1px solid var(--border);
                    background: white;
                    color: var(--text-light);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                }
                .btn-icon-small:hover {
                    background: var(--bg-secondary);
                    color: var(--primary);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .btn-action {
                    font-size: 0.75rem;
                    font-weight: 700;
                    padding: 0.4rem 0.875rem;
                    border-radius: 0.75rem;
                    border: 1px solid var(--border);
                    background: white;
                    color: var(--text);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-action:hover {
                    background: var(--bg-secondary);
                    border-color: var(--primary);
                    color: var(--primary);
                    transform: translateY(-1px);
                }
                .btn-add-dashed {
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px dashed var(--border);
                    border-radius: 1rem;
                    background: transparent;
                    color: var(--text-light);
                    font-weight: 600;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }
                .btn-add-dashed:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                    background: rgba(var(--primary-rgb), 0.04);
                }
                .row-hover:hover {
                    background: rgba(var(--primary-rgb), 0.02);
                }
                .school-row {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .school-row:hover {
                    background: #fafafa !important;
                }
                .school-row.expanded {
                    background: var(--bg-secondary) !important;
                }
                .detail-container {
                    animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .sub-tab-btn {
                    padding: 0.75rem 0;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--text-light);
                    border-bottom: 2px solid transparent;
                    font-weight: 600;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                    position: relative;
                }
                .sub-tab-btn.active {
                    color: var(--primary);
                    border-bottom-color: var(--primary);
                }
                /* Modal styles are now in Modal.tsx */
            `}</style>
        </>
    )
}

function SchoolStudentList({ schoolId, onEditUser }: { schoolId: string, onEditUser: (user: any) => void }) {
    const { data: students, isLoading } = trpc.auth.getUsersBySchool.useQuery({ schoolId })
    const [filter, setFilter] = useState('')

    if (isLoading) return <LoadingSpinner size={32} style={{ margin: '3rem auto' }} />

    const filtered = students?.filter(s =>
        s.name.toLowerCase().includes(filter.toLowerCase()) ||
        s.email.toLowerCase().includes(filter.toLowerCase()) ||
        s.kelas?.toLowerCase().includes(filter.toLowerCase())
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'scaleIn 0.3s ease-out' }}>
            <div style={{ position: 'relative' }}>
                <SearchIcon size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                    type="text"
                    placeholder="Cari nama, email, atau kelas siswa..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="form-input"
                    style={{
                        paddingLeft: '2.75rem',
                        fontSize: '0.875rem',
                        height: '40px',
                        borderRadius: '0.75rem',
                        background: 'var(--bg-secondary)',
                        border: '1.5px solid var(--border)'
                    }}
                />
            </div>

            <div style={{ overflowX: 'auto', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-light)', fontSize: '0.7rem', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <th style={{ padding: '1rem' }}>Siswa</th>
                            <th style={{ padding: '1rem' }}>Kelas</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered?.map(user => (
                            <tr key={user.id} className="row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '50%',
                                            background: user.isAdmin ? 'var(--primary)10' : 'var(--bg-secondary)',
                                            color: user.isAdmin ? 'var(--primary)' : 'var(--text-light)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {user.isAdmin ? <CrownIcon size={16} /> : <UserIcon size={16} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>{user.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '0.5rem',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text)'
                                    }}>
                                        {user.kelas || 'Belum ada kelas'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button className="btn-icon" style={{
                                        padding: '0.4rem',
                                        borderRadius: '0.625rem',
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-light)',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
                                    }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = 'var(--bg-secondary)';
                                            e.currentTarget.style.color = 'var(--primary)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'var(--text-light)';
                                        }}
                                        onClick={() => onEditUser(user)}>
                                        <EditIcon size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered?.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-secondary)' }}>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>Tidak ada siswa yang cocok dengan pencarian.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
