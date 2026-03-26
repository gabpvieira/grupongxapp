import React, { useState, useEffect, useMemo } from 'react'
import { useTarefas } from '@/hooks/useTarefas'
import { Tarefa } from '@/types/tarefas'
import { useCronometro } from '@/hooks/useCronometro'
import { CronometroDisplay } from '@/components/tarefas/CronometroDisplay'
import { CronometroButton } from '@/components/tarefas/CronometroButton'
import { useVendedores } from '@/hooks/useVendedores'
import { useToast } from '@/hooks/use-toast'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import {
  useDroppable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  Activity,
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  CheckCircle2,
  CheckSquare,
  Circle,
  AlertCircle,
  AlertTriangle,
  Flag,
  User,
  CalendarDays,
  List,
  Kanban,
  Edit3,
  Trash2,
  GripVertical,
  Bell,
  Timer,
  Target,
  LayoutGrid,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Lightbulb,
  RotateCcw,
  EyeOff,
  Archive,
  History,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { NgxDatePicker } from "@/components/ui/NgxDatePicker";
import { NovaTarefaModal } from "@/components/tarefas/NovaTarefaModal";

// Novos componentes extraídos
import KanbanColuna from '@/components/tarefas/KanbanColuna'
import BadgePrioridade from '@/components/tarefas/BadgePrioridade'
import CalendarioView from '@/components/tarefas/CalendarioView'
import ArquivoDrawer from '@/components/tarefas/ArquivoDrawer'
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterSelect } from '@/components/ui/FilterSelect';


type ViewMode = 'kanban' | 'list' | 'calendar'
type FilterStatus = 'all' | 'a-fazer' | 'em-andamento' | 'concluido'
type FilterPriority = 'all' | 'baixa' | 'media' | 'alta'

// Função para formatar data ISO para formato brasileiro
function formatDateToBR(isoDate: string): string {
  if (!isoDate) return ""
  const date = new Date(isoDate + "T00:00:00")
  return format(date, "dd/MM/yyyy", { locale: ptBR })
}

interface TaskModalProps {
  tarefa: Tarefa | null
  isOpen: boolean
  onClose: () => void
  onSave: (tarefa: Tarefa) => void
  refetchTarefa: (id: string) => Promise<void>
}

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (tarefa: any) => void
}

const priorityColors = {
  baixa: 'bg-white/8 text-white/40 border-white/12',
  media: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  alta: 'bg-red-500/15 text-red-400 border-red-500/25'
}

const statusColors = {
  'a-fazer': 'bg-white/5 text-white/40 border-white/10',
  'em-andamento': 'bg-[#a3e635]/10 text-[#a3e635] border-[#a3e635]/20',
  'concluido': 'bg-green-500/10 text-green-400 border-green-500/20'
}


function KanbanView({ tarefas, onEdit, onDelete, refetchTarefa, onDragEnd, mostrarConcluidas, toggleConcluidas, onUpdateStatus, onOpenArquivo }: {
  tarefas: Tarefa[]
  onEdit: (tarefa: Tarefa) => void
  onDelete: (id: string) => void
  refetchTarefa: (id: string) => Promise<void>
  onDragEnd: (event: DragEndEvent) => void
  mostrarConcluidas: boolean
  toggleConcluidas: () => void
  onUpdateStatus: (id: string, status: any) => Promise<void>
  onOpenArquivo: () => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const columns = [
    { id: 'a-fazer', title: 'A Fazer', cor: 'white/40' },
    { id: 'em-andamento', title: 'Em Progresso', cor: 'blue-400' },
    { id: 'concluido', title: 'Concluído', cor: '[#a3e635]' }
  ]

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((column) => (
          <KanbanColuna
            key={column.id}
            id={column.id}
            titulo={column.title}
            cor={column.cor}
            tarefas={tarefas.filter(t => t.status === column.id)}
            onEdit={onEdit}
            onDelete={onDelete}
            refetchTarefa={refetchTarefa}
            mostrarConcluidas={mostrarConcluidas}
            toggleConcluidas={toggleConcluidas}
            onUpdateStatus={onUpdateStatus}
            onOpenArquivo={onOpenArquivo}
          />
        ))}
      </div>
    </DndContext>
  )
}

