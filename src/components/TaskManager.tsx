import React, { useState } from 'react';
import { TaskItem, TeamType, StationedAdvisor, VirtualAdvisor } from '../types';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  AlertCircle, 
  User, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  List, 
  Kanban 
} from 'lucide-react';

interface TaskManagerProps {
  tasks: TaskItem[];
  stationedAdvisors: StationedAdvisor[];
  virtualAdvisors: VirtualAdvisor[];
  onAddTask: (task: TaskItem) => void;
  onUpdateTaskStatus: (id: string, newStatus: TaskItem['status']) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  stationedAdvisors,
  virtualAdvisors,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [teamFilter, setTeamFilter] = useState<'all' | TeamType>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New task state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [team, setTeam] = useState<TeamType>('stationed');
  const [assignedAdvisorId, setAssignedAdvisorId] = useState('');
  const [category, setCategory] = useState<TaskItem['category']>('Calling Push');
  const [priority, setPriority] = useState<TaskItem['priority']>('medium');
  const [dueDate, setDueDate] = useState('');

  const filteredTasks = tasks.filter((t) => {
    const matchesTeam = teamFilter === 'all' || t.team === teamFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesTeam && matchesPriority;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let advisorName = 'Unassigned';
    if (team === 'stationed') {
      const found = stationedAdvisors.find((a) => a.id === assignedAdvisorId);
      if (found) advisorName = found.advisorName;
    } else {
      const found = virtualAdvisors.find((a) => a.id === assignedAdvisorId);
      if (found) advisorName = found.advisorName;
    }

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title,
      description,
      team,
      assignedAdvisorId,
      assignedAdvisorName: advisorName,
      priority,
      status: 'todo',
      category,
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onAddTask(newTask);
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
  };

  const statusColumns: { id: TaskItem['status']; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do', color: 'border-slate-700 bg-slate-900/60' },
    { id: 'in_progress', label: 'In Progress', color: 'border-cyan-800 bg-cyan-950/20' },
    { id: 'review', label: 'Under Review', color: 'border-amber-800 bg-amber-950/20' },
    { id: 'completed', label: 'Completed', color: 'border-emerald-800 bg-emerald-950/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#30AFFF]/15 text-[#92EEFF] border border-[#30AFFF]/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Operations Hub
            </span>
            <span className="text-slate-400 text-xs font-mono">Total Tasks: {tasks.length}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
            Kaizen Team Task Management
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Assign calling targets, exam study plans, CE audit reviews, and briefing follow-ups for Stationed & Virtual advisors.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800/80 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban' ? 'bg-[#30AFFF]/20 text-[#92EEFF] border border-[#30AFFF]/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-[#30AFFF]/20 text-[#92EEFF] border border-[#30AFFF]/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-[#30AFFF] via-[#92EEFF] to-[#C4F7CA] hover:brightness-110 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-[#30AFFF]/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Assign New Task</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5 text-[#30AFFF]" />
            <span>Team Filter:</span>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value as any)}
              className="bg-slate-950 text-[#92EEFF] border border-slate-800 px-2.5 py-1 rounded-md font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Teams</option>
              <option value="stationed">Stationed Team</option>
              <option value="virtual">Virtual Team</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950 text-slate-200 border border-slate-800 px-2.5 py-1 rounded-md font-medium focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className={`border rounded-xl p-4 min-h-[450px] flex flex-col justify-between ${col.color}`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                    <span className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        col.id === 'todo' ? 'bg-slate-400' : col.id === 'in_progress' ? 'bg-cyan-400' : col.id === 'review' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                      {col.label}
                    </span>
                    <span className="bg-slate-950 text-slate-400 px-2 py-0.5 rounded-full text-[11px] font-bold border border-slate-800">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-slate-950 border border-slate-800 hover:border-cyan-800/80 rounded-xl p-3.5 shadow-md space-y-2.5 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            task.priority === 'urgent'
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : task.priority === 'high'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                          }`}>
                            {task.priority}
                          </span>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-200 text-xs leading-snug">{task.title}</h4>
                          {task.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{task.description}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                          <span className="flex items-center gap-1 text-cyan-400 font-medium">
                            <User className="w-3 h-3" />
                            {task.assignedAdvisorName}
                          </span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3" />
                            {task.dueDate}
                          </span>
                        </div>

                        {/* Status Change Selector */}
                        <div className="pt-1">
                          <select
                            value={task.status}
                            onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded px-2 py-1 font-medium focus:outline-none cursor-pointer hover:border-cyan-600"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Under Review</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium uppercase tracking-wider">
                  <th className="p-3.5">Task Title</th>
                  <th className="p-3.5">Team</th>
                  <th className="p-3.5">Assigned Advisor</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-semibold text-slate-200">{task.title}</td>
                    <td className="p-3.5 uppercase font-medium text-cyan-400 text-[11px]">{task.team}</td>
                    <td className="p-3.5 text-slate-300 font-medium">{task.assignedAdvisorName}</td>
                    <td className="p-3.5 text-slate-400">{task.category}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        task.priority === 'urgent' ? 'bg-rose-950 text-rose-300' : 'bg-cyan-950 text-cyan-300'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={task.status}
                        onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 text-[11px] text-slate-200 rounded px-2 py-1 focus:outline-none"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Under Review</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-slate-400">{task.dueDate}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Assign New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Complete 150 Reach Calls Sprint"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Specific goals or guidelines..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Target Team</label>
                  <select
                    value={team}
                    onChange={(e) => setTeam(e.target.value as TeamType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  >
                    <option value="stationed">Stationed Team</option>
                    <option value="virtual">Virtual Team</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Assigned Advisor</label>
                  <select
                    value={assignedAdvisorId}
                    onChange={(e) => setAssignedAdvisorId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  >
                    <option value="">Select Advisor</option>
                    {team === 'stationed'
                      ? stationedAdvisors.map((a) => (
                          <option key={a.id} value={a.id}>{a.advisorName}</option>
                        ))
                      : virtualAdvisors.map((a) => (
                          <option key={a.id} value={a.id}>{a.advisorName}</option>
                        ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
                  >
                    <option value="Calling Push">Calling Push</option>
                    <option value="Exam Preparation">Exam Prep</option>
                    <option value="CE Audit">CE Audit</option>
                    <option value="Briefing">Briefing</option>
                    <option value="Sales Closing">Sales Closing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-800 text-slate-300 font-medium px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-lg shadow-md"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
