'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDownIcon, ChevronUpIcon, ArrowLeftIcon } from '@/components/ui/Icons'

interface FAQItem {
  id: string
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    id: 'forgot-password',
    question: 'Saya lupa password, bagaimana cara mengubahnya?',
    answer: 'Jika Anda lupa password, silakan hubungi Admin atau ketua kelas Anda untuk meminta bantuan mengubah password. Admin atau ketua akan memberikan kesempatan untuk mengganti password akun Anda.'
  },
  {
    id: 'register',
    question: 'Bagaimana cara mendaftar/membuat akun?',
    answer: 'Untuk mendapatkan akun di TuntasinAja, Anda perlu membeli subscription untuk kelas Anda terlebih dahulu. Setelah membeli subscription, Anda akan mendapatkan akses untuk membuat akun dan menggunakan platform ini.'
  },
  {
    id: 'buy-subscription',
    question: 'Bagaimana cara membeli subscription TuntasinAja?',
    answer: 'Untuk membeli subscription TuntasinAja, silakan hubungi nomor WhatsApp: 085813139399. Harga subscription adalah Rp 20.000 untuk 1 bulan. Sebelum menghubungi, pastikan Anda telah menyiapkan daftar nama-nama siswa di kelas Anda yang akan menggunakan subscription ini.'
  }
]

export default function FAQPage() {
  const router = useRouter()
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id)
    } else {
      newOpenItems.add(id)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <div className="faq-page-wrapper">
      {/* Background with blurred circles */}
      <div className="signin-background-circles">
        <div className="signin-circle signin-circle-1"></div>
        <div className="signin-circle signin-circle-2"></div>
      </div>

      {/* Main Content */}
      <main className="faq-page-main">
        <div className="faq-page-container">
          <div className="faq-page-card">
            {/* Header */}
            <div className="faq-page-header">
              <button
                onClick={() => router.back()}
                className="faq-back-button"
                aria-label="Kembali"
              >
                <ArrowLeftIcon size={24} />
              </button>
              <h1 className="faq-page-title">FAQ</h1>
              <p className="faq-page-subtitle">Pertanyaan yang Sering Diajukan</p>
            </div>

            {/* FAQ Items */}
            <div className="faq-items">
              {faqData.map((item) => {
                const isOpen = openItems.has(item.id)
                return (
                  <div key={item.id} className="faq-item">
                    <button
                      className="faq-question"
                      onClick={() => toggleItem(item.id)}
                      aria-expanded={isOpen}
                    >
                      <span className="faq-question-text">{item.question}</span>
                      {isOpen ? (
                        <ChevronUpIcon size={20} className="faq-icon" />
                      ) : (
                        <ChevronDownIcon size={20} className="faq-icon" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="faq-answer">
                        <p>{item.answer}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

