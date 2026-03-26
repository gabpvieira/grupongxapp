import React, { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react'
import { Tarefa } from '@/types/tarefas'
import BadgePrioridade from '@/components/tarefas/BadgePrioridade'

interface CalendarioViewProps {
  tarefas: Tarefa[]
  onOpenCreateModal?: () => void
}

export function CalendarioView({ tarefas, onOpenCreateModal }: CalendarioViewProps) {
  const [mesAtual, setMesAtual] = useState(new Date())
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null)

  // Navegação
  const mesAnterior = () => setMesAtual(prev => subMonths(prev, 1))
  const proximoMes = () => setMesAtual(prev => addMonths(prev, 1))
  const irParaHoje = () => {
    const hoje = new Date()
    setMesAtual(hoje)
    setDiaSelecionado(hoje)
  }

  // Gerar grade de 42 dias (6 linhas × 7 colunas)
  const diasDoMes: Date[] = eachDayOfInterval({
    start: startOfWeek(startOfMonth(mesAtual), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(mesAtual), { weekStartsOn: 0 }),
  })

  // Tarefas pelo vencimento no dia
  const getTarefasDoDia = (dia: Date): Tarefa[] => {
    const dateStr = format(dia, 'yyyy-MM-dd')
    return tarefas.filter(t => t.data_vencimento === dateStr)
  }

  // Contagem de tarefas do mês atual
  const totalMes = tarefas.filter(t => {
    if (!t.data_vencimento) return false
    const d = new Date(t.data_vencimento + 'T00:00:00')
    return isSameMonth(d, mesAtual)
  }).length

  const tarefasDoDiaSelecionado = diaSelecionado ? getTarefasDoDia(diaSelecionado) : []

  const chipColor = (t: Tarefa) => {
    if (t.status === 'concluido') return 'bg-[#a3e635]/10 text-[#a3e635]/60'
    if (t.prioridade === 'alta') return 'bg-red-500/15 text-red-300'
    if (t.prioridade === 'media') return 'bg-amber-500/15 text-amber-300'
    return 'bg-white/8 text-white/50'
  }

  const statusDot = (status: string) => {
    if (status === 'concluido') return 'bg-[#a3e635]'
    if (status === 'em-andamento') return 'bg-blue-400'
    return 'bg-white/25'
  }

  return (
    <div className="w-full">
      {/* ── BLOCO 1: Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white text-2xl font-bold tracking-tight capitalize">
            {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <p className="text-white/30 text-xs mt-0.5">
            {totalMes} tarefa{totalMes !== 1 ? 's' : ''} neste mês
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={mesAnterior}
            className="w-8 h-8 rounded-lg bg-[#0d0d0d] border border-white/8
              flex items-center justify-center text-white/40
              hover:border-white/20 hover:text-white/70 transition-all"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={irParaHoje}
            className="h-8 px-4 rounded-lg bg-[#0d0d0d] border border-white/8
              text-white/50 text-xs font-medium
              hover:border-white/20 hover:text-white/70 transition-all"
          >
            Hoje
          </button>
          <button
            onClick={proximoMes}
            className="w-8 h-8 rounded-lg bg-[#0d0d0d] border border-white/8
              flex items-center justify-center text-white/40
              hover:border-white/20 hover:text-white/70 transition-all"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── BLOCO 2: Header dias da semana ─────────────────────────── */}
      <div className="grid grid-cols-7 mb-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div
            key={d}
            className="text-center text-[11px] font-semibold text-white/25
              uppercase tracking-wider py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── BLOCO 3: Grade de células ──────────────────────────────── */}
      <div className="grid grid-cols-7 gap-1">
        {diasDoMes.map(dia => {
          const tarefasDoDia = getTarefasDoDia(dia)
          const ehHoje = isToday(dia)
          const ehMesAtual = isSameMonth(dia, mesAtual)
          const selecionado = diaSelecionado ? isSameDay(dia, diaSelecionado) : false
          const temAtrasada = tarefasDoDia.some(
            t =>
              t.data_vencimento &&
              isBefore(new Date(t.data_vencimento + 'T00:00:00'), new Date()) &&
              t.status !== 'concluido',
          )

          return (
            <button
              key={dia.toISOString()}
              onClick={() => {
                if (!ehMesAtual) return
                setDiaSelecionado(selecionado ? null : dia)
              }}
              className={`
                relative min-h-[88px] rounded-xl p-2 text-left flex flex-col
                transition-all border outline-none
                ${
                  !ehMesAtual
                    ? 'opacity-25 cursor-default border-transparent bg-transparent'
                    : selecionado
                      ? 'bg-[#a3e635]/10 border-[#a3e635]/30'
                      : 'bg-[#0d0d0d] border-white/5 hover:border-white/12 hover:bg-[#111] cursor-pointer'
                }
              `}
            >
              {/* Número do dia */}
              <span
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center
                  text-xs font-bold mb-1.5 flex-shrink-0
                  ${
                    ehHoje
                      ? 'bg-[#a3e635] text-black'
                      : selecionado
                        ? 'text-[#a3e635]'
                        : 'text-white/50'
                  }
                `}
              >
                {format(dia, 'd')}
              </span>

              {/* Chips de tarefas — máx 2 visíveis */}
              <div className="flex flex-col gap-0.5 w-full flex-1">
                {tarefasDoDia.slice(0, 2).map(t => (
                  <div
                    key={t.id}
                    className={`
                      w-full px-1.5 py-0.5 rounded-md text-[10px] font-medium
                      truncate leading-snug
                      ${chipColor(t)}
                      ${t.status === 'concluido' ? 'line-through' : ''}
                    `}
                  >
                    {t.titulo}
                  </div>
                ))}
                {tarefasDoDia.length > 2 && (
                  <span className="text-[10px] text-white/30 px-1">
                    +{tarefasDoDia.length - 2} mais
                  </span>
                )}
              </div>

              {/* Dot de atrasada */}
              {temAtrasada && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-400" />
              )}
            </button>
          )
        })}
      </div>

      {/* ── BLOCO 4: Painel de detalhes inline ─────────────────────── */}
      {diaSelecionado && tarefasDoDiaSelecionado.length > 0 && (
        <div
          className="mt-4 bg-[#0d0d0d] border border-white/8 rounded-xl p-4
            animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Header do painel */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-semibold text-sm capitalize">
                {format(diaSelecionado, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-white/30 text-xs">
                {tarefasDoDiaSelecionado.length} tarefa
                {tarefasDoDiaSelecionado.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setDiaSelecionado(null)}
              className="text-white/25 hover:text-white/60 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Lista de tarefas do dia */}
          <div className="flex flex-col gap-2">
            {tarefasDoDiaSelecionado.map(t => (
              <div
                key={t.id}
                className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
              >
                {/* Status dot */}
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(t.status)}`}
                />

                {/* Título + descrição */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      t.status === 'concluido'
                        ? 'text-white/35 line-through'
                        : 'text-white/80'
                    }`}
                  >
                    {t.titulo}
                  </p>
                  {t.descricao && (
                    <p className="text-white/25 text-xs truncate mt-0.5">
                      {t.descricao}
                    </p>
                  )}
                </div>

                {/* Badge prioridade */}
                <BadgePrioridade prioridade={t.prioridade} />

                {/* Avatar responsável */}
                {t.responsavel_nome && (
                  <div
                    className="w-6 h-6 rounded-full bg-[#a3e635]/20
                      border border-[#a3e635]/30 flex items-center justify-center
                      text-[#a3e635] text-[10px] font-bold flex-shrink-0"
                  >
                    {t.responsavel_nome[0].toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado: dia selecionado mas sem tarefas */}
      {diaSelecionado && tarefasDoDiaSelecionado.length === 0 && (
        <div
          className="mt-4 bg-[#0d0d0d] border border-dashed border-white/8
            rounded-xl p-6 text-center animate-in fade-in duration-200"
        >
          <p className="text-white/20 text-sm">
            Nenhuma tarefa em{' '}
            <span className="text-white/35 font-medium capitalize">
              {format(diaSelecionado, "d 'de' MMMM", { locale: ptBR })}
            </span>
          </p>
          {onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="mt-3 text-[#a3e635]/60 hover:text-[#a3e635] text-xs
                transition-colors flex items-center gap-1 mx-auto"
            >
              <Plus size={12} /> Criar tarefa neste dia
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default CalendarioView
