import React, { useState } from 'react';
import { Plus, Trash2, Camera, X, CheckCircle2, Circle, ZoomIn } from 'lucide-react';

export default function ShoppingPage({ items, onAdd, onToggle, onDelete, members }) {
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null); 
  const [filterTag, setFilterTag] = useState('全部');
  const allTags = ['全部', ...new Set(items.flatMap(item => item.subItems || []))];
  const filteredItems = filterTag === '全部' 
  ? items 
  : items.filter(item => item.subItems?.includes(filterTag));

  
  const [newItem, setNewItem] = useState({
    title: '',
    quantity: 1,
    image: '',
    note: '', 
    subItems: [], 
    category: '一般'
  });
  const [tempSubItem, setTempSubItem] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ski_app_preset'); 

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dqr4ofzd0/image/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('上傳失敗');
      
      const data = await res.json();
      setNewItem(prev => ({ ...prev, image: data.secure_url }));
    } catch (err) {
      console.error(err);
      alert('圖片上傳失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubItem = () => {
    if (!tempSubItem.trim()) return;
    setNewItem(prev => ({ 
      ...prev, 
      subItems: [...prev.subItems, tempSubItem.trim()] 
    }));
    setTempSubItem('');
  };

  const submitNewItem = () => {
    if (!newItem.title.trim()) return;
    onAdd(newItem);
    setNewItem({ title: '', quantity: 1, image: '', note: '', subItems: [], category: '一般' });
    setShowAdd(false);
  };

  return (
    <div className="space-y-4 px-4 pb-24">
      {/* 1. 圖片燈箱 Lightbox */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img src={lightboxImg} className="max-w-full max-h-full rounded-lg shadow-2xl animate-in zoom-in-95" alt="放大圖" />
          <button className="absolute top-10 right-10 text-white bg-white/10 p-3 rounded-full"><X /></button>
        </div>
      )}

      {/* 2. 新增按鈕 */}
      <button onClick={() => setShowAdd(!showAdd)} className="w-full py-4 bg-[#76B352] text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2">
        {showAdd ? <X size={20} /> : <Plus size={20} />}
        {showAdd ? '取消新增' : '新增購物項目'}
      </button>

      {!showAdd && (
  <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
    {allTags.map(tag => (
      <button
        key={tag}
        onClick={() => setFilterTag(tag)}
        className={`flex-none px-4 py-1.5 rounded-xl text-[10px] font-black border transition-all ${
          filterTag === tag 
          ? 'bg-[#CC8F46] text-white border-[#CC8F46] shadow-md' 
          : 'bg-white text-gray-400 border-gray-100'
        }`}
      >
        {tag}
      </button>
    ))}
  </div>
)}

      {/* 3. 新增面板 */}
      {showAdd && (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-[#76B352] space-y-4 animate-in slide-in-from-top">
          <input type="text" placeholder="項目名稱" className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
          
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-black opacity-30 uppercase ml-2 mb-1">數量</p>
              <input type="number" className="w-full p-4 bg-gray-50 rounded-xl font-bold" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black opacity-30 uppercase ml-2 mb-1">圖片</p>
              <label className="flex items-center justify-center w-full h-[56px] bg-gray-50 rounded-xl cursor-pointer border-2 border-dashed border-gray-200">
                {loading ? <div className="animate-spin h-5 w-5 border-2 border-[#76B352] border-t-transparent rounded-full" /> : (newItem.image ? <div className="text-[#76B352] text-[10px] font-bold">OK</div> : <Camera className="opacity-20" />)}
                <input type="file" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          <textarea placeholder="備註 (細節說明...)" className="w-full p-4 bg-gray-50 rounded-xl font-medium text-sm h-20 outline-none" value={newItem.note} onChange={e => setNewItem({...newItem, note: e.target.value})} />

          <div>
            <p className="text-[10px] font-black opacity-30 uppercase ml-2 mb-2">分類標籤 (如：3COINS, mont-bell, 藥妝)</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 p-3 bg-gray-50 rounded-xl text-sm outline-none" 
                placeholder="+ 按下 Enter 新增標籤" 
                value={tempSubItem}
                onChange={e => setTempSubItem(e.target.value)} 
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubItem();
                  }
                }} 
              />
              <button type="button" onClick={handleAddSubItem} className="px-4 bg-gray-200 rounded-xl font-bold">+</button>
            </div>
            {/* 顯示已新增的標籤 */}
            <div className="flex flex-wrap gap-2 mt-2">
              {newItem.subItems.map((s, i) => (
                <span key={i} className="text-[10px] bg-[#76B352]/10 text-[#76B352] px-3 py-1 rounded-full font-bold flex items-center gap-1">
                  #{s} <X size={10} onClick={() => setNewItem({...newItem, subItems: newItem.subItems.filter((_, idx) => idx !== i)})} className="cursor-pointer" />
                </span>
              ))}
            </div>
          </div>

          <button onClick={submitNewItem} className="w-full py-4 bg-[#2A3B49] text-white rounded-2xl font-black">確認加入清單</button>
        </div>
      )}

      {/* 4. 清單顯示 */}
      <div className="grid gap-4">
        {filteredItems.map((item) => (
          <div key={item.firestoreId} className={`bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 transition-all ${item.completed ? 'grayscale opacity-50 bg-gray-50' : ''}`}>
            <div className="flex p-4 gap-4">
              <div className="relative group cursor-zoom-in" onClick={() => item.image && setLightboxImg(item.image)}>
                <img src={item.image || 'https://via.placeholder.com/150?text=No+Img'} className="w-24 h-24 rounded-2xl object-cover bg-gray-50 flex-none" alt="" />
                {item.image && <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl"><ZoomIn className="text-white" size={20}/></div>}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className={`font-black text-lg truncate ${item.completed ? 'line-through text-gray-400' : ''}`}>
                    {item.title} 
                    <span className="ml-2 text-xs text-[#CC8F46] font-bold">x {item.quantity}</span>
                  </h4>
                  <button onClick={() => onDelete(item.firestoreId)} className="text-red-200 hover:text-red-400"><Trash2 size={16}/></button>
                </div>

                {item.note && <p className="text-[11px] text-gray-400 mt-1 italic font-medium">{item.note}</p>}
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.subItems?.map((s, i) => (
                    <span key={i} className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-bold italic">#{s}</span>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <select 
                    className={`text-[10px] font-black border-none rounded-lg p-1 ${item.completed ? 'bg-[#76B352] text-white' : 'bg-gray-100 text-gray-400'}`}
                    value={item.completedBy || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      onToggle(item.firestoreId, val, val !== "");
                    }}
                  >
                    <option value="">誰買了？</option>
                    {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                  {item.completed && <span className="text-[10px] font-black text-[#76B352] uppercase italic tracking-widest">Completed</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}