function TarefaListItem({ 
  tarefa, 
  vendedores, 
  onEdit, 
  onDelete, 
  refetchTarefa 
}: { 
  tarefa: Tarefa, 
  vendedores: any[], 
  onEdit: (t: Tarefa) => void, 
  onDelete: (id: string) => void,
  refetchTarefa: (id: string) => Promise<void>
}) {
  const { displaySeconds, iniciar, pausar, resetar, rodando } = useCronometro(tarefa, refetchTarefa)
  
  const checklist = tarefa.checklist || []
  const completedChecklist = tarefa.checklist_concluidos || checklist.filter(item => item.done || item.concluido).length
  const totalChecklist = tarefa.total_checklist || checklist.length
  
  const isOverdue = tarefa.data_vencimento && 
    new Date(tarefa.data_vencimento) < new Date() && 
    tarefa.status !== 'concluido'

  return (
    <Card 
      className={`group transition-all duration-200 cursor-pointer bg-[#0d0d0d] border-white/5 hover:border-white/10 ${
        tarefa.status === 'concluido' ? 'opacity-60' : 'hover:bg-[#121212]'
      } ${
        rodando ? 'border-l-2 border-l-[#a3e635]' : ''
      }`}
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (!target.closest('button')) {
          onEdit(tarefa);
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white/90 truncate">{tarefa.titulo}</h3>
              {rodando && (
                <Badge className="h-4 px-1 text-[8px] bg-[#a3e635]/10 text-[#a3e635] border-[#a3e635]/20 animate-pulse">
                  AO VIVO
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={`h-4 text-[10px] py-0 border-white/5 ${priorityColors[tarefa.prioridade]}`}>
                {tarefa.prioridade}
              </Badge>
              {tarefa.data_vencimento && (
                <span className={`text-[10px] ${isOverdue ? 'text-red-400' : 'text-white/40'}`}>
                  {formatDateToBR(tarefa.data_vencimento)}
                </span>
              )}
              {totalChecklist > 0 && (
                <span className="text-[10px] text-white/40">
                  {completedChecklist}/{totalChecklist} checklist
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <CronometroDisplay seconds={displaySeconds} isExecuting={rodando} />
            
            <div className="flex items-center gap-4">
              {tarefa.status !== 'concluido' ? (
                <CronometroButton 
                  rodando={rodando} 
                  onStart={iniciar} 
                  onPause={pausar}
                  onReset={resetar}
                  size="sm"
                  showReset={!rodando && displaySeconds > 0}
                />
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                  bg-[#a3e635]/10 border border-[#a3e635]/20
                  text-[#a3e635] text-[11px] font-semibold flex-shrink-0">
                  <CheckCircle2 size={11} />
                  Concluído
                </span>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/5">
                    <MoreHorizontal size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0d0d0d] border-white/10">
                  <DropdownMenuItem onClick={() => onEdit(tarefa)} className="text-white/70 focus:bg-white/5 focus:text-white">
                    <Edit3 className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(tarefa.id)} className="text-red-400 focus:bg-red-400/10 focus:text-red-400">
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ListView({ tarefas, onEdit, onDelete, refetchTarefa }: {
  tarefas: Tarefa[]
  onEdit: (tarefa: Tarefa) => void
  onDelete: (id: string) => void
  refetchTarefa: (id: string) => Promise<void>
}) {
  const { vendedores } = useVendedores()

  return (
    <div className="space-y-3">
      {tarefas.map((tarefa) => (
        <TarefaListItem 
          key={tarefa.id}
          tarefa={tarefa}
          vendedores={vendedores}
          onEdit={onEdit}
          onDelete={onDelete}
          refetchTarefa={refetchTarefa}
        />
      ))}
      
      {tarefas.length === 0 && (
        <div className="text-center py-16 bg-[#0d0d0d] rounded-lg border border-dashed border-white/10">
          <List className="h-8 w-8 mx-auto mb-3 text-white/20" />
          <h3 className="text-sm font-medium text-white/60">Nenhuma tarefa encontrada</h3>
        </div>
      )}
    </div>
  )
}


// CalendarView extraído para @/components/tarefas/CalendarioView.tsx


export default function Tarefas() {
  const {
    tarefas,
    loading,
    error,
    addTarefa,
    updateTarefa,
    updateTarefaCompleta,
    deleteTarefa,
    getTarefasPorStatus,
    refetchTarefa,
    refetch,
    fetchArquivadas
  } = useTarefas()
  
  const [isArquivoOpen, setIsArquivoOpen] = useState(false)
  const [arquivadas, setArquivadas] = useState<Tarefa[]>([])
  
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [selectedTask, setSelectedTask] = useState<Tarefa | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Persistir em localStorage para manter entre recargas
  const [mostrarConcluidas, setMostrarConcluidas] = useState<boolean>(() => {
    return localStorage.getItem('ngx_mostrar_concluidas') === 'true';
  });

  const toggleConcluidas = () => {
    const novoEstado = !mostrarConcluidas;
    setMostrarConcluidas(novoEstado);
    localStorage.setItem('ngx_mostrar_concluidas', String(novoEstado));
  };

  const loadArquivadas = async () => {
    const data = await fetchArquivadas()
    setArquivadas(data)
  }

  useEffect(() => {
    loadArquivadas()
  }, [])

  // Filtrar tarefas
  const filteredTasks = tarefas.filter(tarefa => {
    const matchesSearch = tarefa.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tarefa.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesStatus = filterStatus === 'all' || tarefa.status === filterStatus
    const matchesPriority = filterPriority === 'all' || tarefa.prioridade === filterPriority
    
    // Se não for Kanban, respeitar o toggle de mostrarConcluidas globalmente no filtro
    const matchesConcluidas = viewMode === 'kanban' || mostrarConcluidas || tarefa.status !== 'concluido'

    return matchesSearch && matchesStatus && matchesPriority && matchesConcluidas;
  })

  // Estatísticas
  const stats = {
    total: tarefas.length,
    aFazer: getTarefasPorStatus('a-fazer').length,
    emAndamento: getTarefasPorStatus('em-andamento').length,
    concluido: getTarefasPorStatus('concluido').length
  }

  const handleEditTask = (tarefa: Tarefa) => {
    setSelectedTask(tarefa)
    setIsTaskModalOpen(true)
  }

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTarefa(id)
      toast({
        title: 'Sucesso',
        description: 'Tarefa excluída com sucesso!'
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir tarefa',
        variant: 'destructive'
      })
    }
  }


  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Encontrar a tarefa sendo movida
    const activeTask = tarefas.find(t => t.id === activeId)
    if (!activeTask) return

    // Determinar o novo status baseado na coluna de destino
    let newStatus: 'a-fazer' | 'em-andamento' | 'concluido'
    
    // Primeiro, verificar se foi solto diretamente em uma coluna
    if (overId === 'a-fazer' || overId === 'em-andamento' || overId === 'concluido') {
      newStatus = overId
    } else {
      // Se foi solto sobre uma tarefa, usar o status da coluna dessa tarefa
      const overTask = tarefas.find(t => t.id === overId)
      if (overTask) {
        newStatus = overTask.status
      } else {
        return
      }
    }

    // Se o status não mudou, não fazer nada
    if (activeTask.status === newStatus) return

    try {
      await updateTarefa(activeId, { status: newStatus })
      toast({
        title: 'Sucesso',
        description: `Tarefa movida para "${newStatus === 'a-fazer' ? 'A Fazer' : newStatus === 'em-andamento' ? 'Em Progresso' : 'Concluído'}"!`
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status da tarefa',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#a3e635]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2 text-white">Erro ao carregar tarefas</h3>
          <p className="text-white/40">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <PageLayout>
      <PageHeader
        icon={<CheckSquare size={18} className="text-[#a3e635]" />}
        title="Gestão de Tarefas"
        subtitle={`${stats.aFazer + stats.emAndamento} ativas · ${stats.concluido} concluídas`}
        action={
          <button onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-[#a3e635] hover:bg-[#84cc16] text-black font-bold text-sm
              transition-all shadow-[0_0_16px_rgba(163,230,53,0.15)]
              active:scale-[0.98]">
            <Plus size={15} strokeWidth={2.5} /> Nova Tarefa
          </button>
        }
      >
        {/* BLOCO 3 — Barra de controles (filtros + toggle de view) */}
        <div className="flex flex-col md:flex-row items-center gap-2 mt-4">
          <div className="relative w-full md:w-56 group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-[#a3e635] transition-colors" />
            <input 
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full bg-white/5 rounded-lg
                pl-8 pr-3 text-sm text-white placeholder:text-white/25
                focus:outline-none focus:bg-white/10 transition-all border border-white/5 focus:border-white/10"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <FilterSelect
              value={filterStatus || 'all'}
              onChange={(val) => setFilterStatus(val as any)}
              options={[
                { value: 'all',          label: 'Todos os status' },
                { value: 'a-fazer',      label: 'A Fazer' },
                { value: 'em-andamento', label: 'Em Progresso' },
                { value: 'concluido',    label: 'Concluído' },
              ]}
              className="w-full md:w-auto"
            />

            <FilterSelect
              value={filterPriority || 'all'}
              onChange={(val) => setFilterPriority(val as any)}
              options={[
                { value: 'all',   label: 'Todas as prioridades' },
                { value: 'alta',  label: 'Alta' },
                { value: 'media', label: 'Média' },
                { value: 'baixa', label: 'Baixa' },
              ]}
              className="w-full md:w-auto"
            />

            {/* Toggle view — empurrado para a direita */}
            <div className="md:ml-auto flex items-center gap-4">
              {/* Toggle Lista Rápido */}
              {viewMode === 'list' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleConcluidas}
                    className={`
                      relative inline-flex items-center
                      w-10 h-6 rounded-full transition-colors duration-200
                      ${mostrarConcluidas ? 'bg-[#a3e635]' : 'bg-white/15'}
                    `}
                    role="switch"
                    aria-checked={mostrarConcluidas}
                  >
                    <span className={`
                      absolute left-0.5 w-5 h-5 rounded-full bg-white
                      shadow-sm transition-transform duration-200
                      ${mostrarConcluidas ? 'translate-x-4' : 'translate-x-0'}
                    `} />
                  </button>
                  <span className="text-white/50 text-xs font-semibold select-none">
                    Mostrar concluídas
                  </span>
                </div>
              )}

              <button
                onClick={() => setIsArquivoOpen(true)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg
                  bg-white/5 border border-white/8 text-white/35 text-xs font-medium
                  hover:border-white/20 hover:text-white/60 transition-all"
              >
                <Archive size={13} />
                Arquivo
                {arquivadas.length > 0 && (
                  <span className="bg-white/10 text-white/40 text-[10px] font-bold
                    rounded-full px-1.5 py-0.5 ml-0.5">
                    {arquivadas.length}
                  </span>
                )}
              </button>

              <div className="flex items-center bg-white/5
                rounded-lg p-0.5 gap-0.5 border border-white/5">
                {[
                  { id: 'kanban', icon: Kanban, label: 'Kanban' },
                  { id: 'list', icon: List, label: 'Lista' },
                  { id: 'calendar', icon: Calendar, label: 'Calendário' }
                ].map(view => (
                  <button 
                    key={view.id}
                    onClick={() => setViewMode(view.id as any)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                      ${viewMode === view.id
                        ? 'bg-[#a3e635] text-black shadow-sm'
                        : 'text-white/40 hover:text-white/70'}
                    `}
                  >
                    <view.icon size={13} />
                    <span>{view.label === 'Calendário' ? 'Cal.' : view.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageHeader>

      <div className="p-6">
        {/* BLOCO 2 — KPIs (4 cards compactos em linha) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {/* Total */}
          <div className="bg-[#0b0b0b] border border-white/5 rounded-xl px-4 py-3
            flex items-center justify-between hover:bg-[#111111] transition-all">
            <div>
              <p className="text-white/35 text-[11px] font-semibold uppercase tracking-wider mb-1">Total</p>
              <p className="text-white text-2xl font-bold leading-none">{stats.total}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/4 flex items-center justify-center">
              <LayoutGrid size={15} className="text-white/30" />
            </div>
          </div>
          {/* A Fazer */}
          <div className="bg-[#0b0b0b] border border-white/5 rounded-xl px-4 py-3
            flex items-center justify-between hover:bg-[#111111] transition-all">
            <div>
              <p className="text-white/35 text-[11px] font-semibold uppercase tracking-wider mb-1">A Fazer</p>
              <p className="text-white/60 text-2xl font-bold leading-none">{stats.aFazer}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/4 flex items-center justify-center">
              <Circle size={15} className="text-white/30" />
            </div>
          </div>
          {/* Em Progresso */}
          <div className="bg-[#0b0b0b] border border-white/5 rounded-xl px-4 py-3
            flex items-center justify-between hover:bg-[#111111] transition-all">
            <div>
              <p className="text-white/35 text-[11px] font-semibold uppercase tracking-wider mb-1">Em Progresso</p>
              <p className="text-blue-400 text-2xl font-bold leading-none">{stats.emAndamento}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/4 flex items-center justify-center">
              <Clock size={15} className="text-white/30" />
            </div>
          </div>
          {/* Concluído */}
          <div className="bg-[#0b0b0b] border border-white/5 rounded-xl px-4 py-3
            flex items-center justify-between hover:bg-[#111111] transition-all">
            <div>
              <p className="text-white/35 text-[11px] font-semibold uppercase tracking-wider mb-1">Concluído</p>
              <div className="flex items-center gap-1.5 leading-none">
                <p className="text-[#a3e635] text-2xl font-bold">{stats.concluido}</p>
                <span className="text-white/20 text-[10px] font-medium mt-1">
                  {mostrarConcluidas ? '(visíveis)' : '(ocultas)'}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/4 flex items-center justify-center">
              <CheckCircle2 size={15} className="text-white/30" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {viewMode === 'kanban' && (
            <KanbanView
              tarefas={filteredTasks}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              refetchTarefa={refetchTarefa}
              onDragEnd={handleDragEnd}
              mostrarConcluidas={mostrarConcluidas}
              toggleConcluidas={toggleConcluidas}
              onUpdateStatus={updateTarefa}
              onOpenArquivo={() => setIsArquivoOpen(true)}
            />
          )}
          
          {viewMode === 'list' && (
            <ListView
              tarefas={filteredTasks}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              refetchTarefa={refetchTarefa}
            />
          )}
          
          {viewMode === 'calendar' && (
            <CalendarioView
              tarefas={filteredTasks}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <NovaTarefaModal
        tarefa={selectedTask}
        isOpen={isCreateModalOpen || isTaskModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setIsTaskModalOpen(false)
          setSelectedTask(null)
        }}
        refetch={refetch}
      />

      <ArquivoDrawer 
        aberto={isArquivoOpen}
        fechar={() => setIsArquivoOpen(false)}
        arquivadas={arquivadas}
      />
    </PageLayout>
  )
}