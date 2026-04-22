'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  FileText, CheckCircle2, Loader2, Download,
  Lock, Shield, Share2, ChevronDown,
} from 'lucide-react'
import { BoxLoader } from '@/components/ui/BoxLoader'
import type { TemplateField } from '@/lib/types'

type SignStep = 'form' | 'verify' | 'otp' | 'success'

type ContractData = {
  contract: {
    id: string
    status: string
    recipient_name: string | null
    recipient_phone_masked: string | null
    sent_via: string | null
    data: Record<string, string>
    signed_at: string | null
    pdf_url: string | null
  }
  template: { name: string; fields: TemplateField[]; source_file_url: string | null }
  org: { name: string }
}

function formatIIN(value: string) {
  return value.replace(/\D/g, '').slice(0, 12)
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  if (digits.length === 10) return '+7' + digits
  if (digits[0] === '8') return '+7' + digits.slice(1)
  if (digits[0] === '7') return '+' + digits
  return '+7' + digits
}

const KZ_PHONE_RE = /^\+7\d{10}$/

function smartPlaceholder(f: TemplateField): string {
  if (f.placeholder) return f.placeholder
  if (f.type === 'iin') return '123456789012'
  if (f.type === 'phone') return '+7 700 000 00 00'
  if (f.type === 'email') return 'name@example.com'
  if (f.type === 'date') return 'дд.мм.гггг'
  const l = f.label.toLowerCase()
  if (/кем выдан|кто выдал/.test(l)) return 'МВД РК'
  if (/адрес/.test(l)) return 'г. Алматы, ул. Абая 1'
  if (/фио|ф\.и\.о/.test(l)) return 'Иванов Иван Иванович'
  if (/номер документа|удостоверен/.test(l)) return '123456789'
  return f.label
}

function validateField(f: TemplateField, val: string): string {
  if (!f.required && !val) return ''
  if (f.required && !val.trim()) return 'Обязательное поле'
  if (f.type === 'iin') {
    if (val.length > 0 && val.length !== 12) return 'ИИН должен содержать 12 цифр'
  }
  const isNameField = /фио|имя|name/i.test(f.label)
  if (isNameField && val.trim().length > 0 && val.trim().length < 5) return 'Минимум 5 символов'
  return ''
}

