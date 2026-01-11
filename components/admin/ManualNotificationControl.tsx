import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import { BellIcon } from '@/components/ui/Icons'

export default function ManualNotificationControl() {
    const { data: unifiedData } = trpc.school.getUnifiedManagementData.useQuery()
    const [notificationType, setNotificationType] = useState<'deadline' | 'schedule'>('schedule')
    const [selectedClasses, setSelectedClasses] = useState<string[]>([])

    const triggerManualPush = trpc.notification.triggerManualPush.useMutation({
        onSuccess: (data) => {
            toast.success(`Berhasil mengirim ${data.totalSent} notifikasi`)
            setSelectedClasses([])
        },
        onError: (err) => toast.error(err.message)
    })

    const allClassNames = Array.from(new Set(unifiedData?.flatMap(s => s.classes.map(c => c.name)) || [])).sort()

    const toggleAll = () => {
        if (selectedClasses.length === allClassNames.length) {
            setSelectedClasses([])
        } else {
            setSelectedClasses(allClassNames)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: 'var(--primary)10', color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <BellIcon size={20} />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Force Push Notifikasi</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: 0 }}>Kirim notifikasi manual ke kelas tertentu (Akan mengabaikan pengaturan user).</p>
                </div>
            </div>

            <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>1. Pilih Tipe Notifikasi</div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className={`btn ${notificationType === 'schedule' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, height: '44px', borderRadius: '0.75rem', fontWeight: 700 }}
                        onClick={() => setNotificationType('schedule')}
                    >
                        Jadwal Besok
                    </button>
                    <button
                        className={`btn ${notificationType === 'deadline' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, height: '44px', borderRadius: '0.75rem', fontWeight: 700 }}
                        onClick={() => setNotificationType('deadline')}
                    >
                        Deadline PR
                    </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '1rem', fontStyle: 'italic' }}>
                    {notificationType === 'schedule'
                        ? 'Target: Siswa yang besok ada mata pelajaran & masih punya tugas aktif.'
                        : 'Target: Siswa yang memiliki tugas dengan deadline dalam 48 jam.'}
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>2. Pilih Kelas Target ({selectedClasses.length})</div>
                    <button
                        onClick={toggleAll}
                        style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        {selectedClasses.length === allClassNames.length ? 'Batal Semua' : 'Pilih Semua'}
                    </button>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '0.5rem',
                    maxHeight: '250px',
                    overflowY: 'auto',
                    padding: '0.75rem',
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '1rem'
                }}>
                    {allClassNames.map(className => (
                        <label
                            key={className}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                background: selectedClasses.includes(className) ? 'var(--primary)08' : 'var(--bg-secondary)',
                                border: `1px solid ${selectedClasses.includes(className) ? 'var(--primary)40' : 'transparent'}`,
                                borderRadius: '0.75rem',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: selectedClasses.includes(className) ? 700 : 500,
                                color: selectedClasses.includes(className) ? 'var(--primary)' : 'var(--text)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={selectedClasses.includes(className)}
                                onChange={() => {
                                    if (selectedClasses.includes(className)) {
                                        setSelectedClasses(selectedClasses.filter(c => c !== className))
                                    } else {
                                        setSelectedClasses([...selectedClasses, className])
                                    }
                                }}
                                style={{ accentColor: 'var(--primary)' }}
                            />
                            {className}
                        </label>
                    ))}
                </div>
            </div>

            <button
                className="btn btn-primary"
                disabled={selectedClasses.length === 0 || triggerManualPush.isLoading}
                onClick={() => {
                    if (selectedClasses.length > 0) {
                        triggerManualPush.mutate({
                            type: notificationType,
                            classNames: selectedClasses,
                            force: true
                        })
                    }
                }}
                style={{
                    height: '50px',
                    borderRadius: '1rem',
                    fontWeight: 800,
                    fontSize: '1rem',
                    boxShadow: selectedClasses.length > 0 ? '0 10px 15px -3px rgba(var(--primary-rgb), 0.3)' : 'none'
                }}
            >
                {triggerManualPush.isLoading ? 'Mengirim...' : `Kirim ke ${selectedClasses.length} Kelas`}
            </button>
        </div>
    )
}
