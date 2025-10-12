import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useTarefas, type Tarefa } from "@/hooks/useTarefas";
import { useVendedores } from "@/hooks/useVendedores";
import type { Database } from "@/lib/supabase";
import { 
  CheckSquare, 
  Play, 
  Pause, 
  MoreVertical, 
  Plus, 
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
  Clock,
  Flag,
  Trash2,
  Edit3,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Target,
  Timer,
  CheckCircle2,
  Circle,
  AlertCircle,
  Bell
} from "lucide-react";

// Tipos de dados do Supabase
type ChecklistItem = Database['public']['Tables']['tarefa_checklist']['Row'];

type ViewMode = 'kanban' | 'lista' | 'calendario';

const Tarefas: React.FC = () => {
  const { 
    tarefas, 
    loading: tarefasLoading, 
    error: tarefasError,
    addTarefa,
    updateTarefa,
    updateTarefaCompleta,
    deleteTarefa,
    startTimer,
    stopTimer,
    activeTaskId
  } = useTarefas();
  
  const { 
    vendedores, 
    loading: vendedoresLoading, 
    error: vendedoresError 
  } = useVendedores();

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tarefa | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newTaskStatus, setNewTaskStatus] = useState<Tarefa['status']>('a-fazer');
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Formatação de tempo
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else if (minutes > 0) {
      return `${minutes}min ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Formatação de data
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString + "T00:00:00").toLocaleDateString("pt-BR");
  };

  // Formatação de tempo para cronômetro ativo
  const formatActiveTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Obter tempo atual da tarefa (incluindo tempo em execução)
  const getCurrentTime = (task: Tarefa): number => {
      if (task.esta_executando && task.inicio_execucao) {
        const elapsedTime = Math.floor((Date.now() - new Date(task.inicio_execucao).getTime()) / 1000);
        return (task.tempo_rastreado || 0) + elapsedTime;
      }
      return task.tempo_rastreado || 0;
    };

  // Função para mostrar toast
  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setShowToast({ message, type });
  };

  // useEffect para esconder toast automaticamente
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(null);
      }, 3000); // 3 segundos

      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Opções de lembrete
  const reminderOptions = [
    { value: 'none', label: 'Nenhum' },
    { value: '0', label: 'Na hora (no vencimento)' },
    { value: '5', label: '5 minutos antes' },
    { value: '10', label: '10 minutos antes' },
    { value: '15', label: '15 minutos antes' },
    { value: '30', label: '30 minutos antes' },
    { value: '60', label: '1 hora antes' }
  ];

  // Verificar se tarefa tem lembrete ativo
  const hasActiveReminder = (task: Tarefa): boolean => {
    return task.data_vencimento && !task.lembrete_enviado;
  };

  // Cores de prioridade
  const getPriorityColor = (priority: Tarefa['prioridade']) => {
    switch (priority) {
      case 'alta': return { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', icon: '🔴' };
      case 'media': return { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', icon: '🟡' };
      case 'baixa': return { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', icon: '🔵' };
    }
  };

  // Ícones de prioridade
  const getPriorityIcon = (priority: Tarefa['prioridade']) => {
    switch (priority) {
      case 'alta': return <span className="text-red-400">🔴</span>;
      case 'media': return <span className="text-yellow-400">🟡</span>;
      case 'baixa': return <span className="text-blue-400">🔵</span>;
    }
  };

  // Iniciar/pausar cronômetro
  const toggleTimer = async (taskId: string) => {
    try {
      const task = tarefas.find(t => t.id === taskId);
      if (!task) return;

      if (task.esta_executando) {
        // Pausar timer
        await stopTimer(taskId);
      } else {
        // Pausar outros timers ativos primeiro
        const activeTasks = tarefas.filter(t => t.esta_executando && t.id !== taskId);
        for (const activeTask of activeTasks) {
          await stopTimer(activeTask.id);
        }
        
        // Iniciar timer da tarefa atual
        await startTimer(taskId);
      }
    } catch (error) {
      console.error('Erro ao alternar timer:', error);
      showToastMessage('Erro ao alternar timer', 'error');
    }
  };

  // Mover tarefa entre status
  const moveTask = async (taskId: string, newStatus: Tarefa['status']) => {
    try {
      const task = tarefas.find(t => t.id === taskId);
      if (!task) return;

      // Se movendo para concluído e timer está ativo, parar cronômetro primeiro
      if (newStatus === 'concluido' && task.esta_executando) {
        await stopTimer(taskId);
      }

      // Atualizar status da tarefa
      await updateTarefa(taskId, { status: newStatus });
    } catch (error) {
      console.error('Erro ao mover tarefa:', error);
      showToastMessage('Erro ao mover tarefa', 'error');
    }
  };

  // Deletar tarefa
  const deleteTask = async (taskId: string) => {
    try {
      await deleteTarefa(taskId);
      showToastMessage('Tarefa excluída com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      showToastMessage('Erro ao excluir tarefa', 'error');
    }
  };

  // Criar nova tarefa
  const createTask = async (taskData: any) => {
    try {
      await addTarefa({
        titulo: taskData.titulo,
        descricao: taskData.descricao,
        prioridade: taskData.prioridade,
        data_vencimento: taskData.data_vencimento || null,
        reminder: taskData.reminder,
        hora_lembrete: taskData.hora_lembrete || null,
        lembrete_enviado: taskData.lembrete_enviado,
        status: taskData.status,
        tempo_rastreado: taskData.tempo_rastreado,
        esta_executando: taskData.esta_executando,
        inicio_execucao: taskData.inicio_execucao
      });
      setShowCreateModal(false);
      showToastMessage('Tarefa criada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      showToastMessage('Erro ao criar tarefa', 'error');
    }
  };

  // Calcular horário do lembrete
  const calculateReminderTime = (task: Tarefa): number | null => {
    if (!task.data_vencimento) {
      return null;
    }

    const dueDateTime = new Date(task.data_vencimento);
    // Implementar lógica de lembrete se necessário
    
    return dueDateTime.getTime();
  };

  // Enviar notificação push via webhook
  const sendPushNotification = async (task: Tarefa) => {
    try {
      const payload = {
        title: `Lembrete: ${task.titulo}`,
        body: `${task.descricao}\n\nVencimento: ${task.data_vencimento}`,
        taskId: task.id,
        reminderType: 'Lembrete'
      };

      const response = await fetch('https://n8nwebhook.chatifyz.com/webhook/push-grupongx-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Marcar como enviado
        const updatedTask = { ...task, lembrete_enviado: true };
        updateTarefa(updatedTask);
        showToastMessage('🔔 Lembrete enviado para seu celular!');
      } else {
        throw new Error('Falha ao enviar notificação');
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      showToastMessage('Erro ao enviar notificação push', 'error');
    }
  };

  // Função para enviar webhook de lembrete
  const sendWebhookReminder = async (task: Tarefa) => {
    try {
      // Validar se a tarefa tem os dados necessários
      if (!task || !task.titulo || !task.id) {
        console.error('Dados da tarefa inválidos para envio de lembrete:', task);
        showToastMessage('Erro: dados da tarefa inválidos', 'error');
        return false;
      }

      // Construir payload com validação de campos
      const payload = {
        title: `Lembrete: ${task.titulo}`,
        body: `${task.descricao || 'Sem descrição'}\n\nVencimento: ${task.data_vencimento || 'Não definido'}`,
        taskId: task.id,
        reminderType: 'Lembrete',
        reminderTime: task.hora_lembrete || null,
        timestamp: new Date().toISOString(),
        priority: task.prioridade || 'media',
        status: task.status || 'a-fazer'
      };

      console.log('Enviando webhook com payload:', payload);

      const response = await fetch('https://n8nwebhook.chatifyz.com/webhook/push-grupongx-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('Webhook de lembrete enviado com sucesso para:', task.titulo);
        showToastMessage('🔔 Lembrete enviado!');
        return true;
      } else {
        const errorText = await response.text();
        console.error('Erro na resposta do webhook:', response.status, errorText);
        throw new Error(`Falha ao enviar webhook de lembrete: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Erro ao enviar webhook de lembrete:', error);
      showToastMessage(`Erro ao enviar lembrete: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
      return false;
    }
  };

  // Verificar lembretes pendentes
  const checkPendingReminders = async () => {
    const now = new Date();
    console.log('Verificando lembretes pendentes...', { totalTarefas: tarefas.length, agora: now.toISOString() });
    
    for (const task of tarefas) {
      // Validações mais robustas
      if (!task || !task.id || !task.titulo) {
        console.log('Tarefa inválida ignorada:', task);
        continue;
      }

      if (!task.data_vencimento || !task.hora_lembrete || task.lembrete_enviado || task.reminder === 'none') {
        console.log(`Tarefa ${task.titulo} ignorada:`, {
          data_vencimento: task.data_vencimento,
          hora_lembrete: task.hora_lembrete,
          lembrete_enviado: task.lembrete_enviado,
          reminder: task.reminder
        });
        continue;
      }

      try {
        // Combinar data e hora do lembrete
        const reminderDateTime = new Date(`${task.data_vencimento}T${task.hora_lembrete}`);
        
        // Verificar se a data é válida
        if (isNaN(reminderDateTime.getTime())) {
          console.error(`Data/hora inválida para tarefa ${task.titulo}:`, {
            data_vencimento: task.data_vencimento,
            hora_lembrete: task.hora_lembrete
          });
          continue;
        }
        
        // Verificar se é hora de enviar o lembrete (com tolerância de 1 minuto)
        const timeDiff = now.getTime() - reminderDateTime.getTime();
        console.log(`Tarefa ${task.titulo} - Diferença de tempo:`, {
          reminderDateTime: reminderDateTime.toISOString(),
          timeDiff,
          shouldSend: timeDiff >= 0 && timeDiff < 60000
        });

        if (timeDiff >= 0 && timeDiff < 60000) { // Entre 0 e 60 segundos
          console.log(`Enviando lembrete para tarefa: ${task.titulo}`);
          
          // Enviar webhook
          const webhookSuccess = await sendWebhookReminder(task);
          
          if (webhookSuccess) {
            // Marcar lembrete como enviado
            await updateTarefaCompleta({
              ...task,
              lembrete_enviado: true
            });
            
            showToastMessage(`Lembrete enviado para: ${task.titulo}`, 'success');
          }
        }
      } catch (error) {
        console.error(`Erro ao processar lembrete para tarefa ${task.titulo}:`, error);
        showToastMessage(`Erro ao enviar lembrete para ${task.titulo}`, 'error');
      }
    }
  };

  // useEffect para verificação inicial de lembretes
  useEffect(() => {
    if (tarefas.length > 0) {
      checkPendingReminders();
    }
  }, [tarefas]);

  // useEffect para verificação periódica de lembretes (a cada minuto)
  useEffect(() => {
    const interval = setInterval(() => {
      if (tarefas.length > 0) {
        checkPendingReminders();
      }
    }, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, [tarefas]);



  // Contadores de status
  const getStatusCounts = () => {
    const counts = { 'a-fazer': 0, 'em-andamento': 0, 'concluido': 0 };
    tarefas.forEach(task => {
      counts[task.status]++;
    });
    return counts;
  };

  // Renderizar card de tarefa
  const renderTaskCard = (task: Tarefa) => {
    const priorityColor = getPriorityColor(task.prioridade);
    const currentTime = getCurrentTime(task);
    const isActive = task.esta_executando;
    const completedItems = task.checklist.filter(item => item.done).length;
    const totalItems = task.checklist.length;
    const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return (
      <Card 
        key={task.id} 
        className={`
          bg-[#1f2937] 
          border border-[#374151] 
          hover:border-[#4b5563] 
          hover:shadow-lg hover:shadow-black/20
          transition-all duration-300 
          cursor-pointer group 
          backdrop-blur-sm
          ${isActive ? 'ring-2 ring-[#8b5cf6] shadow-lg shadow-[#8b5cf6]/10 border-[#8b5cf6]/30' : ''}
        `}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header com título e ações */}
          <div className="flex items-start justify-between">
            <h3 
              className="text-[#ffffff] font-medium text-sm leading-tight flex-1 mr-2 cursor-pointer hover:text-[#c084fc] transition-colors"
              onClick={() => {
                setSelectedTask(task);
                setShowTaskModal(true);
              }}
            >
              {task.titulo}
            </h3>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-[#9ca3af] hover:text-[#ffffff] hover:bg-[#374151] rounded-md"
                onClick={() => {
                  setSelectedTask(task);
                  setShowTaskModal(true);
                }}
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-[#9ca3af] hover:text-[#f87171] hover:bg-[#dc2626]/10 rounded-md"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Descrição */}
          {task.descricao && (
            <p className="text-[#9ca3af] text-xs leading-relaxed line-clamp-2">
              {task.descricao}
            </p>
          )}

          {/* Prioridade e data */}
          <div className="flex items-center justify-between">
            <Badge 
              className={`
                ${priorityColor.bg} ${priorityColor.border} ${priorityColor.text} 
                text-xs font-medium px-2 py-1 rounded-md
                shadow-sm
              `}
            >
              {priorityColor.icon} {task.prioridade.toUpperCase()}
            </Badge>
            {task.data_vencimento && (
              <div className="flex items-center gap-1.5 text-[#9ca3af] text-xs bg-[#1f2937] px-2 py-1 rounded-md">
                <CalendarIcon className="w-3 h-3" />
                <span className="font-medium">
                  {new Date(task.data_vencimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
            )}
          </div>

          {/* Checklist progress */}
          {/* Implementar checklist se necessário */}
          {false && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#9ca3af]">
                  <CheckSquare className="w-3 h-3" />
                  <span className="font-medium">Subtarefas</span>
                </div>
                <span className="text-[#d1d5db] font-medium">
                  {completedItems}/{totalItems}
                </span>
              </div>
              <div className="relative">
                <div className="w-full bg-[#374151] rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                {progressPercentage === 100 && (
                  <div className="absolute -top-0.5 right-0 w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
                )}
              </div>
            </div>
          )}

          {/* Cronômetro e tempo */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-[#9ca3af] text-xs bg-[#1f2937]/30 px-2 py-1 rounded-md">
              <Clock className="w-3 h-3" />
              <span className={`font-mono ${isActive ? 'text-[#a855f7] font-medium' : ''}`}>
                {isActive ? formatActiveTime(currentTime) : formatTime(currentTime)}
              </span>
            </div>
            <Button
              size="sm"
              variant={isActive ? "default" : "outline"}
              className={`
                h-8 w-8 p-0 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] hover:from-[#7c3aed] hover:to-[#9333ea] text-[#ffffff] shadow-lg shadow-[#8b5cf6]/25' 
                  : 'border-[#4b5563] text-[#9ca3af] hover:bg-[#374151] hover:text-[#ffffff] hover:border-[#6b7280]'
                }
              `}
              onClick={() => toggleTimer(task.id)}
            >
              {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizar visualização Kanban
  const renderKanbanView = () => {
    const statusCounts = getStatusCounts();
    const columns = [
      { status: 'a-fazer' as const, title: 'PENDENTE', count: statusCounts['a-fazer'] },
      { status: 'em-andamento' as const, title: 'EM PROGRESSO', count: statusCounts['em-andamento'] },
      { status: 'concluido' as const, title: 'CONCLUÍDO', count: statusCounts['concluido'] }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(column => (
          <div key={column.status} className="space-y-4">
            {/* Header da coluna */}
            <div className="flex items-center justify-between">
              <h2 className="text-[#ffffff] font-semibold text-sm uppercase tracking-wide">
                {column.title}
              </h2>
              <Badge variant="secondary" className="bg-[#374151] text-[#d1d5db]">
                {column.count}
              </Badge>
            </div>

            {/* Container de drop */}
            <div 
              className="min-h-[200px] space-y-3 p-2 rounded-lg border-2 border-dashed border-[#374151] transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData('text/plain');
                moveTask(taskId, column.status);
              }}
            >
              {/* Tarefas */}
              {tarefas
                .filter(task => task.status === column.status)
                .map(task => renderTaskCard(task))}

              {/* Botão adicionar */}
              <Button
                variant="ghost"
                className="w-full border-2 border-dashed border-[#4b5563] text-[#9ca3af] hover:border-[#6b7280] hover:text-[#d1d5db] h-12"
                onClick={() => {
                  setNewTaskStatus(column.status);
                  setShowCreateModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Tarefa
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar visualização Lista
  const renderListView = () => {
    const sortedTasks = [...tarefas].sort((a, b) => {
      // Ordenar por prioridade e depois por data
      const priorityOrder = { 'alta': 3, 'media': 2, 'baixa': 1 };
      if (priorityOrder[a.prioridade] !== priorityOrder[b.prioridade]) {
        return priorityOrder[b.prioridade] - priorityOrder[a.prioridade];
      }
      return new Date(a.data_vencimento || '').getTime() - new Date(b.data_vencimento || '').getTime();
    });

    return (
      <div className="space-y-3">
        {sortedTasks.map(task => {
          const priorityColor = getPriorityColor(task.prioridade);
          const currentTime = getCurrentTime(task);
          const isActive = task.esta_executando;

          return (
            <Card 
              key={task.id} 
              className={`bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all ${
                isActive ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Checkbox de conclusão */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => moveTask(task.id, task.status === 'concluido' ? 'a-fazer' : 'concluido')}
                  >
                    {task.status === 'concluido' ? 
                      <CheckCircle2 className="w-5 h-5 text-green-500" /> : 
                      <Circle className="w-5 h-5 text-gray-400" />
                    }
                  </Button>

                  {/* Prioridade */}
                  <div className={`w-3 h-3 rounded-full ${priorityColor.bg.replace('/20', '')}`} />

                  {/* Conteúdo principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 
                        className={`font-semibold cursor-pointer hover:text-[#acf500] ${
                          task.status === 'concluido' ? 'line-through text-gray-500' : 'text-white'
                        }`}
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskModal(true);
                        }}
                      >
                        {task.titulo}
                      </h3>
                      <Badge className={`${priorityColor.bg} ${priorityColor.border} ${priorityColor.text} text-xs`}>
                        {task.prioridade}
                      </Badge>
                    </div>
                    {task.descricao && (
                      <p className="text-gray-400 text-sm">{task.descricao}</p>
                    )}
                  </div>

                  {/* Data */}
                  {task.data_vencimento && (
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <CalendarIcon className="w-4 h-4" />
                      {new Date(task.data_vencimento).toLocaleDateString('pt-BR')}
                    </div>
                  )}

                  {/* Tempo */}
                  <div className="flex items-center gap-1 text-gray-400 text-sm min-w-[80px]">
                    <Clock className="w-4 h-4" />
                    <span className={isActive ? 'text-green-400 font-mono' : ''}>
                      {isActive ? formatActiveTime(currentTime) : formatTime(currentTime)}
                    </span>
                  </div>

                  {/* Cronômetro */}
                  <Button
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    className={`h-8 w-8 p-0 ${
                      isActive 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'border-gray-600 hover:bg-gray-700'
                    }`}
                    onClick={() => toggleTimer(task.id)}
                  >
                    {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>

                  {/* Ações */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskModal(true);
                    }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Botão adicionar */}
        <Button
          variant="outline"
          className="w-full border-dashed border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 h-12"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Nova Tarefa
        </Button>
      </div>
    );
  };

  // Renderizar visualização Calendário
  const renderCalendarView = () => {
    const today = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startOfCalendar = new Date(startOfMonth);
    startOfCalendar.setDate(startOfCalendar.getDate() - startOfCalendar.getDay());

    const days = [];
    const current = new Date(startOfCalendar);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const getTasksForDate = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      return tarefas.filter(task => task.data_vencimento === dateStr);
    };

    return (
      <div className="space-y-4">
        {/* Header do calendário */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#ffffff]">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-[#4b5563] text-[#d1d5db] hover:bg-[#374151] hover:text-[#ffffff]"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-[#4b5563] text-[#d1d5db] hover:bg-[#374151] hover:text-[#ffffff]"
              onClick={() => setCurrentDate(new Date())}
            >
              Hoje
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-[#4b5563] text-[#d1d5db] hover:bg-[#374151] hover:text-[#ffffff]"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Grid do calendário */}
        <div className="grid grid-cols-7 gap-1">
          {/* Cabeçalho dos dias da semana */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="p-2 text-center text-[#9ca3af] font-semibold text-sm">
              {day}
            </div>
          ))}

          {/* Dias do mês */}
          {days.map((day, index) => {
            const tasksForDay = getTasksForDate(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === today.toDateString();

            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border border-[#374151] ${
                  isCurrentMonth ? 'bg-[#1f2937]' : 'bg-[#111827]'
                } ${isToday ? 'ring-2 ring-[#acf500]' : ''} hover:bg-[#374151] transition-colors`}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  isCurrentMonth ? 'text-[#ffffff]' : 'text-[#6b7280]'
                } ${isToday ? 'text-[#acf500]' : ''}`}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {tasksForDay.slice(0, 3).map(task => {
                    const priorityColor = getPriorityColor(task.prioridade);
                    return (
                      <div
                        key={task.id}
                        className={`text-xs p-1 rounded cursor-pointer ${priorityColor.bg} ${priorityColor.text} truncate`}
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskModal(true);
                        }}
                      >
                        {task.titulo}
                      </div>
                    );
                  })}
                  {tasksForDay.length > 3 && (
                    <div className="text-xs text-[#9ca3af]">
                      +{tasksForDay.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Modal de detalhes da tarefa
  const TaskModal = () => {
    if (!selectedTask) return null;

    const [editedTask, setEditedTask] = useState<Tarefa>(selectedTask);
    const [newChecklistItem, setNewChecklistItem] = useState('');

    const handleSave = async () => {
      try {
        await updateTarefaCompleta(editedTask);
        setShowTaskModal(false);
        setSelectedTask(null);
      } catch (error) {
        console.error('Erro ao salvar tarefa:', error);
      }
    };

    const addChecklistItem = () => {
      if (newChecklistItem.trim()) {
        const newItem = {
          id: `check-${Date.now()}`,
          tarefa_id: editedTask.id,
          texto: newChecklistItem.trim(),
          concluido: false,
          ordem: editedTask.checklist.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          text: newChecklistItem.trim(), // Propriedade mapeada para compatibilidade
          done: false // Propriedade mapeada para compatibilidade
        };
        setEditedTask(prev => ({
          ...prev,
          checklist: [...prev.checklist, newItem]
        }));
        setNewChecklistItem('');
      }
    };

    const toggleChecklistItem = (itemId: string) => {
      setEditedTask(prev => ({
        ...prev,
        checklist: prev.checklist.map(item =>
          item.id === itemId ? { 
            ...item, 
            done: !item.done,
            concluido: !item.concluido,
            updated_at: new Date().toISOString()
          } : item
        )
      }));
    };

    const removeChecklistItem = (itemId: string) => {
      setEditedTask(prev => ({
        ...prev,
        checklist: prev.checklist.filter(item => item.id !== itemId)
      }));
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="bg-[#1f2937] border-[#374151] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-[#ffffff]">Detalhes da Tarefa</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowTaskModal(false)}
                className="text-[#9ca3af] hover:text-[#ffffff] hover:bg-[#374151]/50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Título */}
            <div>
              <label className="text-[#d1d5db] text-sm font-medium mb-2 block">Título</label>
              <Input
                value={editedTask.titulo}
                onChange={(e) => setEditedTask(prev => ({ ...prev, titulo: e.target.value }))}
                className="bg-[#374151] border-[#4b5563] text-[#ffffff]"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="text-[#d1d5db] text-sm font-medium mb-2 block">Descrição</label>
              <Textarea
                value={editedTask.descricao}
                onChange={(e) => setEditedTask(prev => ({ ...prev, descricao: e.target.value }))}
                className="bg-[#374151] border-[#4b5563] text-[#ffffff]"
                rows={3}
              />
            </div>

            {/* Prioridade e Data */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#d1d5db] text-sm font-medium mb-2 block">Prioridade</label>
                <select
                  value={editedTask.prioridade}
                  onChange={(e) => setEditedTask(prev => ({ ...prev, prioridade: e.target.value as Tarefa['prioridade'] }))}
                  className="w-full bg-[#374151] border border-[#4b5563] text-[#ffffff] rounded-md px-3 py-2"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div>
                <label className="text-[#d1d5db] text-sm font-medium mb-2 block">Prazo</label>
                <Input
                  type="date"
                  value={editedTask.data_vencimento}
                  onChange={(e) => setEditedTask(prev => ({ ...prev, data_vencimento: e.target.value }))}
                  className="bg-[#374151] border-[#4b5563] text-[#ffffff]"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-[#d1d5db] text-sm font-medium mb-2 block">Status</label>
              <select
                value={editedTask.status}
                onChange={(e) => setEditedTask(prev => ({ ...prev, status: e.target.value as Tarefa['status'] }))}
                className="w-full bg-[#374151] border border-[#4b5563] text-[#ffffff] rounded-md px-3 py-2"
              >
                <option value="a-fazer">A Fazer</option>
                <option value="em-andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>

            {/* Lembrete e Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#d1d5db] text-sm font-medium mb-2 block">Lembrete</label>
                <select
                  value={editedTask.reminder}
                  onChange={(e) => setEditedTask(prev => ({ ...prev, reminder: e.target.value }))}
                  className="w-full bg-[#374151] border border-[#4b5563] text-[#ffffff] rounded-md px-3 py-2"
                >
                  {reminderOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[#d1d5db] text-sm font-medium mb-2 block">Hora do lembrete</label>
                <Input
                  type="time"
                  step="60"
                  value={editedTask.hora_lembrete || ''}
                  onChange={(e) => setEditedTask(prev => ({ ...prev, hora_lembrete: e.target.value }))}
                  className="bg-[#374151] border-[#4b5563] text-[#ffffff] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
                  disabled={editedTask.reminder === 'none'}
                  style={{ 
                    colorScheme: 'dark',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield'
                  }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div>
              <label className="text-[#d1d5db] text-sm font-medium mb-2 block">Checklist</label>
              <div className="space-y-2">
                {editedTask.checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2 p-2 bg-[#374151] rounded">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={() => toggleChecklistItem(item.id)}
                    >
                      {item.done ? 
                        <CheckCircle2 className="w-4 h-4 text-[#10b981]" /> : 
                        <Circle className="w-4 h-4 text-[#9ca3af]" />
                      }
                    </Button>
                    <span className={`flex-1 text-sm ${item.done ? 'line-through text-[#6b7280]' : 'text-[#ffffff]'}`}>
                      {item.text}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 text-[#9ca3af] hover:text-[#f87171]"
                      onClick={() => removeChecklistItem(item.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                
                {/* Adicionar item */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar item..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                    className="bg-[#374151] border-[#4b5563] text-[#ffffff] placeholder:text-[#9ca3af]"
                  />
                  <Button
                    size="sm"
                    onClick={addChecklistItem}
                    className="bg-[#acf500] hover:bg-[#9de000] text-black"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Tempo registrado */}
            <div>
              <label className="text-[#d1d5db] text-sm font-medium mb-2 block">Tempo Registrado</label>
              <div className="flex items-center gap-2 text-[#d1d5db]">
                <Clock className="w-4 h-4" />
                <span>{formatTime(getCurrentTime(editedTask))}</span>
                {editedTask.isRunning && (
                  <Badge className="bg-[#059669] text-[#ffffff]">
                    <Timer className="w-3 h-3 mr-1" />
                    Em execução
                  </Badge>
                )}
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                className="bg-[#acf500] hover:bg-[#9de000] text-black"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTaskModal(false)}
                className="border-[#4b5563] text-[#d1d5db] hover:bg-[#374151] hover:text-[#ffffff]"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Modal de criação de tarefa
  const CreateTaskModal = () => {
    const [newTask, setNewTask] = useState({
      titulo: '',
      descricao: '',
      prioridade: 'media' as 'baixa' | 'media' | 'alta',
      data_vencimento: '',
      reminder: 'none',
      hora_lembrete: '',
      lembrete_enviado: false,
      status: newTaskStatus,
      tempo_rastreado: 0,
      esta_executando: false,
      inicio_execucao: null as string | null,
      checklist: []
    });

    const handleCreate = () => {
      if (!newTask.titulo.trim()) {
        showToastMessage('Título é obrigatório!', 'error');
        return;
      }

      // Validação: se lembrete selecionado, data e hora são obrigatórias
      if (newTask.reminder !== 'none' && !newTask.data_vencimento) {
        showToastMessage('Data é obrigatória quando um lembrete é selecionado!', 'error');
        return;
      }

      if (newTask.reminder !== 'none' && !newTask.hora_lembrete) {
        showToastMessage('Hora do lembrete é obrigatória quando um lembrete é selecionado!', 'error');
        return;
      }

      createTask(newTask);
    };

    const priorityOptions = [
      { value: 'baixa', label: 'Baixa', color: 'text-[#4ade80]', bg: 'bg-[#10b981]/10', border: 'border-[#10b981]/20' },
      { value: 'media', label: 'Média', color: 'text-[#fbbf24]', bg: 'bg-[#f59e0b]/10', border: 'border-[#f59e0b]/20' },
      { value: 'alta', label: 'Alta', color: 'text-[#f87171]', bg: 'bg-[#dc2626]/10', border: 'border-[#dc2626]/20' }
    ];

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-[#111827] to-[#1f2937] border border-[#374151]/50 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#ffffff]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#ffffff]">Nova Tarefa</h2>
                  <p className="text-sm text-[#9ca3af]">Crie uma nova tarefa para organizar seu trabalho</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="text-[#9ca3af] hover:text-[#ffffff] hover:bg-[#374151]/50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Título */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#d1d5db]">
                  Título <span className="text-[#f87171]">*</span>
                </label>
                <Input
                  value={newTask.titulo}
                  onChange={(e) => setNewTask(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Revisar documentação do projeto"
                  className="bg-[#1f2937]/50 border-[#4b5563]/50 text-[#ffffff] placeholder:text-[#6b7280] focus:border-[#8b5cf6]/50 focus:ring-[#8b5cf6]/20"
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#d1d5db]">Descrição</label>
                <Textarea
                  value={newTask.descricao}
                  onChange={(e) => setNewTask(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Adicione detalhes sobre a tarefa..."
                  rows={3}
                  className="bg-[#1f2937]/50 border-[#4b5563]/50 text-[#ffffff] placeholder:text-[#6b7280] focus:border-[#8b5cf6]/50 focus:ring-[#8b5cf6]/20 resize-none"
                />
              </div>

              {/* Prioridade */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#d1d5db]">Prioridade</label>
                <div className="grid grid-cols-3 gap-3">
                  {priorityOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNewTask(prev => ({ ...prev, prioridade: option.value as Tarefa['prioridade'] }))}
                      className={`
                        p-3 rounded-lg border transition-all duration-200 text-sm font-medium
                        ${newTask.prioridade === option.value 
                          ? `${option.bg} ${option.border} ${option.color} ring-2 ring-current/20` 
                          : 'bg-[#1f2937]/30 border-[#4b5563]/30 text-[#9ca3af] hover:bg-[#374151]/30 hover:border-[#6b7280]/30'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Agendamento */}
              <div className="space-y-4 p-4 bg-[#1f2937]/30 rounded-lg border border-[#374151]/30">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#a855f7]" />
                  <h3 className="text-lg font-medium text-[#ffffff]">Agendamento</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#d1d5db]">Data de vencimento</label>
                    <Input
                      type="date"
                      value={newTask.data_vencimento}
                      onChange={(e) => setNewTask(prev => ({ ...prev, data_vencimento: e.target.value }))}
                      className="bg-[#1f2937]/50 border-[#4b5563]/50 text-[#ffffff] focus:border-[#8b5cf6]/50 focus:ring-[#8b5cf6]/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#d1d5db]">Hora do lembrete</label>
                    <Input
                      type="time"
                      step="60"
                      value={newTask.hora_lembrete}
                      onChange={(e) => setNewTask(prev => ({ ...prev, hora_lembrete: e.target.value }))}
                      className="bg-[#1f2937]/50 border-[#4b5563]/50 text-[#ffffff] focus:border-[#8b5cf6]/50 focus:ring-[#8b5cf6]/20 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
                      disabled={newTask.reminder === 'none'}
                      style={{ 
                        colorScheme: 'dark',
                        WebkitAppearance: 'none',
                        MozAppearance: 'textfield'
                      }}
                    />
                  </div>

                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#d1d5db]">Lembrete</label>
                  <select
                    value={newTask.reminder}
                    onChange={(e) => setNewTask(prev => ({ ...prev, reminder: e.target.value }))}
                    className="w-full p-3 bg-[#1f2937]/50 border border-[#4b5563]/50 rounded-lg text-[#ffffff] focus:border-[#8b5cf6]/50 focus:ring-[#8b5cf6]/20 focus:outline-none"
                  >
                    {reminderOptions.map(option => (
                      <option key={option.value} value={option.value} className="bg-[#1f2937]">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  
                  {newTask.reminder !== 'none' && (
                    <div className="flex items-center gap-2 p-3 bg-[#a855f7]/10 border border-[#a855f7]/20 rounded-lg">
                      <Bell className="w-4 h-4 text-[#c084fc]" />
                      <p className="text-sm text-[#d8b4fe]">
                        Você receberá uma notificação push no horário selecionado
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-[#374151]/50">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="border-[#4b5563]/50 text-[#d1d5db] hover:bg-[#374151]/50 hover:text-[#ffffff] hover:border-[#6b7280]/50 w-full sm:w-auto order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreate}
                className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] hover:from-[#7c3aed] hover:to-[#9333ea] text-[#ffffff] shadow-lg shadow-[#8b5cf6]/25 w-full sm:w-auto order-1 sm:order-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Tarefa
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Toast de Notificação
  const Toast: React.FC = () => {
    if (!showToast) return null;

    const isSuccess = showToast.type === 'success';

    return (
      <div className={`
        fixed top-4 sm:top-6 right-4 sm:right-6 left-4 sm:left-auto z-50 p-4 rounded-xl shadow-2xl backdrop-blur-sm border
        transition-all duration-300 animate-slideInRight max-w-sm sm:max-w-sm
        ${isSuccess 
          ? 'bg-gradient-to-r from-green-600/90 to-green-500/90 border-green-400/30 text-white' 
          : 'bg-gradient-to-r from-red-600/90 to-red-500/90 border-red-400/30 text-white'
        }
      `}>
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center
            ${isSuccess ? 'bg-green-400/20' : 'bg-red-400/20'}
          `}>
            {isSuccess ? 
              <CheckCircle2 className="w-5 h-5" /> : 
              <AlertCircle className="w-5 h-5" />
            }
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{showToast.message}</p>
          </div>
        </div>
      </div>
    );
  };

  // Visualização Kanban
  const KanbanView: React.FC = () => {
    const statusCounts = getStatusCounts();
    
    const columns = [
      { id: 'a-fazer', title: 'A FAZER', count: statusCounts['a-fazer'] },
      { id: 'em-andamento', title: 'EM PROGRESSO', count: statusCounts['em-andamento'] },
      { id: 'concluido', title: 'CONCLUÍDO', count: statusCounts['concluido'] }
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map(column => (
          <div key={column.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    column.id === 'a-fazer' ? 'bg-warning' :
                    column.id === 'em-andamento' ? 'bg-info' : 'bg-success'
                  }`} />
                  <h3 className="font-medium text-foreground text-sm">
                    {column.title}
                  </h3>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {column.count}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNewTaskStatus(column.id as Tarefa['status']);
                    setShowCreateModal(true);
                  }}
                  className="h-7 w-7 p-0 hover:bg-accent"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            
            <div className="p-3 space-y-3 min-h-[400px]">
              {tarefas
                .filter(task => task.status === column.id)
                .map(task => renderTaskCard(task))}
              
              {/* Empty state */}
              {tarefas.filter(task => task.status === column.id).length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <CheckSquare className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Nenhuma tarefa</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewTaskStatus(column.id as Tarefa['status']);
                      setShowCreateModal(true);
                    }}
                    className="mt-2 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar tarefa
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Visualização Lista
  const ListView: React.FC = () => {
    const sortedTasks = [...tarefas].sort((a, b) => {
      // Ordenar por data de vencimento, depois por prioridade
      if (a.data_vencimento !== b.data_vencimento) {
        return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
      }
      const priorityOrder = { 'alta': 3, 'media': 2, 'baixa': 1 };
      return priorityOrder[b.prioridade] - priorityOrder[a.prioridade];
    });

    return (
      <div className="space-y-3">
        {sortedTasks.map(task => (
          <Card key={task.id} className={`border-l-4 ${getPriorityColor(task.prioridade)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(task.prioridade)}
                    <h3 className="font-semibold">{task.titulo}</h3>
                    {hasActiveReminder(task) && <Bell className="w-4 h-4 text-yellow-500" />}
                  </div>
                  
                  <Badge variant="outline">
                    {task.status === 'a-fazer' ? 'A Fazer' : 
                     task.status === 'em-andamento' ? 'Em Progresso' : 'Concluído'}
                  </Badge>
                  
                  <span className="text-sm text-gray-500">
                    📅 {formatDate(task.data_vencimento)}
                  </span>
                  
                  <span className="text-sm text-gray-500">
                    ⏱️ {formatTime(getCurrentTime(task))}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={task.esta_executando ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleTimer(task.id)}
                  >
                    {task.esta_executando ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskModal(true);
                    }}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Visualização Calendário
  const CalendarView: React.FC = () => {
    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];
      
      // Dias do mês anterior
      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const prevDate = new Date(year, month, -i);
        days.push({ date: prevDate, isCurrentMonth: false });
      }
      
      // Dias do mês atual
      for (let day = 1; day <= daysInMonth; day++) {
        days.push({ date: new Date(year, month, day), isCurrentMonth: true });
      }
      
      return days;
    };

    const getTasksForDate = (date: Date) => {
      const dateString = date.toISOString().split('T')[0];
      return tarefas.filter(task => task.data_vencimento === dateString);
    };

    const days = getDaysInMonth(currentDate);

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="p-2 text-center font-semibold text-[#9ca3af]">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const tasksForDay = getTasksForDate(day.date);
            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border border-[#374151] rounded ${
                  day.isCurrentMonth ? 'bg-[#1f2937]' : 'bg-[#111827]'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  day.isCurrentMonth ? 'text-[#ffffff]' : 'text-[#9ca3af]'
                }`}>
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {tasksForDay.slice(0, 2).map(task => (
                    <div
                      key={task.id}
                      className={`text-xs p-1 rounded cursor-pointer ${getPriorityColor(task.prioridade)} bg-[#374151]`}
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskModal(true);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {hasActiveReminder(task) && <Bell className="w-3 h-3 text-[#fbbf24]" />}
                        <span className="truncate">{task.titulo}</span>
                      </div>
                      <div className="text-[#9ca3af]">{formatDate(task.data_vencimento)}</div>
                    </div>
                  ))}
                  {tasksForDay.length > 2 && (
                    <div className="text-xs text-[#9ca3af]">
                      +{tasksForDay.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const statusCounts = getStatusCounts();

  // Tratamento de loading e erro
  if (tarefasLoading || vendedoresLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
          <p className="text-[#ffffff]">Carregando tarefas...</p>
        </div>
      </div>
    );
  }

  if (tarefasError || vendedoresError) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-8 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Erro ao carregar dados: {tarefasError?.message || vendedoresError?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <div className="border-b border-[#1e293b] bg-[#1e293b]/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#8b5cf6] flex items-center justify-center">
                  <CheckSquare className="h-4 w-4 text-[#ffffff]" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-[#ffffff]">Tarefas</h1>
                  <p className="text-sm text-[#94a3b8] hidden sm:block">Gerencie suas tarefas com cronômetro e lembretes</p>
                </div>
              </div>
              
              {/* Contador de Status */}
              <div className="hidden md:flex items-center gap-2 ml-4 lg:ml-8">
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#f59e0b]/10 text-[#f59e0b]">
                  <Circle className="h-3 w-3" />
                  <span className="text-xs font-medium">{statusCounts['a-fazer']}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#3b82f6]/10 text-[#3b82f6]">
                  <Timer className="h-3 w-3" />
                  <span className="text-xs font-medium">{statusCounts['em-andamento']}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#10b981]/10 text-[#10b981]">
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="text-xs font-medium">{statusCounts['concluido']}</span>
                </div>
              </div>
            </div>
            
            {/* Contador de Status Mobile */}
            <div className="flex md:hidden items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#f59e0b]/10 text-[#f59e0b]">
                <Circle className="h-3 w-3" />
                <span className="text-xs font-medium">{statusCounts['a-fazer']}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#3b82f6]/10 text-[#3b82f6]">
                <Timer className="h-3 w-3" />
                <span className="text-xs font-medium">{statusCounts['em-andamento']}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#10b981]/10 text-[#10b981]">
                <CheckCircle2 className="h-3 w-3" />
                <span className="text-xs font-medium">{statusCounts['concluido']}</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Seletor de Visualização */}
              <div className="flex bg-[#1e293b] rounded-lg p-1">
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="h-8 px-2 sm:px-3 text-xs flex-1 sm:flex-none"
                >
                  <LayoutGrid className="w-3 h-3 sm:mr-1.5" />
                  <span className="hidden sm:inline">Kanban</span>
                </Button>
                <Button
                  variant={viewMode === 'lista' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('lista')}
                  className="h-8 px-2 sm:px-3 text-xs flex-1 sm:flex-none"
                >
                  <List className="w-3 h-3 sm:mr-1.5" />
                  <span className="hidden sm:inline">Lista</span>
                </Button>
                <Button
                  variant={viewMode === 'calendario' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendario')}
                  className="h-8 px-2 sm:px-3 text-xs flex-1 sm:flex-none"
                >
                  <CalendarIcon className="w-3 h-3 sm:mr-1.5" />
                  <span className="hidden sm:inline">Calendário</span>
                </Button>
              </div>

              <Button
                onClick={() => {
                  setNewTaskStatus('a-fazer');
                  setShowCreateModal(true);
                }}
                className="h-9 px-4 bg-[#8b5cf6] hover:bg-[#7c3aed] text-[#ffffff] shadow-sm w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        {/* Renderização das Visualizações */}
        {viewMode === 'kanban' && <KanbanView />}
        {viewMode === 'lista' && <ListView />}
        {viewMode === 'calendario' && <CalendarView />}
      </div>

      {/* Modais */}
      {showTaskModal && <TaskModal />}
      {showCreateModal && <CreateTaskModal />}
      
      {/* Toast */}
      <Toast />
    </div>
  );
};

export default Tarefas;