export default function SignPage() {
  const { contractId } = useParams<{ contractId: string }>()
  const [data, setData] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [clientData, setClientData] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedPD, setAgreedPD] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const [step, setStep] = useState<SignStep>('form')
  const [signedAt, setSignedAt] = useState('')

  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [verifyingPhone, setVerifyingPhone] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState<string | null>(null)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(3)
  const [countdown, setCountdown] = useState(59)
  const [canResend, setCanResend] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const verifyRef = useRef<HTMLDivElement>(null)
  const retryInFlightRef = useRef(false)

  useEffect(() => {
    fetch(`/api/sign/${contractId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setLoadError(d.error); return }
        setData(d)
        if (d.contract?.status === 'signed') {
          if (d.contract.pdf_url) setPdfUrl(d.contract.pdf_url)
          if (d.contract.signed_at) {
            setSignedAt(new Date(d.contract.signed_at).toLocaleString('ru-RU', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            }))
          }
          setStep('success')
        }
      })
      .catch(() => setLoadError('Не удалось загрузить договор'))
      .finally(() => setLoading(false))
  }, [contractId])

  useEffect(() => {
    if (step !== 'otp') return
    setCountdown(59)
    setCanResend(false)
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { setCanResend(true); clearInterval(timer); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step])

  useEffect(() => {
    if (step === 'verify' || step === 'otp') {
      setTimeout(() => verifyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [step])

  useEffect(() => {
    if (step !== 'success') return
    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(
        `https://onecontract.kz/verify/${contractId}`,
        { width: 180, margin: 2, color: { dark: '#000926', light: '#FFFFFF' } }
      ).then(setQrDataUrl)
    })
  }, [step, contractId])

  useEffect(() => {
    if (step !== 'success' || pdfUrl) return
    let retries = 0
    const maxRetries = 3
    const interval = setInterval(async () => {
      if (retries >= maxRetries) {
        clearInterval(interval)
        return
      }
      if (retryInFlightRef.current) return
      retries++
      try {
        const r = await fetch(`/api/sign/${contractId}`)
        const d = await r.json()
        if (d.contract?.pdf_url) {
          setPdfUrl(d.contract.pdf_url)
          clearInterval(interval)
        }
      } catch {
        /* ignore */
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [step, pdfUrl, contractId])

  const handleVerify = useCallback(async (code: string) => {
    if (verifyingOtp) return
    setVerifyingOtp(true)
    setOtpError(null)
    try {
      const r = await fetch(`/api/sign/${contractId}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const d = await r.json()
      if (d.success) {
        setSignedAt(new Date().toLocaleString('ru-RU', {
          day: 'numeric', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }))
        if (d.pdf_url) setPdfUrl(d.pdf_url)
        setStep('success')
      } else {
        const newAttempts = attemptsLeft - 1
        setAttemptsLeft(newAttempts)
        if (newAttempts <= 0) {
          setOtpError('Превышено количество попыток. Обратитесь к организации.')
        } else {
          setOtpError(d.error ?? 'Неверный код')
        }
        setOtpDigits(['', '', '', '', '', ''])
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
      }
    } catch {
      setOtpError('Ошибка соединения')
    } finally {
      setVerifyingOtp(false)
    }
  }, [contractId, verifyingOtp, attemptsLeft])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <BoxLoader />
      </div>
    )
  }

  if (loadError || !data) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <FileText size={28} className="text-red-500" strokeWidth={1.5} />
        </div>
        <h1 className="text-lg font-bold text-[#0D1B2A] mb-2">Договор недоступен</h1>
        <p className="text-sm text-[#6B7E92]">{loadError ?? 'Ссылка устарела или недействительна'}</p>
      </div>
    )
  }

  const { contract, template, org } = data
  const managerFields = template.fields.filter((f) => (f.filled_by ?? 'manager') === 'manager')
  const explicitClientFields = template.fields.filter((f) => f.filled_by === 'client')
  // Fallback: if template predates filled_by support, show any field the manager left empty
  const clientFields = explicitClientFields.length > 0
    ? explicitClientFields
    : template.fields.filter((f) => !contract.data?.[f.key as keyof typeof contract.data])

  const clientFormValid = clientFields.every((f) => {
    if (!f.required) return true
    const val = clientData[f.key]?.trim() ?? ''
    if (!val) return false
    if (f.type === 'iin') return val.length === 12
    return val.length >= 1
  })

  const canSign = (clientFields.length === 0 || clientFormValid) && agreedTerms && agreedPD

  // ─── SUCCESS ───────────────────────────────────────────────
  if (step === 'success') {
    const verifyUrl = `${window.location.origin}/verify/${contractId}`
    const shareUrl = pdfUrl ?? verifyUrl
    const handleShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Подписанный договор',
            text: pdfUrl ? 'Мой подписанный договор (PDF)' : 'Проверка подписи договора',
            url: shareUrl,
          })
        } catch { /* user cancelled */ }
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      }
    }

    const handleRetryPdf = async () => {
      if (pdfGenerating) return
      retryInFlightRef.current = true
      setPdfGenerating(true)
      setPdfError(null)
      try {
        const r = await fetch(`/api/sign/${contractId}/regenerate-pdf`, { method: 'POST' })
        const d = await r.json()
        if (!r.ok || !d.pdf_url) {
          setPdfError(d.error || d.details || 'Не удалось сгенерировать PDF')
          return
        }
        setPdfUrl(d.pdf_url)
      } catch {
        setPdfError('Ошибка соединения. Попробуйте ещё раз.')
      } finally {
        setPdfGenerating(false)
        retryInFlightRef.current = false
      }
    }

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        {[
          { left: '15%', delay: '0s', color: '#0F52BA' },
          { left: '35%', delay: '0.15s', color: '#0F7B55' },
          { left: '55%', delay: '0.3s', color: '#F59E0B' },
          { left: '75%', delay: '0.1s', color: '#0F52BA' },
          { left: '90%', delay: '0.25s', color: '#A6C5D7' },
        ].map((c, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{ left: c.left, backgroundColor: c.color, animationDelay: c.delay }}
          />
        ))}
        <div className="flex-1 px-4 py-8 max-w-md mx-auto w-full text-center">
          <div className="w-20 h-20 bg-[#0F7B55]/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-[successPop_0.4s_ease-out]">
            <CheckCircle2 size={40} className="text-[#0F7B55]" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-[#0D1B2A] mb-1">Договор подписан!</h1>
          {signedAt && <p className="text-sm text-[#6B7E92] mb-1">{signedAt}</p>}
          <p className="text-xs text-[#6B7E92] mb-6">Копия будет отправлена на ваш номер</p>

          {/* QR block */}
          <div className="bg-white border border-[#D6E6F3] rounded-2xl shadow-sm p-4 mb-6 inline-block">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR код верификации" width={160} height={160} className="mx-auto" />
            ) : (
              <div className="w-40 h-40 bg-[#F8FAFC] rounded-xl mx-auto animate-pulse" />
            )}
            <p className="text-xs text-[#6B7E92] mt-2">Сканируйте для проверки подписи</p>
            <p className="text-[10px] text-[#A6C5D7] mt-1">
              Хранится 5 лет по ГК РК ст.178
            </p>
            <p className="text-[10px] text-[#A6C5D7] mt-0.5">
              onecontract.kz/verify/{contractId.slice(0, 8)}...
            </p>
          </div>

          <div className="space-y-3 w-full">
            {pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={`contract-${contractId.slice(0, 8)}.pdf`}
                className="w-full h-12 bg-[#0F52BA] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={16} strokeWidth={1.5} />
                Скачать PDF
              </a>
            ) : (
              <button
                onClick={handleRetryPdf}
                disabled={pdfGenerating}
                className="w-full h-12 bg-[#0F52BA] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pdfGenerating ? (
                  <>
                    <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
                    Генерация PDF…
                  </>
                ) : (
                  <>
                    <FileText size={16} strokeWidth={1.5} />
                    Сгенерировать PDF
                  </>
                )}
              </button>
            )}
            {pdfError && (
              <p className="text-xs text-red-600 text-center">{pdfError}</p>
            )}
            <button
              onClick={handleShare}
              className="w-full h-12 border border-[#A6C5D7] text-[#0D1B2A] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#D6E6F3]/20 transition-colors"
            >
              <Share2 size={16} strokeWidth={1.5} />
              {linkCopied ? 'Ссылка скопирована!' : 'Поделиться'}
            </button>
          </div>
          <p className="text-xs text-[#6B7E92] mt-6">Защищено SHA-256 · OneContract</p>
        </div>
      </div>
    )
  }

  // ─── HANDLERS ──────────────────────────────────────────────
  const handleSignClick = async () => {
    if (!canSign) return
    setSubmitError(null)
    if (clientFields.length > 0) {
      setSubmitting(true)
      try {
        const r = await fetch(`/api/sign/${contractId}/fill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientData }),
        })
        const d = await r.json() as { fieldErrors?: Record<string, string>; error?: string }
        if (!r.ok) {
          if (d.fieldErrors && Object.keys(d.fieldErrors).length > 0) {
            setFieldErrors(d.fieldErrors)
            const firstErrKey = Object.keys(d.fieldErrors)[0]
            document.getElementById(`field-${firstErrKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          } else {
            setSubmitError(d.error ?? 'Не удалось сохранить данные')
          }
          setSubmitting(false)
          return
        }
      } catch {
        setSubmitError('Ошибка соединения. Проверьте интернет и попробуйте ещё раз.')
        setSubmitting(false)
        return
      }
      setSubmitting(false)
    }
    setStep('verify')
  }

  const handleVerifyPhone = async () => {
    setVerifyingPhone(true)
    setPhoneError(null)
    try {
      const r = await fetch(`/api/sign/${contractId}/verify-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const d = await r.json()
      if (d.match) {
        setSendingOtp(true)
        const otpRes = await fetch(`/api/sign/${contractId}/send-otp`, { method: 'POST' })
        setSendingOtp(false)
        if (!otpRes.ok) {
          const err = await otpRes.json().catch(() => ({ error: null }))
          setPhoneError(err.error ?? 'Не удалось отправить SMS. Попробуйте позже.')
          return
        }
        setStep('otp')
      } else {
        setPhoneError(d.error ?? 'Номер не совпадает с указанным в договоре')
      }
    } catch {
      setPhoneError('Ошибка соединения')
    } finally {
      setVerifyingPhone(false)
      setSendingOtp(false)
    }
  }

  const fillOtpFromString = (raw: string, startIndex = 0) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6 - startIndex)
    if (!digits) return
    const next = [...otpDigits]
    for (let k = 0; k < digits.length; k++) {
      next[startIndex + k] = digits[k]
    }
    setOtpDigits(next)
    const lastFilled = Math.min(startIndex + digits.length - 1, 5)
    const focusIndex = next.every((d) => d) ? lastFilled : Math.min(lastFilled + 1, 5)
    otpRefs.current[focusIndex]?.focus()
    if (next.every((d) => d)) {
      handleVerify(next.join(''))
    }
  }

  const handleOtpInput = (i: number, val: string) => {
    if (val.length > 1) {
      fillOtpFromString(val, i)
      return
    }
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otpDigits]
    next[i] = digit
    setOtpDigits(next)
    if (digit && i < 5) {
      otpRefs.current[i + 1]?.focus()
    }
    if (digit && next.every((d) => d)) {
      handleVerify(next.join(''))
    }
  }

  const handleOtpPaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text')
    if (!text) return
    e.preventDefault()
    fillOtpFromString(text, i)
  }

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
    }
  }

  const handleResend = async () => {
    setCanResend(false)
    setOtpError(null)
    setOtpDigits(['', '', '', '', '', ''])
    try {
      const r = await fetch(`/api/sign/${contractId}/send-otp`, { method: 'POST' })
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: null }))
        setOtpError(err.error ?? 'Не удалось отправить SMS')
        setCanResend(true)
        return
      }
      setCountdown(59)
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { setCanResend(true); clearInterval(timer); return 0 }
          return c - 1
        })
      }, 1000)
    } catch {
      setOtpError('Ошибка соединения')
      setCanResend(true)
    }
  }

  // ─── MAIN FORM ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-5 pb-10">

        {/* Block 1 — Org + contract */}
        <div>
          <h1 className="text-xl font-bold text-[#000926]">{org.name}</h1>
          <p className="text-sm text-[#6B7E92] mt-0.5">{template.name}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-[#D6E6F3]/60 rounded-lg px-3 py-1.5">
            <Shield size={12} className="text-[#0F52BA]" strokeWidth={1.5} />
            <span className="text-xs text-[#0F52BA] font-medium">
              ПЭП — юридически значимо по ГК РК ст.152
            </span>
          </div>
        </div>

        {/* Block 2 — Inline contract preview (collapsible) */}
        {template.source_file_url && (
          <div className="border border-[#D6E6F3] rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPreview((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-[#F8FAFC] hover:bg-[#EDF4FB] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} strokeWidth={1.5} className="text-[#0F52BA]" />
                <span className="text-sm font-medium text-[#0D1B2A]">Посмотреть полный договор</span>
              </div>
              <div className="flex items-center gap-2">
                {showPreview && (
                  <a
                    href={template.source_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-[#0F52BA] hover:underline"
                  >
                    Открыть PDF
                  </a>
                )}
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  className={`text-[#6B7E92] transition-transform ${showPreview ? 'rotate-180' : ''}`}
                />
              </div>
            </button>
            {showPreview && (
              <div className="bg-white">
                <iframe
                  src={`${template.source_file_url}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="w-full"
                  style={{ height: '70vh', minHeight: 400, border: 'none' }}
                  title="Договор"
                />
              </div>
            )}
          </div>
        )}

        {/* Manager-filled contract conditions */}
        {managerFields.some((f) => contract.data[f.key]) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7E92] mb-2">
              Условия договора
            </p>
            <div className="border border-[#D6E6F3] rounded-xl divide-y divide-[#F0F4F8]">
              {managerFields.map((f) => {
                const val = contract.data[f.key]
                if (!val) return null
                return (
                  <div key={f.key} className="flex justify-between items-start gap-3 px-4 py-2.5">
                    <span className="text-xs text-[#6B7E92] shrink-0">{f.label}</span>
                    <span className="text-sm font-medium text-[#0D1B2A] text-right">{val}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Block 3 — Client fields */}
        {clientFields.length > 0 && (
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-[#0D1B2A]">Заполните ваши данные</h2>
              <p className="text-xs text-[#6B7E92] mt-0.5">Эти данные будут внесены в договор</p>
            </div>
            {clientFields.map((f) => {
              const err = fieldErrors[f.key]
              const hasError = !!err
              return (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-[#6B7E92] mb-1" htmlFor={`field-${f.key}`}>
                    {f.label}
                    {f.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  {f.type === 'date' ? (
                    <input
                      id={`field-${f.key}`}
                      type="date"
                      value={(() => {
                        const v = clientData[f.key] ?? ''
                        if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
                        const m = v.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
                        if (m) return `${m[3]}-${m[2]}-${m[1]}`
                        return ''
                      })()}
                      onChange={(e) => {
                        const val = e.target.value
                        setClientData((prev) => ({ ...prev, [f.key]: val }))
                        const fieldErr = validateField(f, val)
                        setFieldErrors((prev) => ({ ...prev, [f.key]: fieldErr }))
                      }}
                      className={`w-full h-12 border rounded-xl px-4 text-base text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/30 transition-colors ${
                        hasError ? 'border-red-400 focus:border-red-400' : 'border-[#D6E6F3] focus:border-[#0F52BA]'
                      }`}
                    />
                  ) : (
                    <input
                      id={`field-${f.key}`}
                      type={f.type === 'email' ? 'email' : f.type === 'phone' ? 'tel' : 'text'}
                      inputMode={f.type === 'iin' || f.type === 'number' ? 'numeric' : undefined}
                      value={clientData[f.key] ?? ''}
                      onChange={(e) => {
                        let val = e.target.value
                        if (f.type === 'iin') val = formatIIN(val)
                        setClientData((prev) => ({ ...prev, [f.key]: val }))
                        const fieldErr = validateField(f, val)
                        setFieldErrors((prev) => ({ ...prev, [f.key]: fieldErr }))
                      }}
                      onBlur={(e) => {
                        const fieldErr = validateField(f, e.target.value)
                        setFieldErrors((prev) => ({ ...prev, [f.key]: fieldErr }))
                      }}
                      placeholder={smartPlaceholder(f)}
                      className={`w-full h-12 border rounded-xl px-4 text-base text-[#0D1B2A] placeholder:text-[#A6C5D7] focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/30 transition-colors ${
                        hasError ? 'border-red-400 focus:border-red-400' : 'border-[#D6E6F3] focus:border-[#0F52BA]'
                      }`}
                    />
                  )}
                  {hasError && (
                    <p className="text-xs text-red-500 mt-1">{err}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Block 5 — Two checkboxes */}
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-[#A6C5D7] accent-[#0F52BA] shrink-0 cursor-pointer"
            />
            <span className="text-sm text-[#6B7E92] leading-snug">
              Я прочитал(а) договор и согласен(а) с его условиями
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedPD}
              onChange={(e) => setAgreedPD(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-[#A6C5D7] accent-[#0F52BA] shrink-0 cursor-pointer"
            />
            <span className="text-sm text-[#6B7E92] leading-snug">
              Я даю согласие на обработку персональных данных
            </span>
          </label>
        </div>

        {/* Block 6 — Sign button (hidden once verification started) */}
        {step === 'form' && (
          <div className="space-y-2">
            {submitError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                {submitError}
              </div>
            )}
            <button
              onClick={handleSignClick}
              disabled={!canSign || submitting}
              className="w-full h-14 bg-[#0F52BA] hover:bg-blue-700 text-white text-lg font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Подписать договор'}
            </button>
          </div>
        )}

        {/* Inline verify phone block */}
        {(step === 'verify' || step === 'otp') && (
          <div ref={verifyRef} className="space-y-3">
            {step === 'verify' && (
              <div className="border border-[#D6E6F3] rounded-2xl p-4 bg-[#F8FAFC] space-y-3">
                <h3 className="text-sm font-semibold text-[#0D1B2A]">Подтвердите номер телефона</h3>
                <p className="text-xs text-[#6B7E92]">Введите номер который указан в договоре</p>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="+7 700 000 00 00"
                  className="w-full h-12 border border-[#D6E6F3] rounded-xl px-4 text-base text-[#0D1B2A] placeholder:text-[#A6C5D7] focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/30 focus:border-[#0F52BA] transition-colors"
                />
                {phoneError && (
                  <p className="text-xs text-red-500">{phoneError}</p>
                )}
                <button
                  onClick={handleVerifyPhone}
                  disabled={!KZ_PHONE_RE.test(phone) || verifyingPhone || sendingOtp}
                  className="w-full h-12 bg-[#0F52BA] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {verifyingPhone || sendingOtp
                    ? <Loader2 size={18} className="animate-spin" />
                    : 'Получить SMS-код'}
                </button>
              </div>
            )}

            {/* Inline OTP block */}
            {step === 'otp' && (
              <div className="border border-[#D6E6F3] rounded-2xl p-4 bg-[#F8FAFC] space-y-4">
                <p className="text-sm text-[#0D1B2A]">
                  Код отправлен на {contract.recipient_phone_masked ?? 'ваш номер'}
                </p>
                <div className="flex gap-2 justify-center">
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={i === 0 ? 6 : 1}
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      value={d}
                      onChange={(e) => handleOtpInput(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                      onPaste={(e) => handleOtpPaste(i, e)}
                      disabled={attemptsLeft <= 0}
                      className="w-11 h-14 text-2xl text-center font-bold border border-[#A6C5D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/30 focus:border-[#0F52BA] transition-colors disabled:opacity-40"
                    />
                  ))}
                </div>
                {verifyingOtp && (
                  <div className="flex justify-center">
                    <Loader2 size={20} className="animate-spin text-[#0F52BA]" />
                  </div>
                )}
                {otpError && (
                  <p className="text-sm text-red-600 text-center">{otpError}</p>
                )}
                {attemptsLeft > 0 && (
                  <div className="text-center text-sm text-[#6B7E92]">
                    {canResend ? (
                      <button onClick={handleResend} className="text-[#0F52BA] font-medium">
                        Отправить повторно
                      </button>
                    ) : (
                      <span>Повторить через 0:{String(countdown).padStart(2, '0')}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-[#6B7E92]">
          Защищено SHA-256 · OneContract
        </p>
      </div>

    </div>
  )
}

function Header() {
  return (
    <header className="sticky top-0 bg-white border-b border-[#D6E6F3] z-10 px-4 py-3">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0F52BA] rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-white" strokeWidth={1.5} />
          </div>
          <span className="font-bold text-base text-[#0D1B2A]">OneContract</span>
        </div>
        <span className="text-xs text-[#6B7E92] flex items-center gap-1">
          <Lock size={11} strokeWidth={1.5} /> Защищено SHA-256
        </span>
      </div>
    </header>
  )
}
