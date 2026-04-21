'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { FileText, ChevronDown, ChevronUp, CheckCircle2, Loader2 } from 'lucide-react'
import type { TemplateField } from '@/lib/types'

type SignStep = 'form' | 'phone' | 'otp' | 'success'

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
  if (!digits.startsWith('7') && digits.length > 0) return '+7' + digits
  return '+' + digits
}

export default function SignPage() {
  const { contractId } = useParams<{ contractId: string }>()
  const [data, setData] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [clientData, setClientData] = useState<Record<string, string>>({})
  const [agreed, setAgreed] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const [step, setStep] = useState<SignStep>('form')

  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [verifyingPhone, setVerifyingPhone] = useState(false)

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState<string | null>(null)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  const [countdown, setCountdown] = useState(59)
  const [canResend, setCanResend] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const [submitting, setSubmitting] = useState(false)

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
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { setCanResend(true); clearInterval(timer); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step])

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
    return val.length >= 2
  })

  const canSign = (clientFields.length === 0 || clientFormValid) && agreed

  // ─── SUCCESS ───────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-[#0F7B55]/10 rounded-full flex items-center justify-center mb-6 animate-[successPop_0.4s_ease-out]">
          <CheckCircle2 size={40} className="text-[#0F7B55]" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-[#0D1B2A] mb-2">Договор подписан!</h1>
        <p className="text-sm text-[#6B7E92] mb-8">
          Копия будет отправлена на ваш номер
        </p>
        <button
          disabled
          className="w-full max-w-xs h-12 bg-[#D6E6F3] text-[#6B7E92] rounded-xl text-sm font-semibold cursor-not-allowed mb-3"
        >
          Скачать PDF — Скоро
        </button>
        <p className="text-xs text-[#6B7E92]">Защищено SHA-256 · OneContract</p>
      </div>
    )
  }

  // ─── OTP ───────────────────────────────────────────────────
  if (step === 'otp') {
    const handleOtpInput = (i: number, val: string) => {
      const digit = val.replace(/\D/g, '').slice(-1)
      const next = [...otpDigits]
      next[i] = digit
      setOtpDigits(next)
      if (digit && i < 5) otpRefs.current[i + 1]?.focus()
    }

    const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
        otpRefs.current[i - 1]?.focus()
      }
    }

    const handleVerify = async () => {
      const code = otpDigits.join('')
      if (code.length < 6) return
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
          setStep('success')
        } else {
          setOtpError(d.error ?? 'Неверный код')
        }
      } catch {
        setOtpError('Ошибка соединения')
      } finally {
        setVerifyingOtp(false)
      }
    }

    const handleResend = async () => {
      setCanResend(false)
      setCountdown(59)
      setOtpError(null)
      const r = await fetch(`/api/sign/${contractId}/send-otp`, { method: 'POST' })
      const d = await r.json()
      void d
    }

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 px-4 py-8 max-w-md mx-auto w-full">
          <h1 className="text-xl font-bold text-[#0D1B2A] mb-1">Подтвердите номер</h1>
          <p className="text-sm text-[#6B7E92] mb-6">
            Код отправлен на {contract.recipient_phone_masked ?? 'ваш номер'}
          </p>


          <div className="flex gap-2 justify-center mb-6">
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
                className="w-12 h-14 text-2xl text-center font-bold border border-[#A6C5D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/30 focus:border-[#0F52BA] transition-colors"
              />
            ))}
          </div>

          {otpError && (
            <p className="text-sm text-red-600 text-center mb-4">{otpError}</p>
          )}

          <button
            onClick={handleVerify}
            disabled={otpDigits.join('').length < 6 || verifyingOtp}
            className="w-full h-14 bg-[#0F52BA] hover:bg-blue-700 text-white text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors mb-4"
          >
            {verifyingOtp ? <Loader2 size={20} className="animate-spin" /> : 'Подтвердить'}
          </button>

          <div className="text-center text-sm text-[#6B7E92]">
            {canResend ? (
              <button onClick={handleResend} className="text-[#0F52BA] font-medium">
                Отправить повторно
              </button>
            ) : (
              <span>Отправить повторно через 0:{String(countdown).padStart(2, '0')}</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── PHONE VERIFICATION ────────────────────────────────────
  if (step === 'phone') {
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
          const r2 = await fetch(`/api/sign/${contractId}/send-otp`, { method: 'POST' })
          const d2 = await r2.json()
          setStep('otp')
        } else {
          setPhoneError(d.error ?? 'Номер не совпадает')
        }
      } catch {
        setPhoneError('Ошибка соединения')
      } finally {
        setVerifyingPhone(false)
        setSendingOtp(false)
      }
    }

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 px-4 py-8 max-w-md mx-auto w-full">
          <h1 className="text-xl font-bold text-[#0D1B2A] mb-1">Подтвердите ваш номер</h1>
          <p className="text-sm text-[#6B7E92] mb-6">
            Введите номер телефона, указанный в договоре
          </p>

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="+7 700 000 00 00"
            className="w-full h-12 border border-[#A6C5D7] rounded-xl px-4 text-base text-[#0D1B2A] placeholder:text-[#A6C5D7] focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/30 focus:border-[#0F52BA] transition-colors mb-2"
          />
          {phoneError && (
            <p className="text-sm text-red-600 mb-4">{phoneError}</p>
          )}

          <button
            onClick={handleVerifyPhone}
            disabled={phone.length < 11 || verifyingPhone || sendingOtp}
            className="w-full h-14 bg-[#0F52BA] hover:bg-blue-700 text-white text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors mt-4"
          >
            {verifyingPhone || sendingOtp ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              'Получить код'
            )}
          </button>
        </div>
      </div>
    )
  }

  // ─── MAIN FORM ─────────────────────────────────────────────
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
      } catch {
        // non-fatal
      } finally {
        setSubmitting(false)
      }
    }
    setStep('phone')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-5">
        {/* Org + contract info */}
        <div>
          <h1 className="text-lg font-bold text-[#0D1B2A]">{org.name}</h1>
          <p className="text-sm text-[#6B7E92] mt-0.5">{template.name}</p>
        </div>

        {/* Manager-filled data */}
        {managerFields.length > 0 && (
          <div className="bg-[#F7FAFC] rounded-2xl p-4 space-y-2.5">
            {managerFields.map((f) => {
              const val = contract.data[f.key]
              if (!val) return null
              return (
                <div key={f.key} className="flex justify-between items-start gap-3">
                  <span className="text-xs text-[#6B7E92] shrink-0 mt-0.5">{f.label}</span>
                  <span className="text-sm font-medium text-[#0D1B2A] text-right">{val}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Client fields */}
        {clientFields.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#0D1B2A]">Заполните ваши данные</h2>
            {clientFields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-[#6B7E92] mb-1">
                  {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  type={f.type === 'email' ? 'email' : f.type === 'phone' ? 'tel' : 'text'}
                  inputMode={f.type === 'iin' || f.type === 'number' ? 'numeric' : undefined}
                  value={clientData[f.key] ?? ''}
                  onChange={(e) => {
                    let val = e.target.value
                    if (f.type === 'iin') val = formatIIN(val)
                    setClientData((prev) => ({ ...prev, [f.key]: val }))
                  }}
                  placeholder={
                    f.type === 'iin' ? '123456789012' :
                    f.type === 'phone' ? '+7 700 000 00 00' :
                    f.label
                  }
                  className="w-full h-12 border border-[#A6C5D7] rounded-xl px-4 text-base text-[#0D1B2A] placeholder:text-[#A6C5D7] focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/30 focus:border-[#0F52BA] transition-colors"
                />
                {f.type === 'iin' && clientData[f.key] && clientData[f.key].length !== 12 && (
                  <p className="text-xs text-red-500 mt-1">ИИН должен содержать 12 цифр</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contract details toggle */}
        <div className="border border-[#D6E6F3] rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#0D1B2A] hover:bg-[#D6E6F3]/20 transition-colors"
          >
            Посмотреть полный договор
            {showDetails ? <ChevronUp size={16} strokeWidth={1.5} /> : <ChevronDown size={16} strokeWidth={1.5} />}
          </button>
          {showDetails && (
            <div className="border-t border-[#D6E6F3] px-4 py-4 space-y-2 bg-[#F7FAFC]">
              {template.fields.map((f) => (
                <div key={f.key} className="flex justify-between items-start gap-3">
                  <span className="text-xs text-[#6B7E92] shrink-0">{f.label}</span>
                  <span className="text-xs text-[#0D1B2A] text-right">
                    {contract.data[f.key] || clientData[f.key] || '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Consent */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-[#A6C5D7] accent-[#0F52BA] shrink-0 cursor-pointer"
          />
          <span className="text-sm text-[#6B7E92] leading-snug">
            Я ознакомлен(а) с условиями договора и даю согласие на обработку персональных данных
          </span>
        </label>

        {/* Sign button */}
        <button
          onClick={handleSignClick}
          disabled={!canSign || submitting}
          className="w-full h-14 bg-[#0F52BA] hover:bg-blue-700 text-white text-lg font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Подписать договор'}
        </button>

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
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#0F52BA] rounded-lg flex items-center justify-center">
          <FileText size={16} className="text-white" strokeWidth={1.5} />
        </div>
        <span className="font-bold text-base text-[#0D1B2A]">OneContract</span>
      </div>
    </header>
  )
}
