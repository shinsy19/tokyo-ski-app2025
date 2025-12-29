import React, { useState } from 'react';
// 🟢 修正：確保 import 語句與 export 之間有正確換行，避免 Loader2 報錯
import { Camera, Heart, MessageCircle, Send, Plus, X, Loader2 } from 'lucide-react';

export default function JournalPage({ posts, onAddPost, members }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentAuthor, setCurrentAuthor] = useState(members[0] || null);

  // 1. 處理圖片選取與預覽
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    
    // 產生暫時的本地預覽網址
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  // 2. Cloudinary 上傳函數
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ski_app_preset'); 

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/dqr4ofzd0/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('上傳失敗:', error);
      return null;
    }
  };

  // 3. 提交日誌
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newContent.trim() || loading) return;

    setLoading(true);
    try {
      // 多圖同時上傳
      const uploadedUrls = await Promise.all(
        selectedFiles.map(file => uploadToCloudinary(file))
      );
      
      const cleanUrls = uploadedUrls.filter(url => url !== null);

      // 呼叫 App.jsx 傳進來的雲端寫入函數
      await onAddPost({
        author: currentAuthor?.name || "未知成員",
        avatar: currentAuthor?.avatar || "",
        content: newContent,
        images: cleanUrls,
        likes: 0
      });

      // 成功後重設狀態
      setNewContent('');
      setSelectedFiles([]);
      setPreviews([]);
      setIsAdding(false);
    } catch (err) {
      alert("發布失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-6 pb-24 animate-in fade-in">
      {/* 標題欄 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black italic text-[#4E9A8E]">JOURNAL</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#4E9A8E] text-white p-2 rounded-full shadow-lg"
          disabled={loading}
        >
          {isAdding ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {/* 新增表單 */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-[2rem] shadow-xl border border-gray-100 mb-8 space-y-4">
          <div className="space-y-2 mb-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">發言身分 (點擊切換)</p>
            <div className="flex gap-3 overflow-x-auto py-2 no-scrollbar">
              {members.map(m => (
                <button
                  key={m.firestoreId || m.id}
                  type="button"
                  onClick={() => setCurrentAuthor(m)}
                  className={`flex-none w-12 h-12 rounded-full border-2 transition-all overflow-hidden ${
                    currentAuthor?.name === m.name ? 'border-[#4E9A8E] scale-110 shadow-md' : 'border-transparent opacity-40'
                  }`}
                >
                  <img src={m.avatar} className="w-full h-full object-cover" alt={m.name} />
                </button>
              ))}
            </div>
          </div>
          <textarea 
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="分享今天的滑雪心情..."
            className="w-full h-24 p-4 bg-gray-50 rounded-2xl text-sm focus:outline-none"
            disabled={loading}
          />
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            <label className="flex-none w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-300">
              <Camera className="text-gray-400" />
              <input type="file" multiple className="hidden" onChange={handleImageChange} accept="image/*" disabled={loading} />
            </label>
            {previews.map((img, i) => (
              <img key={i} src={img} className="w-16 h-16 rounded-xl object-cover" alt="preview" />
            ))}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg transition-all ${loading ? 'bg-gray-400' : 'bg-[#4E9A8E] text-white'}`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
            {loading ? '上傳中...' : '發布日誌'}
          </button>
        </form>
      )}

      {/* 列表渲染 */}
      <div className="space-y-8">
        {posts.map(entry => {
          const latestMember = members.find(m => m.name === entry.author);
          const displayAvatar = latestMember?.avatar || entry.avatar;
          // 🟢 修正：處理 Firebase Timestamp
          const displayDate = entry.createdAt?.seconds 
            ? new Date(entry.createdAt.seconds * 1000).toLocaleDateString() 
            : entry.date || "剛剛";

          return (
            <div key={entry.id} className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <img src={displayAvatar} className="w-10 h-10 rounded-full border-2 border-[#4E9A8E]/20" alt="" />
                <div>
                  <p className="text-sm font-black text-[#2A3B49]">{entry.author}</p>
                  <p className="text-[10px] font-bold opacity-30 uppercase">{displayDate}</p>
                </div>
              </div>

              {entry.images && entry.images.length > 0 && (
                <div className="flex overflow-x-auto snap-x no-scrollbar bg-gray-50">
                  {entry.images.map((img, i) => (
                    <img key={i} src={img} className="w-full h-80 object-cover snap-center flex-none" alt="" />
                  ))}
                </div>
              )}

              <div className="p-5 space-y-3">
                <div className="flex gap-4">
                  <Heart size={22} className="text-gray-400" />
                  <MessageCircle size={22} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium leading-relaxed">{entry.content}</p>
                <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">{entry.likes || 0} LIKES</p>
              </div>
            </div>
          ); // 🟢 修正：圓括號正確閉合
        })}
      </div>
    </main>
  );
}