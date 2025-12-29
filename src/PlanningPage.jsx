import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, Plus, CheckCircle2, Circle, Image as ImageIcon, X } from 'lucide-react';
import TodoPage from './TodoPage';     // 注意前面的 ./
import ShoppingPage from './ShoppingPage';

// 初始 38 項行李清單 (保持原樣)
const initialPackingItems = [
  { id: 1, name: "晶片護照", note: "", category: "行李清單" },
  { id: 2, name: "護照影本", note: "", category: "行李清單" },
  { id: 3, name: "2吋大頭照*2", note: "", category: "行李清單" },
  { id: 4, name: "身分證、健保卡", note: "", category: "行李清單" },
  { id: 5, name: "機票/保險單", note: "", category: "行李清單" },
  { id: 6, name: "網卡 / eSIM", note: "", category: "行李清單" },
  { id: 7, name: "日幣/台幣", note: "", category: "行李清單" },
  { id: 8, name: "交通卡", note: "", category: "行李清單" },
  { id: 9, name: "信用卡", note: "", category: "行李清單" },
  { id: 10, name: "手機、充電線", note: "", category: "行李清單" },
  { id: 11, name: "購物袋", note: "", category: "行李清單" },
  { id: 12, name: "行李秤", note: "", category: "行李清單" },
  { id: 13, name: "底片相機、底片", note: "所有底片要放手提！", category: "行李清單" },
  { id: 14, name: "腳架", note: "", category: "行李清單" },
  { id: 15, name: "御朱印帳", note: "", category: "行李清單" },
  { id: 16, name: "滑雪用品", note: "手套、雪襪、頭套、防摔褲", category: "行李清單" },
  { id: 17, name: "耳機", note: "", category: "行李清單" },
  { id: 18, name: "氣泡紙", note: "買酒用", category: "行李清單" },
  { id: 19, name: "相機、相機電池", note: "所有電池要放手提！", category: "行李清單" },
  { id: 20, name: "眼鏡", note: "", category: "行李清單" },
  { id: 21, name: "隱形眼鏡", note: "", category: "行李清單" },
  { id: 22, name: "化妝包", note: "", category: "行李清單" },
  { id: 23, name: "太陽眼鏡", note: "", category: "行李清單" },
  { id: 24, name: "小保溫瓶", note: "", category: "行李清單" },
  { id: 25, name: "洗漱用品", note: "", category: "行李清單" },
  { id: 26, name: "保養品", note: "", category: "行李清單" },
  { id: 27, name: "牙刷牙膏", note: "", category: "行李清單" },
  { id: 28, name: "雨傘", note: "", category: "行李清單" },
  { id: 29, name: "常備藥", note: "", category: "行李清單" },
  { id: 30, name: "保冷袋", note: "", category: "行李清單" },
  { id: 31, name: "濕紙巾、小包衛生紙", note: "", category: "行李清單" },
  { id: 32, name: "防曬乳", note: "", category: "行李清單" },
  { id: 33, name: "行動電源 (wH)", note: "不可託運。必須隨身攜帶。", category: "行李清單" },
  { id: 34, name: "洗衣袋", note: "", category: "行李清單" },
  { id: 35, name: "吹風機", note: "", category: "行李清單" },
  { id: 36, name: "電熱水壺", note: "", category: "行李清單" },
  { id: 37, name: "暖暖包", note: "", category: "行李清單" },
  { id: 38, name: "雪球夾", note: "", category: "行李清單" }
];

export default function PlanningPage({ 
  members, todos, onAddTodo, onToggleTodo, onUpdateTodo, onDeleteTodo,
  shoppingList, onAddShopping, onToggleShopping, onDeleteShopping 
}) {
  const [activeTab, setActiveTab] = useState('待辦');
  const [selectedAssignee, setSelectedAssignee] = useState('全體');
  const [shopFilter, setShopFilter] = useState('全部');
  const [newItemName, setNewItemName] = useState("");

  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('tokyo-ski-packing-items');
    if (saved) return JSON.parse(saved);
    return initialPackingItems.map(item => {
      const checkMap = {};
      members.forEach(m => { checkMap[m.id] = false; });
      return { ...item, checkMap, image: null };
    });
  });

  useEffect(() => {
    localStorage.setItem('tokyo-ski-packing-items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    setItems(prev => prev.map(item => {
      const newCheckMap = { ...item.checkMap };
      members.forEach(m => {
        if (newCheckMap[m.id] === undefined) newCheckMap[m.id] = false;
      });
      return { ...item, checkMap: newCheckMap };
    }));
  }, [members]);

  const addItem = () => {
    if (!newItemName.trim()) return;
    const checkMap = {};
    members.forEach(m => { checkMap[m.id] = false; });
    const newItem = { id: Date.now(), name: newItemName, note: "", category: activeTab, checkMap, image: null };
    setItems([newItem, ...items]);
    setNewItemName("");
  };

  const deleteItem = (id) => {
    if (window.confirm("確定要刪除此項嗎？")) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const handleImageUpload = (id, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setItems(items.map(i => i.id === id ? { ...i, image: reader.result } : i));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleCheck = (itemId, memberId) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { ...item, checkMap: { ...item.checkMap, [memberId]: !item.checkMap[memberId] } };
      }
      return item;
    }));
  };

  const processedItems = useMemo(() => {
    let list = items.filter(item => item.category === activeTab);
    return list.map(item => {
      const doneCount = Object.values(item.checkMap).filter(v => v).length;
      const progress = members.length === 0 ? 0 : Math.round((doneCount / members.length) * 100);
      const isCompleted = selectedAssignee === '全體' ? progress === 100 : item.checkMap[selectedAssignee];
      return { ...item, progress, isCompleted, doneCount };
    }).sort((a, b) => a.isCompleted - b.isCompleted);
  }, [items, activeTab, selectedAssignee, members]);

  const shopCategories = useMemo(() => {
  return ['全部', ...new Set(shoppingList.map(item => item.category || '未分類'))];
}, [shoppingList]);

