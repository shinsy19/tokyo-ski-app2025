import React, { useState } from 'react';
// 🟢 修正：補上 Trash2 圖示導入
import { Plus, CheckCircle2, Circle, Users, Edit3, Check, X, Trash2 } from 'lucide-react';

// 🟢 修正：在參數列加入 onDeleteTodo
export default function TodoPage({ todos, members, onAddTodo, onToggleTodo, onUpdateTodo, onDeleteTodo }) {
  const [newTodoText, setNewTodoText] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // 處理新增
  const handleAddClick = () => {
    if (!newTodoText.trim()) return;
    const newTodo = {
      text: newTodoText,
      assignees: selectedAssignees.length > 0 ? selectedAssignees : ["全體"],
      completedBy: [],
      createdAt: new Date()
    };
    onAddTodo(newTodo);
    setNewTodoText("");
    setSelectedAssignees([]);
  };

  // 處理修改文字內容
  const startEditing = (todo) => {
    setEditingId(todo.firestoreId);
    setEditText(todo.text);
  };

  const handleUpdate = (id) => {
    if (onUpdateTodo) {
      onUpdateTodo(id, { text: editText });
    }
    setEditingId(null);
  };

  // 🔴 修正：處理刪除任務
  const handleDelete = (id) => {
    if (window.confirm("確定要刪除這項待辦任務嗎？")) {
      onDeleteTodo(id); // 🟢 呼叫傳入的屬性
    }
  };

  // 🟢 處理「新增後」的人員指派修改
  const handleToggleMemberAssignment = (todoId, memberName, currentAssignees) => {
    const isCurrentlyAssigned = currentAssignees.includes(memberName);
    
    // 如果目前只有一個人且就是要移除他，提示無法清空 (或依您的需求調整)
    if (isCurrentlyAssigned && currentAssignees.length === 1) {
      if (!window.confirm("這是最後一位負責人，確定要移除嗎？")) return;
    }

    // 呼叫 App.jsx 的 handleUpdateTodo 邏輯
    // 注意：這裡的第二與第三個參數需對應您在 App.jsx 修改後的 handleUpdateTodo(todoId, memberName, isAdding)
    onUpdateTodo(todoId, memberName, !isCurrentlyAssigned);
  };

  // 🟢 修正：刪除原本重複定義的 toggleAssigneeSelection
  const toggleAssigneeSelection = (name) => {
    setSelectedAssignees(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="px-6 space-y-6 animate-in fade-in pb-20">
      {/* 1. 新增任務 */}
      <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="新增公用待辦..." // 🟢 修正：符合您的需求改為「待辦」
            className="flex-1 bg-gray-50 border-none px-5 py-3 rounded-2xl text-xs font-bold outline-none"
          />
          <button onClick={handleAddClick} className="bg-[#2A3B49] text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-transform">
            <Plus size={20} />
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest px-1">指派給 (選填)</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {members.map(m => (
              <button
                key={m.firestoreId || m.id}
                onClick={() => toggleAssigneeSelection(m.name)}
                className={`flex-none flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                  selectedAssignees.includes(m.name) ? 'border-[#4E9A8E] bg-[#4E9A8E]/10 text-[#4E9A8E]' : 'border-gray-100 text-gray-400'
                }`}
              >
                <img src={m.avatar} className="w-4 h-4 rounded-full" alt="" />
                <span className="text-[10px] font-bold">{m.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. 任務列表 */}
      <div className="space-y-6">
        {todos.map(todo => {
          const targetMembers = todo.assignees.includes("全體") ? members.map(m => m.name) : todo.assignees;
    const doneList = todo.completedBy || [];
    const progress = Math.round((doneList.filter(name => targetMembers.includes(name)).length / targetMembers.length) * 100);

    // 接下來直接定義進度過濾邏輯（確保上方沒有出現過重複的 const 名稱）
    const notDoneList = targetMembers.filter(name => !doneList.includes(name));
    const activeDoneList = doneList.filter(name => targetMembers.includes(name));

          return (
            <div key={todo.firestoreId} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1 bg-[#4E9A8E] transition-all duration-500" style={{ width: `${progress}%` }} />

              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  {editingId === todo.firestoreId ? (
                    <div className="flex gap-2">
                      <input 
                        value={editText} 
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 border-b-2 border-[#4E9A8E] text-sm font-bold outline-none"
                      />
                      <button onClick={() => handleUpdate(todo.firestoreId)} className="text-green-500"><Check size={18}/></button>
                      <button onClick={() => setEditingId(null)} className="text-red-400"><X size={18}/></button>
                    </div>
                  ) : (
                    <div className="group flex items-center gap-2">
                      <h3 className="font-bold text-base text-[#2A3B49] leading-tight">{todo.text}</h3>
                      <button onClick={() => startEditing(todo)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-[#4E9A8E] transition-all">
                        <Edit3 size={14} />
                      </button>
                    </div>
                  )}
                  <span className="text-[9px] font-black text-[#CC8F46] bg-orange-50 px-2 py-0.5 rounded mt-2 inline-block">
                    {todo.assignees.join(' · ')}
                  </span>
                </div>
                
                {/* 🔴 修正：調整刪除按鈕佈局，確保不遮擋進度百分比 */}
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right font-black italic text-xl text-[#4E9A8E]">{progress}%</div>
                  <button 
                    onClick={() => handleDelete(todo.firestoreId)}
                    className="text-gray-200 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* 分層顯示頭像 */}
              <div className="space-y-6 mt-4">
                {/* A. 待完成區塊 - 顯示誰還沒做 */}
                {notDoneList.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-gray-300 uppercase italic flex items-center gap-1">
                      <Circle size={8} className="text-orange-400 fill-orange-400" /> Waiting For ({notDoneList.length})
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {notDoneList.map(name => {
                        const m = members.find(member => member.name === name);
                        return (
                          <button 
                            key={name} 
                            onClick={() => onToggleTodo(todo.firestoreId, name, true)} 
                            className="text-center group transition-transform active:scale-95"
                          >
                            <div className="relative">
                              <img src={m?.avatar} className="w-10 h-10 rounded-full border-2 border-gray-100 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                              <div className="absolute -top-1 -right-1 bg-white rounded-full shadow-sm text-gray-300">
                                 <Plus size={10} />
                              </div>
                            </div>
                            <p className="text-[8px] font-bold text-gray-400 mt-1">{name}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 分隔線：只有兩邊都有人才顯示 */}
                {notDoneList.length > 0 && activeDoneList.length > 0 && (
                  <div className="border-t border-dashed border-gray-100 my-2" />
                )}

                {/* B. 已完成區塊 - 顯示彩色勾勾頭像 */}
                {activeDoneList.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-[#4E9A8E] uppercase italic flex items-center gap-1">
                      <CheckCircle2 size={8} className="fill-[#4E9A8E]" /> Completed ({activeDoneList.length})
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {activeDoneList.map(name => {
                        const m = members.find(member => member.name === name);
                        return (
                          <button 
                            key={name} 
                            onClick={() => onToggleTodo(todo.firestoreId, name, false)} 
                            className="text-center relative transition-transform active:scale-95"
                          >
                            <div className="relative">
                              <img src={m?.avatar} className="w-10 h-10 rounded-full border-2 border-[#4E9A8E] shadow-sm" />
                              <div className="absolute -top-1 -right-1 bg-[#4E9A8E] text-white rounded-full p-0.5 shadow-sm">
                                <Check size={8} strokeWidth={4} />
                              </div>
                            </div>
                            <p className="text-[8px] font-bold text-[#4E9A8E] mt-1">{name}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* C. 管理負責人區塊 - 縮小版用於動態增減人員 */}
                <div className="pt-4 border-t border-gray-50">
                  <p className="text-[7px] font-black text-gray-200 uppercase tracking-widest mb-2">指派/取消負責人 (點擊頭像管理):</p>
                  <div className="flex flex-wrap gap-2">
                    {members.map(m => {
                      const isAssigned = todo.assignees.includes(m.name) || todo.assignees.includes("全體");
                      return (
                        <button 
                          key={m.firestoreId} 
                          onClick={() => handleToggleMemberAssignment(todo.firestoreId, m.name, todo.assignees)}
                          className={`w-6 h-6 rounded-full border transition-all ${isAssigned ? 'border-[#4E9A8E] opacity-100' : 'border-transparent opacity-20 grayscale'}`}
                        >
                          <img src={m.avatar} className="w-full h-full rounded-full object-cover" alt={m.name} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              </div>
          );
        })}
      </div>
    </div>
  );
}