'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LayoutTemplate,
  User,
  Send,
  FileCheck,
  MessageSquare,
  Mail,
  AlertCircle,
} from 'lucide-react'
import type { Template, TemplateField } from '@/lib/types'

const STEPS = [
  { id: 1, label: 'Шаблон', icon: LayoutTemplate },
  { id: 2, label: 'Данные договора', icon: User },
  { id: 3, label: 'Способ отправки', icon: Send },
  { id: 4, label: 'Превью', icon: FileCheck },
]

type WizardState = {
  template: Template | null
  fieldValues: Record<string, string>
  sendChannel: 'sms' | 'email' | null
  recipientName: string
  recipientPhone: string
  recipientEmail: string
}

const INITIAL: WizardState = {
  template: null,
  fieldValues: {},
  sendChannel: null,
  recipientName: '',
  recipientPhone: '+7',
  recipientEmail: '',
}

function inputType(t: TemplateField['type']): string {
  if (t === 'date') return 'date'
  if (t === 'number') return 'number'
  if (t === 'phone' || t === 'iin') return 'tel'
  if (t === 'email') return 'email'
  return 'text'
}

function pluralFields(n: number): string {
  if (n === 1) return '1 поле'
  if (n >= 2 && n <= 4) return `${n} поля`
  return `${n} полей`
}