const filteredShoppingList = useMemo(() => {
  if (shopFilter === '全部') return shoppingList;
  return shoppingList.filter(item => (item.category || '未分類') === shopFilter);
}, [shoppingList, shopFilter]);

  return (
    <div className="max-w-md mx-auto pb-24 animate-in fade-in">
      {/* 分類切換 */}
      <div className="flex bg-gray-100/50 p-1 rounded-2xl mx-6 mt-4">
        {['待辦', '行李清單', '購物清單'].map(t => (
          <button 
            key={t} 
            onClick={() => setActiveTab(t)} 
            className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === t ? 'bg-white shadow-sm text-[#4E9A8E]' : 'text-gray-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 條件渲染內容 */}
      {activeTab === '待辦' ? (
        <div className="mt-4">
          <TodoPage 
            todos={todos} 
            members={members} 
            onAddTodo={onAddTodo} 
            onToggleTodo={onToggleTodo}
            onUpdateTodo={onUpdateTodo} 
            onDeleteTodo={onDeleteTodo}
          />
        </div>
      ) : activeTab === '購物清單' ? (
        <div className="mt-4">
          {/* 分類標籤按鈕列 */}
          <div className="flex gap-2 overflow-x-auto px-6 mb-4 no-scrollbar">
            {shopCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setShopFilter(cat)}
                className={`flex-none px-4 py-1.5 rounded-xl text-[10px] font-black border transition-all ${
                  shopFilter === cat 
                  ? 'bg-[#CC8F46] text-white border-[#CC8F46] shadow-sm' 
                  : 'bg-white text-gray-400 border-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <ShoppingPage 
            members={members} 
            items={filteredShoppingList} 
            onAdd={onAddShopping} 
            onToggle={onToggleShopping} 
            onDelete={onDeleteShopping} 
          />
        </div>
      ) : (
        <>
          {/* 成員/全體切換 */}
          <div className="flex gap-2 overflow-x-auto px-6 py-4 no-scrollbar">
            <button 
              onClick={() => setSelectedAssignee('全體')} 
              className={`flex-none px-4 py-2 rounded-xl text-[10px] font-black border ${selectedAssignee === '全體' ? 'bg-[#2A3B49] text-white' : 'bg-white text-gray-400'}`}
            >
              全體進度
            </button>
            {members.map(m => (
              <button 
                key={m.firestoreId || m.id} 
                onClick={() => setSelectedAssignee(m.firestoreId || m.id)} 
                className={`flex-none px-4 py-2 rounded-xl text-[10px] font-black border flex items-center gap-2 ${selectedAssignee === (m.firestoreId || m.id) ? 'bg-[#4E9A8E] text-white' : 'bg-white text-gray-400'}`}
              >
                <img src={m.avatar} className="w-4 h-4 rounded-full" alt={m.name} />{m.name}
              </button>
            ))}
          </div>

          <div className="px-6 space-y-4">
            {/* 新增項目輸入框 */}
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newItemName} 
                onChange={(e) => setNewItemName(e.target.value)} 
                placeholder={`新增${activeTab}...`} 
                className="flex-1 bg-white border border-gray-100 px-4 py-3 rounded-2xl text-xs font-bold shadow-sm outline-none" 
              />
              <button onClick={addItem} className="bg-[#4E9A8E] text-white p-3 rounded-2xl shadow-md">
                <Plus size={20}/>
              </button>
            </div>

            {/* 列表內容 */}
            <div className="space-y-3">
              {processedItems.map(item => (
                <div key={item.id} className={`bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm ${item.isCompleted ? 'opacity-40' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      {selectedAssignee === '全體' ? (
                        <div className="w-10 h-10 rounded-full border-2 border-[#F0F4EF] flex items-center justify-center text-[10px] font-black text-[#4E9A8E]">
                          {item.progress}%
                        </div>
                      ) : (
                        <button onClick={() => toggleCheck(item.id, selectedAssignee)} className="text-[#4E9A8E]">
                          {item.checkMap[selectedAssignee] ? <CheckCircle2 size={24} fill="#4E9A8E" color="white" /> : <Circle size={24} />}
                        </button>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-bold text-sm truncate ${item.isCompleted ? 'line-through' : ''}`}>{item.name}</h3>
                        <div className="flex gap-1">
                          <label className="cursor-pointer text-gray-300 hover:text-[#4E9A8E]">
                            <ImageIcon size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(item.id, e)} />
                          </label>
                          <button onClick={() => deleteItem(item.id)} className="text-gray-200 hover:text-red-400">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </div>
                      
                      {selectedAssignee === '全體' && (
                        <div className="mt-2 w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-[#4E9A8E] h-full transition-all" style={{ width: `${item.progress}%` }}></div>
                        </div>
                      )}

                      {item.image && (
                        <div className="mt-2 relative inline-block">
                          <img src={item.image} className="w-20 h-20 object-cover rounded-xl border border-gray-100" alt="uploaded" />
                          <button 
                            onClick={() => setItems(items.map(i => i.id === item.id ? { ...i, image: null } : i))} 
                            className="absolute -top-1 -right-1 bg-white rounded-full shadow-sm text-red-400"
                          >
                            <X size={12}/>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}