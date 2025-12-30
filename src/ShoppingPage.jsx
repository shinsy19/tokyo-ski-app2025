import React, { useState } from 'react';
// 補上 Edit3 圖示
import { Plus, Trash2, Camera, X, CheckCircle2, Circle, ZoomIn, Edit3 } from 'lucide-react';

// 在參數列補上 onUpdate
export default function ShoppingPage({ items, onAdd, onToggle, onUpdate, onDelete, members }) {
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null); 
  const [filterTag, setFilterTag] = useState('全部');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubItems, setEditSubItems] = useState([]);
  const [tempEditSubItem, setTempEditSubItem] = useState('');
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

  const handleUpdateSubmit = (id) => {
    if (!editTitle.trim()) return;
    onUpdate(id, { 
      title: editTitle, 
      subItems: editSubItems 
    });
    setEditingId(null);
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
          <div key={item.firestoreId} className={`card mb-8 transition-all relative ${item.completed ? 'opacity-80' : ''}`}>
    {/* 模擬 PDF 中的紙膠帶貼飾 */}
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-[#CC8F46]/30 shadow-sm z-10 rotate-2"></div>
    
    <div className="flex p-5 gap-4">
      {/* 照片區：套用 App.css 中的 photo-frame */}
      <div 
        className="photo-frame flex-none w-28 h-28 cursor-zoom-in overflow-hidden" 
        onClick={() => item.image && setLightboxImg(item.image)}
      >
        <img 
          src={item.image || 'https://via.placeholder.com/150?text=No+Img'} 
          className="w-full h-full object-cover" 
          alt="商品圖" 
        />
      </div>

      {editingId === item.firestoreId ? (
          <div className="space-y-3 animate-in fade-in">
            <input 
              className="w-full text-sm font-bold border-b-2 border-[#CC8F46] outline-none bg-orange-50/30 px-2 py-1" 
              value={editTitle} 
              onChange={e => setEditTitle(e.target.value)} 
            />
            <div className="flex gap-1 flex-wrap">
              {editSubItems.map((s, i) => (
                <span key={i} className="text-[9px] bg-[#76B352]/10 text-[#76B352] px-2 py-1 rounded-full flex items-center gap-1 font-bold">
                  #{s} <X size={10} className="cursor-pointer" onClick={() => setEditSubItems(editSubItems.filter((_, idx) => idx !== i))} />
                </span>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <input 
                placeholder="新增標籤..." 
                className="text-[10px] border-b border-gray-200 outline-none w-20"
                value={tempEditSubItem}
                onChange={e => setTempEditSubItem(e.target.value)}
                onKeyDown={e => {
                  if(e.key === 'Enter') {
                    setEditSubItems([...editSubItems, tempEditSubItem]);
                    setTempEditSubItem('');
                  }
                }}
              />
              <button onClick={() => handleUpdateSubmit(item.firestoreId)} className="text-[10px] font-black text-[#76B352] bg-[#76B352]/10 px-3 py-1 rounded-lg">儲存</button>
              <button onClick={() => setEditingId(null)} className="text-[10px] font-black text-gray-300">取消</button>
            </div>
          </div>
        ) : (
          
            <div className="flex flex-col gap-1 flex-1 min-w-0">
  <div className="flex justify-between items-start w-full gap-2">
    <h4 className={`font-black text-xl italic tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis flex-1 ${item.completed ? 'text-gray-400 line-through' : 'text-[#2A3B49]'}`}>
      {item.title} 
      <span className="ml-2 text-sm text-[#CC8F46] not-italic">x{item.quantity}</span>
    </h4>
              <div className="flex gap-2">
                <button onClick={() => {
                  setEditingId(item.firestoreId);
                  setEditTitle(item.title);
                  setEditSubItems(item.subItems || []);
                }} className="text-gray-300 hover:text-[#4E9A8E] transition-colors">
                  <Edit3 size={16} /> {/* 請確保頂部有 import { Edit3 } */}
                </button>
                <button onClick={() => onDelete(item.firestoreId)} className="text-red-200 hover:text-red-400">
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {item.subItems?.map((s, i) => (
                <span key={i} className="highlight-note text-[9px]">#{s}</span>
              ))}
            </div>
          </div>
        )}

                {/* 5. 購買狀態 UI 區區塊 */}
            <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-100 pt-3">
              {/* 購買人選擇器 */}
              <select 
                className={`text-[10px] font-black border-none rounded-lg p-1 ${item.completed ? 'bg-[#76B352] text-white' : 'bg-gray-100 text-gray-400'}`}
                value={item.completedBy || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  onToggle(item.firestoreId, val, val !== "");
                }}
              >
                <option value="">購買人</option>
                {members.map(m => <option key={m.firestoreId || m.id} value={m.name}>{m.name}</option>)}
              </select>

              {/* PDF 風格勾選框 */}
              <div className="flex items-center gap-1.5">
                {item.completed ? (
                  <div className="flex items-center gap-1 text-[#76B352] animate-in zoom-in">
                    <div className="w-5 h-5 border-2 border-[#76B352] flex items-center justify-center rounded-sm">
                      <CheckCircle2 size={14} fill="#76B352" color="white" />
                    </div>
                    <span className="text-[10px] font-black italic uppercase tracking-tighter">V 已購買</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-300">
                    <div className="w-5 h-5 border-2 border-gray-200 rounded-sm"></div>
                    <span className="text-[10px] font-black italic uppercase tracking-tighter">未購買</span>
                  </div>
                )}
              </div>
            </div>
          </div> 
        </div> 
    ))}
  </div>
</div>
);
}