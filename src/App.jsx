import React, { useState, useMemo, useEffect, useCallback } from 'react';
// 1. 統一導入 Firebase 方法
import { db } from './firebase';
import {
  collection, onSnapshot, query, orderBy, addDoc,
  doc, updateDoc, deleteDoc, serverTimestamp,
  arrayUnion, arrayRemove
} from 'firebase/firestore';

// 2. 第三方庫與組件
import {
  Calendar, Plane, Ticket, Users, Hotel, Luggage, MapPin,
  Navigation, Train, Shirt, PenTool, ExternalLink, Sparkles, X
} from 'lucide-react';
import { itinerary, bookings, membersData } from './data';
import PlanningPage from './PlanningPage';
import MembersPage from './MembersPage';
import JournalPage from './JournalPage';
import './App.css';

export default function App() {
  // --- States ---
  const [tab, setTab] = useState('schedule');
  const [selectedSki, setSelectedSki] = useState(null);
  const [dayIdx, setDayIdx] = useState(0);
  const [groupIdx, setGroupIdx] = useState(0);
  const [bookingSubTab, setBookingSubTab] = useState('flight');
  const [itineraryData, setItineraryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [todos, setTodos] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [members, setMembers] = useState(membersData);
  const [selectedDate, setSelectedDate] = useState("");

  // --- Firebase 寫入邏輯 (使用 useCallback 優化效能) ---

  const handleAddTodo = useCallback(async (newTodo) => {
    try {
      await addDoc(collection(db, "todos"), {
        ...newTodo,
        createdAt: serverTimestamp()
      });
    } catch (e) { console.error("新增待辦失敗:", e); }
  }, []);

  const handleToggleTodo = useCallback(async (todoId, memberName, isDone) => {
    try {
      const todoRef = doc(db, "todos", todoId);
      await updateDoc(todoRef, {
        completedBy: isDone ? arrayUnion(memberName) : arrayRemove(memberName)
      });
    } catch (e) { console.error("更新狀態失敗:", e); }
  }, []);

  const handleDeleteTodo = useCallback(async (todoId) => {
    try {
      await deleteDoc(doc(db, "todos", todoId));
    } catch (e) { console.error("刪除失敗:", e); }
  }, []);

  const handleAddShopping = useCallback(async (newItem) => {
  try {
    await addDoc(collection(db, "shopping"), {
      ...newItem,
      category: newItem.category || "未分類", // 確保有分類標籤
      completed: false,
      completedBy: null,
      createdAt: serverTimestamp()
    });
  } catch (e) { console.error(e); }
}, []);

  const handleToggleShopping = useCallback(async (id, memberName, isCompleted) => {
    try {
      await updateDoc(doc(db, "shopping", id), {
        completed: isCompleted,
        completedBy: isCompleted ? memberName : null
      });
    } catch (e) { console.error(e); }
  }, []);

  const uploadMembersToCloud = async () => {
    const { doc, setDoc } = await import("firebase/firestore");
    try {
      for (const m of membersData) {
        await setDoc(doc(db, "members", m.id.toString()), m);
      }
      alert("✅ 初始成員資料已同步至雲端！");
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTodo = useCallback(async (todoId, updates) => {
    try {
      const todoRef = doc(db, "todos", todoId);
      await updateDoc(todoRef, updates);
    } catch (e) { console.error("更新代辦失敗:", e); }
  }, []);

  const handleDeleteShopping = useCallback(async (itemId) => {
    try {
      const itemRef = doc(db, "shopping", itemId);
      await deleteDoc(itemRef);
    } catch (e) { console.error("刪除購物項目失敗:", e); }
  }, []);

  const handleAddPost = useCallback(async (newPost) => {
    try {
      await addDoc(collection(db, "journal"), { ...newPost, createdAt: serverTimestamp() });
    } catch (e) { console.error("發布日誌失敗:", e); }
  }, []);

  const handleAddMember = useCallback(async (newMember) => {
    try {
      await addDoc(collection(db, "members"), newMember);
    } catch (e) { console.error("新增成員失敗:", e); }
  }, []);

  const handleDeleteMember = useCallback(async (id) => {
    if (!window.confirm("確定移除？")) return;
    try {
      await deleteDoc(doc(db, "members", id));
    } catch (e) { console.error("刪除成員失敗:", e); }
  }, []);

  // --- Firebase 即時監聽 (useEffect) ---

  useEffect(() => {
    // 監聽行程
    const qItinerary = query(collection(db, "itinerary"), orderBy("date", "asc"));
    const unsubItinerary = onSnapshot(qItinerary, (snap) => {
      setItineraryData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // 監聽待辦
    const qTodos = query(collection(db, "todos"), orderBy("createdAt", "desc"));
    const unsubTodos = onSnapshot(qTodos, (snap) => {
      setTodos(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
    });

    // 監聽購物清單
    const qShopping = query(collection(db, "shopping"), orderBy("createdAt", "desc"));
    const unsubShopping = onSnapshot(qShopping, (snap) => {
      setShoppingList(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
    });

    // 監聽日誌
    const qJournal = query(collection(db, "journal"), orderBy("createdAt", "desc"));
    const unsubJournal = onSnapshot(qJournal, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 監聽成員
    const qMembers = query(collection(db, "members"));
    const unsubMembers = onSnapshot(qMembers, (snap) => {
      setMembers(snap.docs.map(d => ({ ...d.data(), firestoreId: d.id })));
    });

    // Cleanup: 組件卸載時取消所有監聽
    return () => {
      unsubItinerary();
      unsubTodos();
      unsubShopping();
      unsubJournal();
      unsubMembers();
    };
  }, []);

  // --- Memoized Values ---
  const flightDates = useMemo(() => {
    const dates = [...new Set(bookings
      .filter(b => b.category.includes('機票'))
      .map(f => f.category.match(/\d{2}\/\d{2}/)?.[0])
    )].filter(Boolean);
    return dates.sort((a, b) => a.startsWith('12') ? -1 : 1);
  }, [bookings]);

  useEffect(() => {
    if (flightDates.length > 0 && !selectedDate) setSelectedDate(flightDates[0]);
  }, [flightDates, selectedDate]);

  // --- Render Logic ---
  if (loading) return <div className="loading-screen">...</div>;



  return (
    <div id="root" className="min-h-screen text-[#2A3B49] pb-32 font-sans antialiased">
      <header className="p-6 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#4E9A8E] italic uppercase tracking-tighter">東京跨年滑雪團</h1>
          <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest leading-none">Winter 2025-2026</p>
        </div>
        <div className="flex -space-x-2">
          {members && members.length > 0 && members.map((m, idx) => (
            <img
              key={m.firestoreId || `member-${idx}`}
              src={m.avatar}
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-white"
              alt={m.name}
            />
          ))}
        </div>
      </header>


      {tab === 'schedule' && (
        <main className="max-w-md mx-auto animate-in fade-in">
          {/* 日期選擇器 */}
          <div className="flex gap-3 overflow-x-auto p-4 no-scrollbar sticky top-[81px] bg-[#F8F7F2]/95 z-40 backdrop-blur-sm">
            {itineraryData?.map((d, i) => (
              <button
                key={i}
                onClick={() => { setDayIdx(i); setGroupIdx(0); }}
                className={`flex-none px-5 py-3 rounded-2xl border transition-all ${dayIdx === i ? 'bg-[#CC8F46] text-white shadow-md scale-105' : 'bg-white opacity-40'}`}
              >
                <span className="text-xs font-black">{d.date}</span>
              </button>
            ))}
          </div>

          {/* 分組選擇 (A/B組) */}
          {itineraryData[dayIdx]?.groups && itineraryData[dayIdx]?.groups?.length > 1 && (
            <div className="flex px-6 gap-2 mb-4">
              {itineraryData[dayIdx]?.groups?.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setGroupIdx(i)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${groupIdx === i ? 'border-[#4E9A8E] bg-[#4E9A8E]/10 text-[#4E9A8E]' : 'border-gray-100 text-gray-300'}`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          )}

          {/* 行程內容 */}
          <div className="px-6 itinerary-timeline space-y-6">
            {/* 天氣資訊 */}
            <div className="bg-[#2A3B49] text-white p-5 rounded-[2.5rem] shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{itineraryData[dayIdx]?.weather?.icon || "❄️"}</span>
                  <div>
                    <p className="text-[10px] font-bold text-[#CC8F46] uppercase tracking-widest">Temp</p>
                    <p className="text-xl font-black">{itineraryData[dayIdx]?.weather?.temp || "--"}</p>
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl flex items-start gap-2 border border-white/5 max-w-[180px]">
                  <Shirt size={16} className="text-[#CC8F46] shrink-0 mt-0.5" />
                  <p className="text-[10px] opacity-80 leading-snug font-medium italic">{itineraryData[dayIdx]?.weather?.wear || "載入中..."}</p>
                </div>
              </div>
            </div>

            {/* 行程清單 - 已修正標籤閉合問題 */}
            {(itineraryData[dayIdx]?.groups
              ? itineraryData[dayIdx].groups[groupIdx]?.activities
              : itineraryData[dayIdx]?.activities || []
            ).map((act, i) => (
              <div key={i} className="timeline-item">
                {/* 移除重複的 key={i}，保持 card 與內容結構 */}
                <div
                  className={`flex gap-4 group ${act.details ? 'cursor-pointer' : ''}`}
                >
                  <div className="w-10 text-[10px] font-black text-gray-300 pt-1 tracking-tighter">
                    {act.time}
                  </div>

                  {/* 修正：確保 class 是 "flex-1 card p-4 relative" 以對應 CSS 紙膠帶效果 */}
                  <div className="flex-1 card p-4 relative">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm leading-tight pr-4">
                        {act.title}
                        {act.details && <span className="ml-2 text-[10px] text-[#4E9A8E] font-black underline">DETAIL+</span>}
                      </h3>
                    </div>

                    {act.map && (
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(act.map); }}
                        className="bg-[#4E9A8E]/10 p-2 rounded-xl text-[#4E9A8E] flex items-center gap-1 hover:bg-[#4E9A8E] hover:text-white transition-colors"
                      >
                        <Navigation size={14} />
                        <span className="text-[9px] font-black">導航</span>
                      </button>
                    )}
                  </div>

                  {/* 導遊職職：彩色亮顯文字整合區 */}
                  <div className="text-[11px] opacity-70 leading-relaxed whitespace-pre-line">
                    {act.note.split('\n').map((line, idx) => (
                      <span
                        key={idx}
                        className="block"
                        dangerouslySetInnerHTML={{
                          __html: line
                            .replace(/必吃美食|必點菜單/g, '<b style="color: #CC8F46;">$&</b>')
                            .replace(/必買伴手禮/g, '<b style="color: #76B352;">$&</b>')
                            .replace(/重要預約代號|重要提醒/g, '<b style="color: #EF4444;">$&</b>')
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>
        </main>
  )
}

{
  tab === 'booking' && (
    <main className="max-w-md mx-auto px-6 space-y-4 pt-4 animate-in fade-in">
      <div className="flex gap-1 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
        {['flight', 'stay', 'transport', 'voucher'].map(sub => (
          <button key={sub} onClick={() => setBookingSubTab(sub)}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${bookingSubTab === sub ? 'bg-[#76B352] text-white shadow-md' : 'text-gray-400'}`}>
            {sub === 'flight' ? '機票' : sub === 'stay' ? '住宿' : sub === 'transport' ? '交通' : '憑證'}
          </button>
        ))}
      </div>

      {bookingSubTab === 'flight' && (
        <div className="space-y-6">
          {/* 日期切換按鈕 */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {flightDates.map(date => (
              <button key={date} onClick={() => setSelectedDate(date)} className={`px-6 py-2 rounded-full text-[10px] font-black transition-all ${selectedDate === date ? 'bg-[#2A3B49] text-white shadow-md' : 'bg-white text-gray-400 border'}`}>
                {date}
              </button>
            ))}
          </div>

          {/* 機票卡片渲染 */}
          {bookings.filter(f => f.category.includes('機票') && f.category.includes(selectedDate)).map((flight, idx) => {
            // 自動判定去回程邏輯
            const isReturn = selectedDate === '01/04' || selectedDate === '01/05';
            const originLabel = isReturn ? `成田 ${flight.terminalNRT}` : `桃園 ${flight.terminalTPE}`;
            const destLabel = isReturn ? `桃園 ${flight.terminalTPE}` : `成田 ${flight.terminalNRT}`;

            return (
              <div key={idx} className="ticket-info mb-6"> {/* 套用虛線剪割線與票券凹槽 [cite: 230] */}
                <div className="card p-6"> {/* 使用 card 取代原本複雜的背景設定 */}
                  <div className="flex justify-start items-center mb-6 px-2 text-gray-400">
                    <span className="ticket-title uppercase">{flight.title}</span> {/* 使用 ticket-title 模擬機票斜體 [cite: 230] */}
                  </div>

                  <div className="text-center mb-8 relative">
                    {/* 使用 location-header 達成極寬字距與焦糖棕色 [cite: 227] */}
                    <h2 className="location-header">{flight.flightNo}</h2>
                  </div>

                  <div className="flex justify-between items-center px-2 mb-8">
                    <div className="text-center">
                      <p className="text-3xl font-black text-[#6D5D4E]">{flight.details.split(' -> ')[0]}</p>
                      <p className="text-xl font-bold mt-1 tracking-tighter">{flight.time.split(' - ')[0]}</p>
                      <span className="text-[10px] bg-[#76B352] text-white px-3 py-0.5 rounded-full mt-2 inline-block font-bold">
                        {originLabel}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col items-center opacity-40 px-2">
                      <span className="text-[9px] font-black mb-1 italic uppercase tracking-widest">Flying</span>
                      <div className="w-full border-t border-dashed border-gray-400 relative">
                        <Plane size={14} className="absolute -top-[7px] left-1/2 -translate-x-1/2 bg-white px-1 text-[#76B352]" />
                      </div>
                      <span className="text-[9px] font-black mt-1 italic uppercase tracking-widest">{selectedDate}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black text-[#6D5D4E]">{flight.details.split(' -> ')[1]}</p>
                      <p className="text-xl font-bold mt-1 tracking-tighter">{flight.time.split(' - ')[1] || '--:--'}</p>
                      <span className="text-[10px] bg-orange-400 text-white px-3 py-0.5 rounded-full mt-2 inline-block font-bold">
                        {destLabel}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-dashed border-gray-200 pt-6 mt-4 mx-2">
                    <div className="flex flex-col items-center border-r border-gray-100">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2">Baggage</p>
                      <div className="flex items-center gap-2"><Luggage size={16} className="text-[#4E9A8E]" /><span className="text-sm font-black text-[#6D5D4E]">{flight.baggage}</span></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2">Aircraft</p>
                      <div className="flex items-center gap-2"><Plane size={16} className="text-orange-400" /><span className="text-sm font-black text-[#6D5D4E] font-mono">{flight.aircraft}</span></div>
                    </div>
                  </div>
                  <div className="mt-6 px-2">
                    <p className="text-[10px] opacity-40 font-bold italic leading-relaxed uppercase border-l-2 border-[#76B352] pl-3">
                      {flight.note}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {bookingSubTab === 'stay' && bookings.filter(b => b.category.includes('住宿')).map((b, i) => (
        <div key={i} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 mb-6">
          {/* 住宿照片 */}
          <img src={b.image} className="w-full h-44 object-cover" alt="Hotel" />

          <div className="p-6 space-y-4">
            {/* 標題與地址 */}
            <h3 className="font-black text-xl italic tracking-tighter text-[#2A3B49]">{b.title}</h3>
            <div className="flex items-start gap-2 text-[10px] opacity-50">
              <MapPin size={14} className="shrink-0 text-[#76B352]" /> {b.address}
            </div>

            {/* Check In / Out 時間 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl text-center">
                <p className="text-[8px] font-black opacity-30 uppercase tracking-widest text-gray-400">Check In</p>
                <p className="text-sm font-black">{b.checkIn}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl text-center">
                <p className="text-[8px] font-black opacity-30 uppercase tracking-widest text-gray-400">Check Out</p>
                <p className="text-sm font-black">{b.checkOut}</p>
              </div>
            </div>

            {/* 1. 顯示分房資訊 (groups) */}
            {b.groups && b.groups.length > 0 && (
              <div className="pt-4 border-t border-dashed border-gray-200 space-y-3">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Room Assignments</p>
                {b.groups.map((g, idx) => (
                  <div key={idx} className="bg-[#F8F9FA] p-3 rounded-xl border-l-4 border-[#4E9A8E]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-black text-[#2A3B49]">{g.name} - {g.ref}</span>
                    </div>
                    <p className="text-[10px] font-bold text-[#9C4B2C] italic">{g.members}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 2. 顯示備註資訊 (note) */}
            {b.note && (
              <div className="mt-4 p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-orange-400" />
                  <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Important Note</span>
                </div>
                <p className="text-[11px] font-bold text-[#6D5D4E] leading-relaxed italic">
                  {b.note}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* 3. 交通分頁 (修正表格空白問題) */}
      {bookingSubTab === 'transport' && bookings.filter(b => b.category.includes('交通')).map((b, i) => (
        <div key={i} className="space-y-4 mb-8">
          <div className="bg-[#2A3B49] text-white p-6 rounded-[2rem] shadow-lg relative overflow-hidden">
            <h3 className="text-xl font-black mb-1 flex items-center gap-2 italic uppercase"><Train size={24} /> {b.title}</h3>
            <p className="text-[10px] font-bold text-[#76B352] mb-3">{b.directionInfo}</p> {/* 補上方向指引 */}
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold opacity-90 leading-relaxed italic">{b.exchangeInfo}</p>
              {b.importantNote && <p className="text-[10px] text-orange-300 font-bold mt-1">⚠️ {b.importantNote}</p>}
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-gray-50">
                {b.groups.map((g, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-4 text-[10px] font-bold text-gray-400">{g.date}</td>
                    <td className="p-4 font-black text-[#6D5D4E] text-xs">
                      <span className="block text-[9px] text-[#76B352] font-black uppercase tracking-tighter">{g.trainNo}</span>
                      {g.time}
                    </td>
                    <td className="p-4 font-bold text-[10px] text-orange-400 text-right leading-tight">
                      {g.remark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* 憑證分頁：新增上傳區塊 */}
      {bookingSubTab === 'voucher' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-[2.5rem] p-10 text-center shadow-sm">
            <div className="bg-[#F0F4EF] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ExternalLink size={32} className="text-[#4E9A8E]" />
            </div>
            <h4 className="font-black text-xl text-[#2A3B49] mb-2 italic">上傳憑證/票據</h4>
            <p className="text-[11px] font-bold text-gray-400 mb-6 leading-relaxed">支援 PDF 或圖片，上傳後自動備份</p>
            <input type="file" id="voucher-upload" className="hidden" accept=".pdf,image/*" />
            <label htmlFor="voucher-upload" className="inline-block bg-[#2A3B49] text-white px-10 py-4 rounded-2xl text-xs font-black cursor-pointer shadow-lg active:scale-95 uppercase tracking-widest">
              選擇檔案
            </label>
          </div>
        </div>
      )}
    </main>
  )
}

{
  tab === 'journal' && (
    <JournalPage
      posts={posts}           // 雲端抓取到的日誌列表
      onAddPost={handleAddPost} // 剛才寫好的寫入函數
      members={members}       // 成員資料（用來抓取發文者頭像）
    />)
}
{
  tab === 'planning' && (
    <PlanningPage
      members={members}
      todos={todos}
      shoppingList={shoppingList}
      onAddTodo={handleAddTodo}
      onToggleTodo={handleToggleTodo}
      onUpdateTodo={handleUpdateTodo}    // 🟢 確認這行已加上
      onDeleteTodo={handleDeleteTodo}
      onAddShopping={handleAddShopping}
      onToggleShopping={handleToggleShopping}
      onDeleteShopping={handleDeleteShopping} // 🟢 補上這一行
    />
  )
}
{
  tab === 'members' && (
    <MembersPage
      members={members}
      onAdd={handleAddMember}
      onDelete={handleDeleteMember} // 👈 補上這一行傳遞刪除功能
    />
  )
}

<nav className="fixed bottom-6 left-6 right-6 h-20 bg-[#2A3B49] rounded-[3rem] shadow-2xl flex justify-around items-center px-4 z-50 border border-white/5">
  <button onClick={() => setTab('schedule')} className={`flex flex-col items-center gap-1 w-12 transition-all ${tab === 'schedule' ? 'text-[#76B352] scale-110' : 'text-white/20'}`}><Calendar size={18} /><span className="text-[8px] font-bold">行程</span></button>
  <button onClick={() => setTab('booking')} className={`flex flex-col items-center gap-1 w-12 transition-all ${tab === 'booking' ? 'text-[#76B352] scale-110' : 'text-white/20'}`}><Ticket size={18} /><span className="text-[8px] font-bold">預定</span></button>
  <button onClick={() => setTab('journal')} className={`flex flex-col items-center gap-1 w-12 transition-all ${tab === 'journal' ? 'text-[#76B352] scale-110' : 'text-white/20'}`}><PenTool size={18} /><span className="text-[8px] font-bold">日誌</span></button>
  <button onClick={() => setTab('planning')} className={`flex flex-col items-center gap-1 w-12 transition-all ${tab === 'planning' ? 'text-[#76B352] scale-110' : 'text-white/20'}`}><Luggage size={18} /><span className="text-[8px] font-bold">準備</span></button>
  <button onClick={() => setTab('members')} className={`flex flex-col items-center gap-1 w-12 transition-all ${tab === 'members' ? 'text-[#76B352] scale-110' : 'text-white/20'}`}><Users size={18} /><span className="text-[8px] font-bold">成員</span></button>
</nav>

{/* 詳情彈窗 */ }
{
  selectedSki && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className={`card w-full max-w-sm overflow-hidden ${selectedSki.type === 'ski' ? 'ski-resort-card' : ''}`}>
        <div className="bg-[#2A3B49] p-6 text-white relative">
          <button onClick={() => setSelectedSki(null)} className="absolute top-6 right-6 opacity-50"><X size={20} /></button>
          <h4 className="location-header text-white text-xl">{selectedSki.title}</h4>
        </div>
        <div className="p-6 space-y-4">
          {/* 彈窗內部的 Stats/Difficulty Bar 內容保持原樣... */}
          {selectedSki.type === 'ski' && (
            <div className="resort-stats">
              <div className="stat-item"><span className="stat-label">標高</span><span className="stat-value">{selectedSki.details.elevation}</span></div>
              <div className="stat-item"><span className="stat-label">雪道數</span><span className="stat-value">{selectedSki.details.courses}</span></div>
            </div>
          )}
          {/* 按鈕結尾修正 */}
          {selectedSki.details.web && (
            <a href={selectedSki.details.web} target="_blank" rel="noreferrer" className="block w-full bg-[#4E9A8E] text-white text-center py-4 rounded-2xl text-xs font-black">
              查看更多介紹
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
    </div> 
  );   
}      