export default function NewContractWizardPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [state, setState] = useState<WizardState>(INITIAL)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .finally(() => setLoadingTemplates(false))
  }, [])

  function canProceed(): boolean {
    if (step === 1) return state.template !== null
    if (step === 2) {
      if (!state.template) return false
      return state.template.fields
        .filter((f) => f.required && (f.filled_by ?? 'manager') === 'manager')
        .every((f) => (state.fieldValues[f.key] ?? '').trim() !== '')
    }
    if (step === 3) {
      if (!state.sendChannel || !state.recipientName.trim()) return false
      if (state.sendChannel === 'sms') return state.recipientPhone.trim() !== ''
      return state.recipientEmail.trim() !== ''
    }
    return true
  }

  async function handleSubmit() {
    if (!state.template || !state.sendChannel) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: state.template.id,
          data: state.fieldValues,
          sent_via: state.sendChannel,
          recipient_name: state.recipientName,
          recipient_phone:
            state.sendChannel === 'sms' ? state.recipientPhone : undefined,
          recipient_email:
            state.sendChannel === 'email' ? state.recipientEmail : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Ошибка создания договора')
      router.push(`/dashboard/contracts/${json.contract.id}`)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/contracts"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text-dark transition-colors mb-3"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          К договорам
        </Link>
        <h1 className="text-2xl font-bold text-text-dark tracking-tight">Новый договор</h1>
      </div>

      {/* Step indicator */}
      <div className="bg-white border border-ice rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const active = step === s.id
            const done = step > s.id
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      done
                        ? 'bg-success text-white'
                        : active
                          ? 'bg-sapphire text-white'
                          : 'bg-ice text-muted'
                    }`}
                  >
                    {done ? (
                      <Check size={14} strokeWidth={2.5} />
                    ) : (
                      <Icon size={14} strokeWidth={1.5} />
                    )}
                  </div>
                  <span
                    className={`hidden sm:inline text-xs font-semibold ${
                      active ? 'text-text-dark' : 'text-muted'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`hidden sm:block flex-1 h-px mx-2 ${
                      done ? 'bg-success' : 'bg-ice'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white border border-ice rounded-2xl p-6 md:p-8 shadow-sm min-h-[360px] flex flex-col">
        <div className="flex-1">

          {/* STEP 1 — Template selection */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-text-dark mb-1 tracking-tight">
                Выберите шаблон
              </h2>
              <p className="text-sm text-muted mb-6">На основе шаблона будет создан договор</p>
              {loadingTemplates ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-24 rounded-xl bg-ice animate-pulse" />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12">
                  <LayoutTemplate
                    size={40}
                    strokeWidth={1.5}
                    className="text-muted mx-auto mb-3"
                  />
                  <p className="text-sm text-muted mb-4">Нет доступных шаблонов</p>
                  <Link
                    href="/dashboard/templates"
                    className="text-sm font-semibold text-sapphire hover:underline"
                  >
                    Создать шаблон →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setState((s) => ({ ...s, template: t, fieldValues: {} }))
                        setStep(2)
                      }}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        state.template?.id === t.id
                          ? 'border-sapphire bg-sapphire/5'
                          : 'border-ice hover:border-powder'
                      }`}
                    >
                      <p className="text-base font-semibold text-text-dark mb-1">{t.name}</p>
                      {t.description && (
                        <p className="text-sm text-muted line-clamp-2 mb-2">{t.description}</p>
                      )}
                      <p className="text-sm text-muted">{pluralFields(t.fields.length)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — Fill fields */}
          {step === 2 && state.template && (
            <div>
              <h2 className="text-lg font-semibold text-text-dark mb-1 tracking-tight">
                Данные договора
              </h2>
              <p className="text-sm text-muted mb-6">
                Шаблон:{' '}
                <span className="font-medium text-text-dark">{state.template.name}</span>
              </p>
              {(() => {
                const managerFields = state.template.fields.filter(
                  (f) => (f.filled_by ?? 'manager') === 'manager'
                )
                const clientFields = state.template.fields.filter(
                  (f) => f.filled_by === 'client'
                )
                const clientCount = clientFields.length
                const clientPlural =
                  clientCount === 1 ? 'поле' : clientCount < 5 ? 'поля' : 'полей'
                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {managerFields.map((field) => (
                        <div key={field.key}>
                          <label className="block text-xs font-semibold text-text-dark mb-1.5">
                            {field.label}
                            {field.required && <span className="text-danger ml-1">*</span>}
                          </label>
                          <input
                            type={inputType(field.type)}
                            value={state.fieldValues[field.key] ?? ''}
                            onChange={(e) =>
                              setState((s) => ({
                                ...s,
                                fieldValues: { ...s.fieldValues, [field.key]: e.target.value },
                              }))
                            }
                            placeholder={field.label}
                            className="w-full px-4 h-11 text-sm rounded-xl border border-ice bg-white text-text-dark placeholder:text-muted/60 focus:outline-none focus:border-sapphire transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                    {clientCount > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-ice text-xs text-muted flex items-center gap-2">
                        <User size={14} className="shrink-0 text-success" strokeWidth={1.5} />
                        {clientCount} {clientPlural} будут заполнены получателем при подписании
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}

          {/* STEP 3 — Send method */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-text-dark mb-1 tracking-tight">
                Способ отправки
              </h2>
              <p className="text-sm text-muted mb-6">
                Как клиент получит ссылку для подписания
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {(
                  [
                    ['sms', MessageSquare, 'SMS', 'Отправить ссылку по SMS'],
                    ['email', Mail, 'Email', 'Отправить ссылку по Email'],
                  ] as const
                ).map(([val, Icon, title, desc]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, sendChannel: val }))}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      state.sendChannel === val
                        ? 'border-sapphire bg-sapphire/5'
                        : 'border-ice hover:border-powder'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        state.sendChannel === val
                          ? 'bg-sapphire text-white'
                          : 'bg-ice text-muted'
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-dark">{title}</p>
                      <p className="text-xs text-muted">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {state.sendChannel && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-dark mb-1.5">
                      Имя клиента <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={state.recipientName}
                      onChange={(e) =>
                        setState((s) => ({ ...s, recipientName: e.target.value }))
                      }
                      placeholder="Иванов Иван"
                      className="w-full px-4 h-11 text-sm rounded-xl border border-ice bg-white text-text-dark placeholder:text-muted/60 focus:outline-none focus:border-sapphire transition-colors"
                    />
                  </div>
                  {state.sendChannel === 'sms' ? (
                    <div>
                      <label className="block text-xs font-semibold text-text-dark mb-1.5">
                        Телефон <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        value={state.recipientPhone}
                        onChange={(e) => {
                          const v = e.target.value
                          setState((s) => ({ ...s, recipientPhone: v.startsWith('+7') ? v : '+7' }))
                        }}
                        placeholder="+7 700 000 00 00"
                        className="w-full px-4 h-11 text-sm rounded-xl border border-ice bg-white text-text-dark placeholder:text-muted/60 focus:outline-none focus:border-sapphire transition-colors"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-text-dark mb-1.5">
                        Email <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        value={state.recipientEmail}
                        onChange={(e) =>
                          setState((s) => ({ ...s, recipientEmail: e.target.value }))
                        }
                        placeholder="client@email.com"
                        className="w-full px-4 h-11 text-sm rounded-xl border border-ice bg-white text-text-dark placeholder:text-muted/60 focus:outline-none focus:border-sapphire transition-colors"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Preview */}
          {step === 4 && state.template && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-text-dark mb-1 tracking-tight">
                  Превью договора
                </h2>
                <p className="text-sm text-muted">Проверьте данные перед отправкой</p>
              </div>

              <div className="rounded-xl border border-ice p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
                  Шаблон
                </p>
                <p className="text-sm font-semibold text-text-dark">{state.template.name}</p>
              </div>

              <div className="rounded-xl border border-ice p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                  Данные
                </p>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {state.template.fields.map((f) => (
                    <div key={f.key}>
                      <dt className="text-xs text-muted">{f.label}</dt>
                      <dd className="text-sm font-medium text-text-dark truncate">
                        {state.fieldValues[f.key] || '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-xl border border-ice p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                  Отправка
                </p>
                <div className="space-y-1.5">
                  <div className="flex gap-2 text-sm">
                    <span className="text-muted w-20 flex-shrink-0">Канал:</span>
                    <span className="font-medium text-text-dark">
                      {state.sendChannel === 'sms' ? 'SMS' : 'Email'}
                    </span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="text-muted w-20 flex-shrink-0">Клиент:</span>
                    <span className="font-medium text-text-dark">{state.recipientName}</span>
                  </div>
                  {state.sendChannel === 'sms' && state.recipientPhone && (
                    <div className="flex gap-2 text-sm">
                      <span className="text-muted w-20 flex-shrink-0">Телефон:</span>
                      <span className="font-medium text-text-dark">{state.recipientPhone}</span>
                    </div>
                  )}
                  {state.sendChannel === 'email' && state.recipientEmail && (
                    <div className="flex gap-2 text-sm">
                      <span className="text-muted w-20 flex-shrink-0">Email:</span>
                      <span className="font-medium text-text-dark">{state.recipientEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {submitError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 text-danger text-sm">
                  <AlertCircle size={16} strokeWidth={1.5} />
                  {submitError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-ice pt-5 mt-5">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="inline-flex items-center gap-2 h-11 px-5 text-base font-medium text-muted hover:text-text-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            Назад
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              disabled={!canProceed()}
              className="inline-flex items-center gap-2 h-11 px-6 bg-sapphire hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-base"
            >
              Далее
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 h-11 px-6 bg-sapphire hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-base"
            >
              {submitting ? 'Создаём…' : 'Создать и отправить'}
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
