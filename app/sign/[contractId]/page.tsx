'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  FileText, ChevronDown, ChevronUp, CheckCircle2, Loader2,
  Lock, Shield, Share2,
} from 'lucide-react'
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
  }
  template: { name: string; fields: TemplateField[] }
  org: { name: string }
}

function formatIIN(value: string) {
  return value.replace(/\D/g, '').slice(0, 12)
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('8')) return '+7' + digits.slice(1)
  if (digits.length > 0 && !digits.startsWith('7')) return '+7' + digits
  return digits.length > 0 ? '+' + digits : ''
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
  const [showDetails, setShowDetails] = useState(false)

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
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const verifyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/sign/${contractId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setLoadError(d.error)
        else setData(d)
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
        <Loader2 size={32} className="text-[#0F52BA] animate-spin" />
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
  const clientFields = template.fields.filter((f) => f.filled_by === 'client')

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
    const handleShare = async () => {
      const url = window.location.href
      if (navigator.share) {
        try { await navigator.share({ title: 'Мой договор', text: 'Договор подписан через OneContract', url }) }
        catch { /* user cancelled */ }
      } else {
        await navigator.clipboard.writeText(url)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      }
    }

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
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
            <p className="text-[10px] text-[#A6C5D7] mt-0.5">
              onecontract.kz/verify/{contractId.slice(0, 8)}...
            </p>
          </div>

          <div className="space-y-3 w-full">
            <button
              disabled
              className="w-full h-12 bg-[#D6E6F3] text-[#6B7E92] rounded-xl text-sm font-semibold cursor-not-allowed"
            >
              Скачать PDF — Скоро
            </button>
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
    if (clientFields.length > 0) {
      setSubmitting(true)
      try {
        await fetch(`/api/sign/${contractId}/fill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientData }),
        })
      } catch { /* non-fatal */ }
      finally { setSubmitting(false) }
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
        await fetch(`/api/sign/${contractId}/send-otp`, { method: 'POST' })
        setSendingOtp(false)
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

  const handleOtpInput = (i: number, val: string) => {
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

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
    }
  }

  const handleResend = async () => {
    setCanResend(false)
    setOtpError(null)
    setOtpDigits(['', '', '', '', '', ''])
    await fetch(`/api/sign/${contractId}/send-otp`, { method: 'POST' })
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

        {/* Block 2 — Manager fields */}
        {managerFields.some((f) => contract.data[f.key]) && (
          <div className="bg-[#F8FAFC] rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7E92] mb-3">
              Условия договора
            </p>
            <div>
              {managerFields.map((f) => {
                const val = contract.data[f.key]
                if (!val) return null
                return (
                  <div
                    key={f.key}
                    className="flex justify-between items-start gap-3 py-2 border-b border-[#F0F4F8] last:border-0"
                  >
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
                  <label className="block text-xs font-medium text-[#6B7E92] mb-1">
                    {f.label}
                    {f.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input
                    type={f.type === 'email' ? 'email' : f.type === 'phone' ? 'tel' : 'text'}
                    inputMode={f.type === 'iin' || f.type === 'number' ? 'numeric' : undefined}
                    value={clientData[f.key] ?? ''}
                    onChange={(e) => {
                      let val = e.target.value
                      if (f.type === 'iin') val = formatIIN(val)
                      setClientData((prev) => ({ ...prev, [f.key]: val }))
                      const err = validateField(f, val)
                      setFieldErrors((prev) => ({ ...prev, [f.key]: err }))
                    }}
                    onBlur={(e) => {
                      const err = validateField(f, e.target.value)
                      setFieldErrors((prev) => ({ ...prev, [f.key]: err }))
                    }}
                    placeholder={
                      f.type === 'iin' ? '123456789012'
                      : f.type === 'phone' ? '+7 700 000 00 00'
                      : f.label
                    }
                    className={`w-full h-12 border rounded-xl px-4 text-base text-[#0D1B2A] placeholder:text-[#A6C5D7] focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/30 transition-colors ${
                      hasError ? 'border-red-400 focus:border-red-400' : 'border-[#D6E6F3] focus:border-[#0F52BA]'
                    }`}
                  />
                  {hasError && (
                    <p className="text-xs text-red-500 mt-1">{err}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Block 4 — Contract preview toggle */}
        <div className="border border-[#D6E6F3] rounded-2xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#0D1B2A] hover:bg-[#D6E6F3]/20 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileText size={15} strokeWidth={1.5} />
              {showDetails ? 'Свернуть' : 'Посмотреть полный договор'}
            </span>
            {showDetails
              ? <ChevronUp size={16} strokeWidth={1.5} />
              : <ChevronDown size={16} strokeWidth={1.5} />}
          </button>
          {showDetails && (
            <div className="border-t border-[#D6E6F3] px-4 py-4 space-y-2.5 bg-white">
              <div className="text-sm font-semibold text-[#0D1B2A] mb-3">{org.name}</div>
              {template.fields.map((f) => (
                <div key={f.key} className="flex justify-between items-start gap-3">
                  <span className="text-xs text-[#6B7E92] shrink-0">{f.label}</span>
                  <span className="text-xs font-medium text-[#0D1B2A] text-right">
                    {contract.data[f.key] || clientData[f.key] || '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

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
          <button
            onClick={handleSignClick}
            disabled={!canSign || submitting}
            className="w-full h-14 bg-[#0F52BA] hover:bg-blue-700 text-white text-lg font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Подписать договор'}
          </button>
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
                  disabled={phone.length < 11 || verifyingPhone || sendingOtp}
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
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleOtpInput(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
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
