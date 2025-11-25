-- Migration untuk fitur Class Subscription
-- Buat tabel class_subscriptions untuk track subscription per kelas

CREATE TABLE IF NOT EXISTS class_subscriptions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    kelas VARCHAR(50) UNIQUE NOT NULL,
    subscription_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_class_subscriptions_kelas ON class_subscriptions(kelas);
CREATE INDEX IF NOT EXISTS idx_class_subscriptions_end_date ON class_subscriptions(subscription_end_date);

-- Comment untuk dokumentasi
COMMENT ON TABLE class_subscriptions IS 'Subscription per kelas untuk fitur premium/duration limit';
COMMENT ON COLUMN class_subscriptions.kelas IS 'Nama kelas (format: X RPL 1, XI TKJ 2, dll). UNIQUE karena satu kelas hanya punya satu subscription.';
COMMENT ON COLUMN class_subscriptions.subscription_end_date IS 'Tanggal dan waktu kapan subscription berakhir. Setelah tanggal ini, fitur kelas akan dinonaktifkan.';

