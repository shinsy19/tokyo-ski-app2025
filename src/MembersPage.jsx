import React, { useState } from 'react';
import { Plus, UserPlus, Trash2, Image as ImageIcon } from 'lucide-react'; // 補上 ImageIcon

export default function MembersPage({ members, onAdd, onDelete }) {
  const [newName, setNewName] = useState('');
  const [tempAvatar, setTempAvatar] = useState(null); // 補上狀態定義

  // 補上處理圖片上傳的邏輯
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempAvatar(reader.result); // 轉為 Base64
      };
      reader.readAsDataURL(file);
    }
  };

  const addMember = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMember = {
      id: `m${Date.now()}`, 
      name: newName,
      // 如果有自定義頭像就使用它，否則使用預設生成
      avatar: tempAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newName)}`,
      role: "成員", // 補上雲端需要的屬性
      joinedAt: new Date().toISOString() // 補上加入時間
    };

    onAdd(newMember); // 觸發父組件更新並存入 localStorage
    setNewName('');
    setTempAvatar(null); // 成功後清空預覽
  };

  return (
    <main className="max-w-md mx-auto p-6 pb-24 animate-in fade-in duration-500">
      <h2 className="text-2xl font-black italic mb-6 flex items-center gap-2 tracking-tighter uppercase text-[#2A3B49]">
        Group Members
      </h2>

      {/* 整合後的表單 */}
      <form onSubmit={addMember} className="space-y-4 mb-8">
        <div className="flex gap-2">
          <input 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)}
            placeholder="輸入成員姓名..."
            className="flex-1 bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-[#4E9A8E] transition-all"
          />
          <button type="submit" className="bg-[#4E9A8E] text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-transform">
            <UserPlus size={24} />
          </button>
        </div>

        {/* 圖片上傳區域 */}
        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border-2 border-dashed border-gray-100">
          <label className="flex flex-col items-center justify-center w-12 h-12 bg-gray-50 rounded-full cursor-pointer hover:bg-gray-100 overflow-hidden border border-gray-100">
            {tempAvatar ? (
              <img src={tempAvatar} className="w-full h-full object-cover" alt="preview" />
            ) : (
              <ImageIcon size={20} className="text-gray-400" />
            )}
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
            {tempAvatar ? '已選擇自定義頭像' : '點擊圖示上傳頭像 (可選)'}
          </p>
        </div>
      </form>

      {/* 成員列表顯示 */}
      <div className="grid grid-cols-2 gap-4">
        {members.map(m => (
          <div key={m.firestoreId ||m.id} className="bg-white p-4 rounded-[2rem] border border-[#4E9A8E]/10 shadow-sm flex flex-col items-center relative group animate-in zoom-in-95 duration-300">
            <img 
              src={m.avatar} 
              className="w-16 h-16 rounded-full border-2 border-[#F0F4EF] mb-3 shadow-inner bg-[#F8F7F2] object-cover" 
              alt={m.name} 
            />
            <span className="text-sm font-black text-[#2A3B49] uppercase tracking-tighter">
              {m.name}
            </span>
            <button 
              onClick={() => {
                // 優先使用雲端的 firestoreId，若無則回退至本地 id
                const targetId = m.firestoreId || m.id;
                onDelete(targetId);
              }}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-red-400 hover:text-red-600 hover:scale-110 transition-all shadow-sm border border-red-50"
              title="移除成員"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}