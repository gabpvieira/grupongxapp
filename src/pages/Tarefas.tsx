import React, { useState, useEffect } from 'react'
import { useTarefas, type Tarefa } from '@/hooks/useTarefas'
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Lightbulb
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Toast } from '@/components/ui/toast'
import { DatePicker } from '@/components/ui/date-picker'
import { TimeInput } from '@/components/ui/time-input'
import { ReminderSelect } from '@/components/ui/reminder-select'
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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
}

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (tarefa: any) => void
}

const priorityColors = {
  baixa: 'bg-green-500/10 text-green-400 border-green-500/20',
  media: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  alta: 'bg-red-500/10 text-red-400 border-red-500/20'
}

const statusColors = {
  'a-fazer': 'bg-slate-700/50 text-slate-300 border-slate-600/50',
  'em-andamento': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'concluido': 'bg-green-500/10 text-green-400 border-green-500/20'
}

function TaskModal({ tarefa, isOpen, onClose, onSave }: TaskModalProps) {
  const [editedTarefa, setEditedTarefa] = useState<Tarefa | null>(null)
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const { vendedores } = useVendedores()

  useEffect(() => {
    if (tarefa) {
      setEditedTarefa({ ...tarefa })
    }
  }, [tarefa])

  if (!editedTarefa) return null

  const handleSave = () => {
    onSave(editedTarefa)
    onClose()
  }

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem = {
        id: Date.now().toString(),
        tarefa_id: editedTarefa.id,
        texto: newChecklistItem.trim(),
        text: newChecklistItem.trim(),
        concluido: false,
        done: false,
        ordem: (editedTarefa.checklist || []).length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setEditedTarefa({
        ...editedTarefa,
        checklist: [...(editedTarefa.checklist || []), newItem]
      })
      setNewChecklistItem('')
    }
  }

  const toggleChecklistItem = (index: number) => {
    const updatedChecklist = [...(editedTarefa.checklist || [])]
    updatedChecklist[index] = {
      ...updatedChecklist[index],
      done: !updatedChecklist[index].done,
      concluido: !updatedChecklist[index].concluido
    }
    setEditedTarefa({
      ...editedTarefa,
      checklist: updatedChecklist
    })
  }

  const removeChecklistItem = (index: number) => {
    const checklist = editedTarefa.checklist || []
    const updatedChecklist = checklist.filter((_, i) => i !== index)
    setEditedTarefa({
      ...editedTarefa,
      checklist: updatedChecklist
    })
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  // Verificação de segurança para checklist
  const checklist = editedTarefa.checklist || []
  const completedChecklist = checklist.filter(item => item.done || item.concluido).length
  const totalChecklist = checklist.length
  const checklistProgress = totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col backdrop-blur-sm border-slate-700/50" style={{ backgroundColor: '#020817' }}>
        <DialogHeader className="pb-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl text-slate-200">
              <div className="p-2 bg-[#8bdb00]/10 rounded-lg">
                <Edit3 className="h-5 w-5 text-[#8bdb00]" />
              </div>
              Editar Tarefa
            </DialogTitle>
            <div className="flex items-center gap-2">
              {editedTarefa.tempo_rastreado > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Timer className="h-3 w-3" />
                  {formatTime(editedTarefa.tempo_rastreado)}
                </Badge>
              )}
              <Badge variant="outline" className={priorityColors[editedTarefa.prioridade]}>
                <Flag className="h-3 w-3 mr-1" />
                {editedTarefa.prioridade}
              </Badge>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo" className="text-sm font-medium text-slate-200">Título</Label>
                  <Input
                    id="titulo"
                    value={editedTarefa.titulo}
                    onChange={(e) => setEditedTarefa({ ...editedTarefa, titulo: e.target.value })}
                    placeholder="Digite o título da tarefa"
                    className="text-lg font-medium bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder:text-slate-400 focus:border-[#8bdb00]/50 focus:ring-[#8bdb00]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-sm font-medium text-slate-200">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={editedTarefa.descricao || ''}
                    onChange={(e) => setEditedTarefa({ ...editedTarefa, descricao: e.target.value })}
                    placeholder="Digite a descrição da tarefa"
                    rows={4}
                    className="resize-none bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder:text-slate-400 focus:border-[#8bdb00]/50 focus:ring-[#8bdb00]/20"
                  />
                </div>
              </div>

              {/* Checklist Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-[#8bdb00]" />
                    <Label className="text-base font-medium text-slate-200">Checklist</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1 bg-slate-700/50 text-slate-300 border-slate-600/50">
                      {completedChecklist} / {totalChecklist}
                    </Badge>
                    {totalChecklist > 0 && (
                      <div className="w-16 bg-slate-700/50 rounded-full h-2">
                        <div
                          className="bg-[#8bdb00] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${checklistProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(editedTarefa.checklist || []).map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors border border-slate-600/50">
                      <Checkbox
                        checked={item.done || item.concluido}
                        onCheckedChange={() => toggleChecklistItem(index)}
                      />
                      <span className={`flex-1 text-slate-200 ${item.done || item.concluido ? 'line-through text-slate-400' : ''}`}>
                        {item.text || item.texto}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChecklistItem(index)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="Adicionar item ao checklist"
                    onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                    className="flex-1 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder:text-slate-400 focus:border-[#8bdb00]/50 focus:ring-[#8bdb00]/20"
                  />
                  <Button onClick={addChecklistItem} size="sm" className="px-3 bg-[#8bdb00] text-slate-900 hover:bg-[#7bc600]">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-slate-400 uppercase tracking-wide">Detalhes</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2 text-slate-200">
                      <Activity className="h-4 w-4" />
                      Status
                    </Label>
                    <Select
                      value={editedTarefa.status}
                      onValueChange={(value: 'a-fazer' | 'em-andamento' | 'concluido') =>
                        setEditedTarefa({ ...editedTarefa, status: value })
                      }
                    >
                      <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700/50">
                        <SelectItem value="a-fazer" className="text-slate-200 focus:bg-slate-700/50">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-400" />
                            A Fazer
                          </div>
                        </SelectItem>
                        <SelectItem value="em-andamento" className="text-slate-200 focus:bg-slate-700/50">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                            Em Progresso
                          </div>
                        </SelectItem>
                        <SelectItem value="concluido" className="text-slate-200 focus:bg-slate-700/50">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                            Concluído
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2 text-slate-200">
                      <Flag className="h-4 w-4" />
                      Prioridade
                    </Label>
                    <Select
                      value={editedTarefa.prioridade}
                      onValueChange={(value: 'baixa' | 'media' | 'alta') =>
                        setEditedTarefa({ ...editedTarefa, prioridade: value })
                      }
                    >
                      <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700/50">
                        <SelectItem value="baixa" className="text-slate-200 focus:bg-slate-700/50">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3 w-3 text-green-400" />
                            Baixa
                          </div>
                        </SelectItem>
                        <SelectItem value="media" className="text-slate-200 focus:bg-slate-700/50">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3 w-3 text-yellow-400" />
                            Média
                          </div>
                        </SelectItem>
                        <SelectItem value="alta" className="text-slate-200 focus:bg-slate-700/50">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3 w-3 text-red-400" />
                            Alta
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2 text-slate-200">
                      <CalendarDays className="h-4 w-4" />
                      Data de Vencimento
                    </Label>
                    <DatePicker
                      value={editedTarefa.data_vencimento || ''}
                      onChange={(value) => setEditedTarefa({ ...editedTarefa, data_vencimento: value })}
                      placeholder="Selecione uma data"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2 text-slate-200">
                      <User className="h-4 w-4" />
                      Responsável
                    </Label>
                    <Select
                      value={editedTarefa.responsavel_id || 'none'}
                      onValueChange={(value) =>
                        setEditedTarefa({ ...editedTarefa, responsavel_id: value === 'none' ? null : value })
                      }
                    >
                      <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-slate-200">
                        <SelectValue placeholder="Selecione um responsável" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700/50">
                        <SelectItem value="none" className="text-slate-200 focus:bg-slate-700/50">Nenhum</SelectItem>
                        {vendedores.map((vendedor) => (
                          <SelectItem key={vendedor.id} value={vendedor.id} className="text-slate-200 focus:bg-slate-700/50">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-[#8bdb00]/10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-[#8bdb00]">
                                  {vendedor.nome.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              {vendedor.nome}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2 text-slate-200">
                        <Clock className="h-4 w-4" />
                        Horário do Lembrete
                      </Label>
                      <TimeInput
                        value={editedTarefa.hora_lembrete || ''}
                        onChange={(value) => setEditedTarefa({ ...editedTarefa, hora_lembrete: value })}
                        placeholder="HH:mm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <ReminderSelect
                        value={editedTarefa.reminder || ''}
                        onChange={(value) => setEditedTarefa({ ...editedTarefa, reminder: value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-700/50 bg-slate-800/30">
          <Button variant="outline" onClick={onClose} className="bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600/50 hover:text-slate-100">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="min-w-[120px] bg-[#8bdb00] text-slate-900 hover:bg-[#7bc600]">
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CreateTaskModal({ isOpen, onClose, onSave }: CreateTaskModalProps) {
  const [newTarefa, setNewTarefa] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'media' as 'baixa' | 'media' | 'alta',
    data_vencimento: '',
    responsavel_id: '',
    hora_lembrete: '',
    reminder: '',
    status: 'a-fazer' as 'a-fazer' | 'em-andamento' | 'concluido',
    tempo_rastreado: 0,
    esta_executando: false,
    inicio_execucao: null,
    lembrete_enviado: false
  })
  const { vendedores } = useVendedores()

  const handleSave = () => {
    if (!newTarefa.titulo.trim()) return
    
    onSave({
      ...newTarefa,
      responsavel_id: newTarefa.responsavel_id || null,
      data_vencimento: newTarefa.data_vencimento || null,
      hora_lembrete: newTarefa.hora_lembrete || null,
      descricao: newTarefa.descricao || null
    })
    
    setNewTarefa({
      titulo: '',
      descricao: '',
      prioridade: 'media',
      data_vencimento: '',
      responsavel_id: '',
      hora_lembrete: '',
      reminder: '',
      status: 'a-fazer',
      tempo_rastreado: 0,
      esta_executando: false,
      inicio_execucao: null,
      lembrete_enviado: false
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-slate-800/95 backdrop-blur-sm border-slate-700/50">
        <DialogHeader className="pb-4 border-b border-slate-700/50">
          <DialogTitle className="flex items-center gap-3 text-xl text-slate-200">
            <div className="p-2 bg-[#8bdb00]/10 rounded-lg">
              <Plus className="h-5 w-5 text-[#8bdb00]" />
            </div>
            Nova Tarefa
          </DialogTitle>
          <p className="text-sm text-slate-400 mt-1">
            Crie uma nova tarefa e organize seu trabalho
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-titulo" className="text-sm font-medium text-slate-200">Título *</Label>
                  <Input
                    id="new-titulo"
                    value={newTarefa.titulo}
                    onChange={(e) => setNewTarefa({ ...newTarefa, titulo: e.target.value })}
                    placeholder="Digite o título da tarefa"
                    className="text-lg font-medium bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder:text-slate-400 focus:border-[#8bdb00]/50 focus:ring-[#8bdb00]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-descricao" className="text-sm font-medium text-slate-200">Descrição</Label>
                  <Textarea
                    id="new-descricao"
                    value={newTarefa.descricao}
                    onChange={(e) => setNewTarefa({ ...newTarefa, descricao: e.target.value })}
                    placeholder="Digite a descrição da tarefa"
                    rows={6}
                    className="resize-none bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder:text-slate-400 focus:border-[#8bdb00]/50 focus:ring-[#8bdb00]/20"
                  />
                </div>
              </div>

              {/* Preview da Tarefa */}
              <div className="p-4 bg-slate-700/30 rounded-lg border-2 border-dashed border-slate-600/50">
                <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview da Tarefa
                </h4>
                <div className="space-y-2">
                  <h5 className="font-medium text-lg text-slate-200">
                    {newTarefa.titulo || 'Título da tarefa'}
                  </h5>
                  {newTarefa.descricao && (
                    <p className="text-sm text-slate-400">
                      {newTarefa.descricao}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className={priorityColors[newTarefa.prioridade]}>
                      <Flag className="h-3 w-3 mr-1" />
                      {newTarefa.prioridade}
                    </Badge>
                    {newTarefa.data_vencimento && (
                      <Badge variant="outline">
                        <CalendarDays className="h-3 w-3 mr-1" />
                        {formatDateToBR(newTarefa.data_vencimento)}
                      </Badge>
                    )}
                    {newTarefa.responsavel_id && (
                      <Badge variant="outline">
                        <User className="h-3 w-3 mr-1" />
                        {vendedores.find(v => v.id === newTarefa.responsavel_id)?.nome}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-slate-400 uppercase tracking-wide">Configurações</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2 text-slate-200">
                      <Flag className="h-4 w-4" />
                      Prioridade
                    </Label>
                    <Select
                      value={newTarefa.prioridade}
                      onValueChange={(value: 'baixa' | 'media' | 'alta') =>
                        setNewTarefa({ ...newTarefa, prioridade: value })
                      }
                    >
                      <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700/50">
                        <SelectItem value="baixa" className="text-slate-200 focus:bg-slate-700/50">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3 w-3 text-green-400" />
                            Baixa
                          </div>
                        </SelectItem>
                        <SelectItem value="media" className="text-slate-200 focus:bg-slate-700/50">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3 w-3 text-yellow-400" />
                            Média
                          </div>
                        </SelectItem>
                        <SelectItem value="alta" className="text-slate-200 focus:bg-slate-700/50">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3 w-3 text-red-400" />
                            Alta
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2 text-slate-200">
                      <CalendarDays className="h-4 w-4" />
                      Data de Vencimento
                    </Label>
                    <DatePicker
                      value={newTarefa.data_vencimento}
                      onChange={(value) => setNewTarefa({ ...newTarefa, data_vencimento: value })}
                      placeholder="Selecione uma data"
                      minDate={new Date()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2 text-slate-200">
                      <User className="h-4 w-4" />
                      Responsável
                    </Label>
                    <Select
                      value={newTarefa.responsavel_id || 'none'}
                      onValueChange={(value) =>
                        setNewTarefa({ ...newTarefa, responsavel_id: value === 'none' ? '' : value })
                      }
                    >
                      <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-slate-200">
                        <SelectValue placeholder="Selecione um responsável" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700/50">
                        <SelectItem value="none" className="text-slate-200 focus:bg-slate-700/50">Nenhum</SelectItem>
                        {vendedores.map((vendedor) => (
                          <SelectItem key={vendedor.id} value={vendedor.id} className="text-slate-200 focus:bg-slate-700/50">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-[#8bdb00]/10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-[#8bdb00]">
                                  {vendedor.nome.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              {vendedor.nome}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2 text-slate-200">
                        <Clock className="h-4 w-4" />
                        Horário do Lembrete
                      </Label>
                      <TimeInput
                        value={newTarefa.hora_lembrete}
                        onChange={(value) => setNewTarefa({ ...newTarefa, hora_lembrete: value })}
                        placeholder="HH:mm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <ReminderSelect
                        value={newTarefa.reminder || ''}
                        onChange={(value) => setNewTarefa({ ...newTarefa, reminder: value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Dicas */}
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Dicas
                  </h4>
                  <ul className="text-xs text-blue-300 space-y-1">
                    <li>• Use títulos descritivos e claros</li>
                    <li>• Defina prazos realistas</li>
                    <li>• Atribua responsáveis quando necessário</li>
                    <li>• Configure lembretes para tarefas importantes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-700/50 bg-slate-800/30">
          <Button variant="outline" onClick={onClose} className="bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600/50 hover:text-slate-100">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            className="min-w-[120px] bg-[#8bdb00] text-slate-900 hover:bg-[#7bc600] disabled:bg-slate-600 disabled:text-slate-400"
            disabled={!newTarefa.titulo.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Tarefa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SortableTaskCard({ tarefa, onEdit, onDelete, onToggleTimer }: {
  tarefa: Tarefa
  onEdit: (tarefa: Tarefa) => void
  onDelete: (id: string) => void
  onToggleTimer: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarefa.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const { vendedores } = useVendedores()
  const responsavel = vendedores.find(v => v.id === tarefa.responsavel_id)
  
  // Verificação de segurança para checklist
  const checklist = tarefa.checklist || []
  const completedChecklist = checklist.filter(item => item.done || item.concluido).length
  const totalChecklist = checklist.length
  const checklistProgress = totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const isOverdue = tarefa.data_vencimento && 
    new Date(tarefa.data_vencimento) < new Date() && 
    tarefa.status !== 'concluido'

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group transition-all duration-200 cursor-pointer bg-slate-800/60 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 hover:shadow-xl ${
        isDragging ? 'shadow-xl rotate-2 scale-105 opacity-70 z-50' : ''
      }`}
      onClick={(e) => {
        // Evita abrir o card quando clica no dropdown, botões ou drag handle
        const target = e.target as HTMLElement
        if (!target.closest('[data-radix-collection-item], button, [data-dnd-kit-drag-handle]') && 
            !target.closest('[class*="cursor-grab"]') &&
            !isDragging) {
          onEdit(tarefa);
        }
      }}
    >
      <CardContent className="p-2">
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            data-dnd-kit-drag-handle
            className="mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:text-[#8bdb00] touch-none"
            style={{ touchAction: 'none' }}
          >
            <GripVertical className="h-3.5 w-3.5 text-slate-400 hover:text-[#8bdb00]" />
          </div>
              
              <div className="flex-1 space-y-1.5">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-sm leading-tight line-clamp-2 text-slate-200">
                    {tarefa.titulo}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 opacity-60 group-hover:opacity-100 hover:bg-slate-700/50 text-slate-400 hover:text-slate-200"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-slate-800/95 backdrop-blur-sm border-slate-700/50">
                      <DropdownMenuItem onClick={() => onEdit(tarefa)} className="cursor-pointer text-slate-200 hover:bg-slate-700/50 focus:bg-slate-700/50">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(tarefa.id)}
                        className="text-red-400 cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-300 focus:text-red-300"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {tarefa.descricao && (
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {tarefa.descricao}
                  </p>
                )}

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className={`text-xs px-1.5 py-0.5 border-current ${priorityColors[tarefa.prioridade]}`}>
                    <Flag className="h-2.5 w-2.5 mr-1" />
                    {tarefa.prioridade}
                  </Badge>
                  
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0.5 bg-red-500 text-white dark:bg-red-600">
                      <AlertCircle className="h-2.5 w-2.5 mr-1" />
                      Atrasada
                    </Badge>
                  )}
                </div>

                {totalChecklist > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Progresso</span>
                      <span className="font-medium text-slate-200">{completedChecklist}/{totalChecklist}</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                      <div
                        className="bg-[#8bdb00] h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${checklistProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    {tarefa.data_vencimento && (
                      <div className="flex items-center gap-1 hover:text-slate-200 transition-colors">
                        <CalendarDays className="h-3 w-3" />
                        <span>{formatDateToBR(tarefa.data_vencimento)}</span>
                      </div>
                    )}
                    
                    {responsavel && (
                      <div className="flex items-center gap-1 hover:text-slate-200 transition-colors">
                        <User className="h-3 w-3" />
                        <span>{responsavel.nome.split(' ')[0]}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {tarefa.tempo_rastreado > 0 && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Timer className="h-3 w-3" />
                        <span className="font-medium">{formatTime(tarefa.tempo_rastreado)}</span>
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-slate-700/50 text-slate-400 hover:text-slate-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTimer(tarefa.id);
                      }}
                    >
                      {tarefa.esta_executando ? (
                        <Pause className="h-3 w-3 text-red-400" />
                      ) : (
                        <Play className="h-3 w-3 text-[#8bdb00]" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
  )
}

function DroppableColumn({ 
  id, 
  children, 
  className 
}: { 
  id: string
  children: React.ReactNode
  className?: string 
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-muted/50 rounded-lg ring-2 ring-primary/20' : ''} transition-all duration-200`}
      style={{ minHeight: '200px' }}
    >
      {children}
    </div>
  )
}

function KanbanView({ tarefas, onEdit, onDelete, onToggleTimer, onDragEnd }: {
  tarefas: Tarefa[]
  onEdit: (tarefa: Tarefa) => void
  onDelete: (id: string) => void
  onToggleTimer: (id: string) => void
  onDragEnd: (event: DragEndEvent) => void
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
    {
      id: 'a-fazer',
      title: 'A Fazer',
      color: 'border-slate-700/50 bg-slate-800/60 backdrop-blur-sm',
      headerColor: 'text-slate-200'
    },
    {
      id: 'em-andamento',
      title: 'Em Progresso',
      color: 'border-blue-500/30 bg-slate-800/60 backdrop-blur-sm',
      headerColor: 'text-blue-400'
    },
    {
      id: 'concluido',
      title: 'Concluído',
      color: 'border-green-500/30 bg-slate-800/60 backdrop-blur-sm',
      headerColor: 'text-green-400'
    }
  ]

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((column) => {
          const columnTasks = tarefas.filter(t => t.status === column.id)
          
          return (
            <div key={column.id} className={`rounded-lg border-2 ${column.color} p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${column.headerColor}`}>
                  {column.title}
                </h3>
                <Badge variant="secondary" className="text-xs bg-slate-700/50 text-slate-300 border-slate-600/50">
                  {columnTasks.length}
                </Badge>
              </div>
              
              <DroppableColumn id={column.id} className="space-y-3 min-h-[200px]">
                <SortableContext 
                  items={columnTasks.map(t => t.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  {columnTasks.map((tarefa) => (
                    <SortableTaskCard
                      key={tarefa.id}
                      tarefa={tarefa}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleTimer={onToggleTimer}
                    />
                  ))}
                  
                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma tarefa</p>
                    </div>
                  )}
                </SortableContext>
              </DroppableColumn>
            </div>
          )
        })}
      </div>
    </DndContext>
  )
}

function ListView({ tarefas, onEdit, onDelete, onToggleTimer }: {
  tarefas: Tarefa[]
  onEdit: (tarefa: Tarefa) => void
  onDelete: (id: string) => void
  onToggleTimer: (id: string) => void
}) {
  const { vendedores } = useVendedores()

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="space-y-2">
      {tarefas.map((tarefa) => {
        const responsavel = vendedores.find(v => v.id === tarefa.responsavel_id)
        // Verificação de segurança para checklist
        const checklist = tarefa.checklist || []
        const completedChecklist = checklist.filter(item => item.done || item.concluido).length
        const totalChecklist = checklist.length
        const isOverdue = tarefa.data_vencimento && 
          new Date(tarefa.data_vencimento) < new Date() && 
          tarefa.status !== 'concluido'

        return (
          <Card 
            key={tarefa.id} 
            className="group transition-all duration-200 cursor-pointer bg-slate-800/60 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 hover:shadow-xl"
            onClick={(e) => {
              // Evita abrir o card quando clica nos botões
              const target = e.target as HTMLElement
              if (!target.closest('button')) {
                onEdit(tarefa);
              }
            }}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-4">
                {/* Lado esquerdo - Título e descrição */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base truncate text-slate-200">{tarefa.titulo}</h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge 
                        variant="outline" 
                        className={`${priorityColors[tarefa.prioridade]} text-xs`}
                      >
                        <Flag className="h-3 w-3 mr-1" />
                        {tarefa.prioridade}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`${statusColors[tarefa.status]} text-xs`}
                      >
                        {tarefa.status === 'a-fazer' ? 'A Fazer' : 
                         tarefa.status === 'em-andamento' ? 'Em Progresso' : 'Concluído'}
                      </Badge>
                      {isOverdue && (
                        <Badge variant="destructive" className="text-xs bg-red-500/10 text-red-400 border-red-500/20">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Atrasada
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Description */}
                  {tarefa.descricao && (
                    <p className="text-sm text-slate-400 line-clamp-1">
                      {tarefa.descricao}
                    </p>
                  )}
                  
                  {/* Checklist Progress - mais compacto */}
                  {totalChecklist > 0 && (
                    <div className="mt-1">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-400">
                          {completedChecklist}/{totalChecklist} itens
                        </span>
                        <div className="flex-1 bg-slate-700/50 rounded-full h-1.5 max-w-20">
                          <div 
                            className="bg-[#8bdb00] h-1.5 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Lado direito - Meta informações e ações */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Meta Information - compacta */}
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {tarefa.data_vencimento && (
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        <span>{formatDateToBR(tarefa.data_vencimento)}</span>
                      </div>
                    )}
                    
                    {responsavel && (
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-[#8bdb00]/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-[#8bdb00]">
                            {responsavel.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="max-w-20 truncate">{responsavel.nome}</span>
                      </div>
                    )}

                    {tarefa.hora_lembrete && (
                      <div className="flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        <span>{tarefa.hora_lembrete}</span>
                      </div>
                    )}
                    
                    {tarefa.tempo_rastreado > 0 && (
                      <div className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        <span>{formatTime(tarefa.tempo_rastreado)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleTimer(tarefa.id)
                      }}
                      className={`h-7 w-7 p-0 ${
                        tarefa.esta_executando 
                          ? 'bg-[#8bdb00]/10 text-[#8bdb00] hover:bg-[#8bdb00]/20' 
                          : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'
                      }`}
                      title={tarefa.esta_executando ? 'Pausar timer' : 'Iniciar timer'}
                    >
                      {tarefa.esta_executando ? <Pause className="h-3 w-3 text-red-400" /> : <Play className="h-3 w-3 text-[#8bdb00]" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(tarefa)
                      }}
                      className="h-7 w-7 p-0 hover:bg-slate-700/50 text-slate-400 hover:text-slate-200"
                      title="Editar tarefa"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(tarefa.id)
                      }}
                      className="h-7 w-7 p-0 hover:bg-red-500/10 hover:text-red-400 text-slate-400"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Timer Active Indicator - mais compacto */}
              {tarefa.esta_executando && (
                <div className="mt-2 p-1.5 bg-[#8bdb00]/10 rounded border border-[#8bdb00]/20">
                  <div className="flex items-center gap-2 text-xs text-[#8bdb00]">
                    <div className="w-1.5 h-1.5 bg-[#8bdb00] rounded-full animate-pulse" />
                    <span className="font-medium">Timer ativo</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
      
      {tarefas.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-slate-700/30 rounded-full flex items-center justify-center mb-4">
            <List className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-200 mb-2">
            Nenhuma tarefa encontrada
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Crie sua primeira tarefa para começar a organizar seu trabalho
          </p>
        </div>
      )}
    </div>
  )
}

function CalendarView({ tarefas }: { tarefas: Tarefa[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Dias do mês anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }
    
    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true })
    }
    
    // Dias do próximo mês para completar a grade
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false })
    }
    
    return days
  }
  
  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const tasksForDate = tarefas.filter(tarefa => tarefa.data_vencimento === dateStr)
    return tasksForDate
  }
  
  const days = getDaysInMonth(currentDate)
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold text-slate-200">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="text-sm text-slate-400">
            {tarefas.length} {tarefas.length === 1 ? 'tarefa' : 'tarefas'} no mês
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateMonth('prev')}
            className="h-9 w-9 p-0 bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 hover:border-slate-600/50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToToday}
            className="px-3 bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 hover:border-slate-600/50"
          >
            Hoje
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateMonth('next')}
            className="h-9 w-9 p-0 bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 hover:border-slate-600/50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden bg-slate-800/60 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-0">
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 border-b border-slate-700/50 bg-slate-700/30">
                {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(day => (
                  <div key={day} className="p-3 text-center font-semibold text-sm text-slate-300 border-r border-slate-700/50 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {days.map((day, index) => {
                  const dayTasks = getTasksForDate(day.date)
                  const isToday = day.date.toDateString() === new Date().toDateString()
                  const isSelected = selectedDate?.toDateString() === day.date.toDateString()
                  const hasOverdueTasks = dayTasks.some(task => 
                    new Date(task.data_vencimento!) < new Date() && task.status !== 'concluido'
                  )
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border-r border-b border-slate-700/50 last:border-r-0 cursor-pointer transition-all hover:bg-slate-700/30 ${
                        day.isCurrentMonth 
                          ? 'bg-slate-800/40' 
                          : 'bg-slate-700/20 text-slate-500'
                      } ${isSelected ? 'bg-[#8bdb00]/10 border-[#8bdb00]/30' : ''}`}
                      onClick={() => setSelectedDate(day.date)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${
                          isToday 
                            ? 'bg-[#8bdb00] text-slate-900 rounded-full w-6 h-6 flex items-center justify-center text-xs' 
                            : isSelected 
                              ? 'text-[#8bdb00] font-semibold' 
                              : day.isCurrentMonth 
                                ? 'text-slate-200'
                                : 'text-slate-500'
                        }`}>
                          {day.date.getDate()}
                        </span>
                        {dayTasks.length > 0 && (
                          <div className={`text-xs px-1.5 py-0.5 rounded-full ${
                            hasOverdueTasks 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                              : 'bg-[#8bdb00]/10 text-[#8bdb00] border border-[#8bdb00]/20'
                          }`}>
                            {dayTasks.length}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {dayTasks.slice(0, 2).map(tarefa => {
                          const isOverdue = tarefa.data_vencimento && 
                            new Date(tarefa.data_vencimento) < new Date() && 
                            tarefa.status !== 'concluido'
                          
                          return (
                            <div
                              key={tarefa.id}
                              className="text-xs p-1.5 rounded-md truncate bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 text-slate-200 hover:border-slate-600/50 hover:shadow-xl transition-all duration-200"
                              title={`${tarefa.titulo} - ${tarefa.prioridade} prioridade`}
                            >
                              <div className="flex items-center gap-1">
                                {tarefa.status === 'concluido' && (
                                  <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-green-400" />
                                )}
                                <span className="truncate">{tarefa.titulo}</span>
                              </div>
                            </div>
                          )
                        })}
                        {dayTasks.length > 2 && (
                          <div className="text-xs text-slate-400 text-center py-1">
                            +{dayTasks.length - 2} mais
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Details */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-800/60 backdrop-blur-sm border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-200">
                {selectedDate ? (
                  <>
                    {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
                    <div className="text-sm font-normal text-slate-400 mt-1">
                      {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'tarefa' : 'tarefas'}
                    </div>
                  </>
                ) : (
                  'Selecione uma data'
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDate ? (
                selectedDateTasks.length > 0 ? (
                  selectedDateTasks.map(tarefa => {
                    const isOverdue = tarefa.data_vencimento && 
                      new Date(tarefa.data_vencimento) < new Date() && 
                      tarefa.status !== 'concluido'
                    
                    return (
                      <div 
                        key={tarefa.id} 
                        className="p-3 rounded-lg bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600/50 hover:shadow-xl transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate text-slate-200">{tarefa.titulo}</h4>
                            {tarefa.descricao && (
                              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                {tarefa.descricao}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${priorityColors[tarefa.prioridade]}`}
                              >
                                {tarefa.prioridade}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${statusColors[tarefa.status]}`}
                              >
                                {tarefa.status === 'a-fazer' ? 'A Fazer' : 
                                 tarefa.status === 'em-andamento' ? 'Em Progresso' : 'Concluído'}
                              </Badge>
                            </div>
                          </div>
                          {tarefa.status === 'concluido' && (
                            <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-400">
                      Nenhuma tarefa nesta data
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-400">
                    Clique em uma data para ver as tarefas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function Tarefas() {
  const {
    tarefas,
    loading,
    error,
    addTarefa,
    updateTarefa,
    updateTarefaCompleta,
    deleteTarefa,
    startTimer,
    stopTimer,
    getTarefasPorStatus
  } = useTarefas()
  
  console.log('🔍 Total de tarefas carregadas:', tarefas.length)
  console.log('🔍 Tarefas com data_vencimento:', tarefas.filter(t => t.data_vencimento).length)
  console.log('🔍 Tarefas:', tarefas.map(t => ({ id: t.id, titulo: t.titulo, data_vencimento: t.data_vencimento })))
  

  
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [selectedTask, setSelectedTask] = useState<Tarefa | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Filtrar tarefas
  const filteredTasks = tarefas.filter(tarefa => {
    const matchesSearch = tarefa.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tarefa.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesStatus = filterStatus === 'all' || tarefa.status === filterStatus
    const matchesPriority = filterPriority === 'all' || tarefa.prioridade === filterPriority
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  // Estatísticas
  const stats = {
    total: tarefas.length,
    aFazer: getTarefasPorStatus('a-fazer').length,
    emAndamento: getTarefasPorStatus('em-andamento').length,
    concluido: getTarefasPorStatus('concluido').length
  }

  const handleCreateTask = async (newTask: any) => {
    try {
      await addTarefa(newTask)
      toast({
        title: 'Sucesso',
        description: 'Tarefa criada com sucesso!'
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar tarefa',
        variant: 'destructive'
      })
    }
  }

  const handleEditTask = (tarefa: Tarefa) => {
    setSelectedTask(tarefa)
    setIsTaskModalOpen(true)
  }

  const handleSaveTask = async (tarefa: Tarefa) => {
    try {
      await updateTarefaCompleta(tarefa)
      toast({
        title: 'Sucesso',
        description: 'Tarefa atualizada com sucesso!'
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar tarefa',
        variant: 'destructive'
      })
    }
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

  const handleToggleTimer = async (id: string) => {
    try {
      const tarefa = tarefas.find(t => t.id === id)
      if (!tarefa) return

      if (tarefa.esta_executando) {
        await stopTimer(id)
        toast({
          title: 'Timer parado',
          description: 'Tempo de execução pausado'
        })
      } else {
        await startTimer(id)
        toast({
          title: 'Timer iniciado',
          description: 'Tempo de execução iniciado'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao controlar timer',
        variant: 'destructive'
      })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    console.log('🔄 Drag End Event:', { active: active.id, over: over?.id })

    if (!over) {
      console.log('❌ No drop target found')
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // Encontrar a tarefa sendo movida
    const activeTask = tarefas.find(t => t.id === activeId)
    if (!activeTask) {
      console.log('❌ Active task not found:', activeId)
      return
    }

    console.log('📋 Active task:', activeTask.titulo, 'Current status:', activeTask.status)

    // Determinar o novo status baseado na coluna de destino
    let newStatus: 'a-fazer' | 'em-andamento' | 'concluido'
    
    // Primeiro, verificar se foi solto diretamente em uma coluna
    if (overId === 'a-fazer' || overId === 'em-andamento' || overId === 'concluido') {
      newStatus = overId
      console.log('✅ Dropped on column:', newStatus)
    } else {
      // Se foi solto sobre uma tarefa, usar o status da coluna dessa tarefa
      const overTask = tarefas.find(t => t.id === overId)
      if (overTask) {
        newStatus = overTask.status
        console.log('✅ Dropped on task:', overTask.titulo, 'Status:', newStatus)
      } else {
        console.log('❌ Could not determine target status for:', overId)
        return
      }
    }

    // Se o status não mudou, não fazer nada
    if (activeTask.status === newStatus) {
      console.log('ℹ️ Status unchanged, no update needed')
      return
    }

    console.log('🔄 Updating task status from', activeTask.status, 'to', newStatus)

    try {
      await updateTarefa(activeId, { status: newStatus })
      
      toast({
        title: 'Sucesso',
        description: `Tarefa movida para "${newStatus === 'a-fazer' ? 'A Fazer' : newStatus === 'em-andamento' ? 'Em Progresso' : 'Concluído'}"!`
      })
      
      console.log('✅ Task status updated successfully')
    } catch (error) {
      console.error('❌ Erro ao atualizar status da tarefa:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status da tarefa',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900/98 backdrop-blur-sm">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8bdb00]"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900/98 backdrop-blur-sm">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 text-slate-200">Erro ao carregar tarefas</h3>
              <p className="text-slate-400">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900/98 backdrop-blur-sm">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6" style={{ paddingLeft: 'max(1rem, 80px)' }}>
        {/* Header */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate text-slate-200">Tarefas</h1>
              <p className="text-sm sm:text-base text-slate-400 mt-1">
                Gerencie suas tarefas com cronômetro e lembretes
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsCreateModalOpen(true)} 
                className="w-full sm:w-auto shrink-0 bg-[#8bdb00] hover:bg-[#7bc400] text-slate-900 font-medium"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Nova Tarefa</span>
                <span className="xs:hidden">Nova</span>
              </Button>
              

            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-slate-800/60 backdrop-blur-sm border-slate-700/50 hover:shadow-xl transition-all duration-200 hover:border-slate-600/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-slate-700/50 rounded-lg shrink-0">
                  <Target className="h-3 w-3 sm:h-4 sm:w-4 text-[#8bdb00]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-400">Total</p>
                  <p className="text-lg sm:text-2xl font-bold truncate text-slate-200">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/60 backdrop-blur-sm border-slate-700/50 hover:shadow-xl transition-all duration-200 hover:border-slate-600/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-slate-700/50 rounded-lg shrink-0">
                  <Circle className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-400">A Fazer</p>
                  <p className="text-lg sm:text-2xl font-bold truncate text-slate-200">{stats.aFazer}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/60 backdrop-blur-sm border-slate-700/50 hover:shadow-xl transition-all duration-200 hover:border-slate-600/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg shrink-0">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-400">Em Progresso</p>
                  <p className="text-lg sm:text-2xl font-bold truncate text-slate-200">{stats.emAndamento}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/60 backdrop-blur-sm border-slate-700/50 hover:shadow-xl transition-all duration-200 hover:border-slate-600/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg shrink-0">
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-400">Concluído</p>
                  <p className="text-lg sm:text-2xl font-bold truncate text-slate-200">{stats.concluido}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col xl:flex-row gap-3 sm:gap-4">
          <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder:text-slate-400 focus:border-[#8bdb00] focus:ring-[#8bdb00]/20"
              />
            </div>
            
            <div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
              <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
                <SelectTrigger className="w-full xs:w-[140px] sm:w-[160px] lg:w-[180px] bg-slate-700/50 border-slate-600/50 text-slate-200 focus:border-[#8bdb00] focus:ring-[#8bdb00]/20">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-slate-200 focus:bg-slate-700 focus:text-slate-200">Todos os status</SelectItem>
                  <SelectItem value="a-fazer" className="text-slate-200 focus:bg-slate-700 focus:text-slate-200">A Fazer</SelectItem>
                  <SelectItem value="em-andamento" className="text-slate-200 focus:bg-slate-700 focus:text-slate-200">Em Progresso</SelectItem>
                  <SelectItem value="concluido" className="text-slate-200 focus:bg-slate-700 focus:text-slate-200">Concluído</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterPriority} onValueChange={(value: FilterPriority) => setFilterPriority(value)}>
                <SelectTrigger className="w-full xs:w-[140px] sm:w-[160px] lg:w-[180px] bg-slate-700/50 border-slate-600/50 text-slate-200 focus:border-[#8bdb00] focus:ring-[#8bdb00]/20">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-slate-200 focus:bg-slate-700 focus:text-slate-200">Todas as prioridades</SelectItem>
                  <SelectItem value="baixa" className="text-slate-200 focus:bg-slate-700 focus:text-slate-200">Baixa</SelectItem>
                  <SelectItem value="media" className="text-slate-200 focus:bg-slate-700 focus:text-slate-200">Média</SelectItem>
                  <SelectItem value="alta" className="text-slate-200 focus:bg-slate-700 focus:text-slate-200">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Tabs value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)} className="w-full xl:w-auto">
            <TabsList className="grid w-full grid-cols-3 xl:w-auto xl:grid-cols-none xl:flex bg-slate-700/50 border-slate-600/50">
              <TabsTrigger value="kanban" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-400 data-[state=active]:text-black data-[state=active]:bg-[#8bdb00] data-[state=active]:border-[#8bdb00]">
                <Kanban className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Kanban</span>
                <span className="sm:hidden">K</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-400 data-[state=active]:text-black data-[state=active]:bg-[#8bdb00] data-[state=active]:border-[#8bdb00]">
                <List className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Lista</span>
                <span className="sm:hidden">L</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-400 data-[state=active]:text-black data-[state=active]:bg-[#8bdb00] data-[state=active]:border-[#8bdb00]">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Calendário</span>
                <span className="sm:hidden">C</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {viewMode === 'kanban' && (
            <KanbanView
              tarefas={filteredTasks}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onToggleTimer={handleToggleTimer}
              onDragEnd={handleDragEnd}
            />
          )}
          
          {viewMode === 'list' && (
            <ListView
              tarefas={filteredTasks}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onToggleTimer={handleToggleTimer}
            />
          )}
          
          {viewMode === 'calendar' && (
            <CalendarView tarefas={filteredTasks} />
          )}
        </div>

        {/* Modals */}
        <TaskModal
          tarefa={selectedTask}
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false)
            setSelectedTask(null)
          }}
          onSave={handleSaveTask}
        />
        
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateTask}
        />
      </div>
    </div>
  )
}