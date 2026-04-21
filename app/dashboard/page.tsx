import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <DashboardHeader />

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-dark mb-3 tracking-tight">
            Добро пожаловать!
          </h1>
          <p className="text-base text-muted leading-relaxed">
            Скоро здесь будут ваши договоры.
          </p>
        </div>
      </main>
    </div>
  )
}
