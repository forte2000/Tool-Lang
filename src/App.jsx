import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Languages, Download, Settings, 
  Globe, Clock, ShieldCheck, HelpCircle,
  Mic2, Fingerprint
} from 'lucide-react';
import SrtTranslator from './components/SrtTranslator';
import MediaDownloader from './components/MediaDownloader';
import DownloadHistory from './components/DownloadHistory';
import ActivationGuard from './components/ActivationGuard';
import VoiceoverStudio from './components/VoiceoverStudio';
import LicenseManager from './components/LicenseManager';
import UpdateNotifier from './components/UpdateNotifier';


export default function App() {
  const [activeTab, setActiveTab] = useState('media'); // 'media', 'srt', 'voice', 'history', 'privacy', 'guide'
  const [history, setHistory] = useState([]);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('download_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Lỗi tải lịch sử:', e);
      }
    }
  }, []);

  // Save history to localStorage
  const updateHistory = (newItem) => {
    const newHistory = [newItem, ...history].slice(0, 50); // Keep last 50
    setHistory(newHistory);
    localStorage.setItem('download_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('download_history');
  };

  return (
    <ActivationGuard>
      <UpdateNotifier />
      <div className="app-container">
        <div className="bg-blob" style={{ top: '-100px', left: '-100px', background: 'var(--primary)' }}></div>
        <div className="bg-blob" style={{ bottom: '-100px', right: '-100px', background: 'var(--accent)' }}></div>
        
        <div className="title-bar" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          TOOLLANG • MEDIA STUDIO
        </div>

        <aside className="sidebar">
          <div style={{ padding: '0 15px', marginBottom: '30px' }}>
             <h2 style={{ fontSize: '10px', fontWeight: '800', color: '#444', letterSpacing: '2px', textTransform: 'uppercase' }}>Công cụ chính</h2>
          </div>

          <div 
            className={`nav-item ${activeTab === 'media' ? 'active' : ''}`} 
            onClick={() => setActiveTab('media')}
          >
            <div className="nav-icon"><Download size={20} /></div>
            <div className="nav-text">
              <span className="nav-label">Tải Media</span>
              <span className="nav-sub">Douyin & TikTok</span>
            </div>
          </div>
          <div 
            className={`nav-item ${activeTab === 'srt' ? 'active' : ''}`} 
            onClick={() => setActiveTab('srt')}
          >
            <div className="nav-icon"><Languages size={20} /></div>
            <div className="nav-text">
              <span className="nav-label">Dịch Phụ đề</span>
              <span className="nav-sub">Dịch SRT tự động</span>
            </div>
          </div>
          <div 
            className={`nav-item ${activeTab === 'voice' ? 'active' : ''}`} 
            onClick={() => setActiveTab('voice')}
          >
            <div className="nav-icon"><Mic2 size={20} /></div>
            <div className="nav-text">
              <span className="nav-label">Lồng tiếng AI</span>
              <span className="nav-sub">Chuyển văn bản sang giọng nói</span>
            </div>
          </div>
          
          <div style={{ margin: '20px 0', padding: '0 15px' }}>
              <h2 style={{ fontSize: '10px', fontWeight: '800', color: '#444', letterSpacing: '2px', textTransform: 'uppercase' }}>Hoạt động</h2>
          </div>

          <div 
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} 
            onClick={() => setActiveTab('history')}
          >
            <div className="nav-icon"><Clock size={20} /></div>
            <div className="nav-text">
              <span className="nav-label">Lịch sử tải</span>
              <span className="nav-sub">Quản lý file đã tải</span>
            </div>
          </div>
          
          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
            <div 
              className={`nav-item ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <ShieldCheck size={20} />
              <span>Quyền riêng tư</span>
            </div>
            <div 
              className={`nav-item ${activeTab === 'guide' ? 'active' : ''}`}
              onClick={() => setActiveTab('guide')}
            >
              <HelpCircle size={20} />
              <span>Hướng dẫn</span>
            </div>
            <div 
              className={`nav-item ${activeTab === 'license' ? 'active' : ''}`}
              onClick={() => setActiveTab('license')}
            >
              <Fingerprint size={20} />
              <span>Bản quyền</span>
            </div>
            <div className="nav-item" onClick={() => window.open('https://github.com/yuu-developer/ToolLang', '_blank')}>
              <Globe size={20} />
              <span>Mã nguồn</span>
            </div>
          </div>
        </aside>

        <main className="main-stage">
          <AnimatePresence mode="wait">
            {activeTab === 'media' && (
              <motion.div
                key="media"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%', overflow: 'hidden' }}
              >
                <MediaDownloader onDownloadComplete={updateHistory} />
              </motion.div>
            )}
            {activeTab === 'srt' && (
              <motion.div
                key="srt"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%', overflow: 'hidden' }}
              >
                <SrtTranslator />
              </motion.div>
            )}
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%', overflow: 'hidden' }}
              >
                <DownloadHistory history={history} onClear={clearHistory} />
              </motion.div>
            )}
            {activeTab === 'voice' && (
              <motion.div
                key="voice"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%', overflow: 'hidden' }}
              >
                <VoiceoverStudio />
              </motion.div>
            )}
            {activeTab === 'privacy' && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}
              >
                <h1 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', marginBottom: '20px' }}>Quyền riêng tư</h1>
                <div className="glass-panel" style={{ padding: '30px', fontSize: '1.1rem', lineHeight: '1.8', opacity: 0.9 }}>
                  <p><strong>ToolLang</strong> tôn trọng và cam kết bảo vệ sự riêng tư của người dùng.</p>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    <li>🔒 <strong>Dữ liệu cục bộ:</strong> Tất cả quá trình xử lý video, âm thanh và phụ đề đều diễn ra trực tiếp trên máy tính của bạn. Chúng tôi không tải tệp của bạn lên bất kỳ máy chủ nào.</li>
                    <li>🌐 <strong>API Công khai:</strong> Ứng dụng sử dụng các dịch vụ công khai như Google Translate (cho dịch thuật/TTS) và API Douyin (cho tải video). Các dữ liệu gửi đi chỉ là URL hoặc văn bản cần xử lý.</li>
                    <li>🛡️ <strong>Bảo mật:</strong> Chúng tôi không thu thập thông tin cá nhân, cookie trình duyệt hay lịch sử hoạt động của bạn.</li>
                    <li>❌ <strong>Không quảng cáo:</strong> Bộ công cụ này hoàn toàn sạch, không chứa mã độc hay phần mềm theo dõi.</li>
                  </ul>
                  <p style={{ marginTop: '30px', fontSize: '0.9rem', opacity: 0.6 }}>Cập nhật lần cuối: Tháng 4, 2026</p>
                </div>
              </motion.div>
            )}
            {activeTab === 'guide' && (
              <motion.div
                key="guide"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{ padding: '40px', overflowY: 'auto', height: '100%' }}
              >
                <h1 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', marginBottom: '30px', textAlign: 'center' }}>Hướng dẫn sử dụng</h1>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  <div className="glass-panel" style={{ padding: '25px' }}>
                    <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>1. Tải Media không logo</h3>
                    <p style={{ fontSize: '14px', opacity: 0.8 }}>Sao chép liên kết từ Douyin hoặc TikTok, dán vào ô nhập liệu và nhấn "Tải video". Hệ thống sẽ tự động tách ID và tải về bản cao nhất không có hình mờ.</p>
                  </div>
                  <div className="glass-panel" style={{ padding: '25px' }}>
                    <h3 style={{ color: '#10b981', marginBottom: '15px' }}>2. Dịch Phụ đề (SRT)</h3>
                    <p style={{ fontSize: '14px', opacity: 0.8 }}>Kéo thả file .srt vào vùng chỉ định. Chọn ngôn ngữ nguồn (thường là Trung Quốc) và ngôn ngữ đích (Tiếng Việt). Nhấn "Dịch tất cả" để bắt đầu xử lý tự động.</p>
                  </div>
                  <div className="glass-panel" style={{ padding: '25px' }}>
                    <h3 style={{ color: '#a855f7', marginBottom: '15px' }}>3. Lồng tiếng AI</h3>
                    <p style={{ fontSize: '14px', opacity: 0.8 }}>Dán văn bản đã dịch vào ô soạn thảo. Bạn có thể nghe thử từng đoạn (giới hạn 200 ký tự) và tải về file .mp3 chất lượng cao để ghép vào video.</p>
                  </div>
                  <div className="glass-panel" style={{ padding: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.05)' }}>
                    <p style={{ textAlign: 'center', fontWeight: 'bold' }}>Mẹo: Sử dụng phím tắt và chuột phải để thao tác nhanh hơn trong trình quản lý lịch sử!</p>
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === 'license' && (
              <motion.div
                key="license"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%', overflow: 'hidden' }}
              >
                <LicenseManager />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </ActivationGuard>
  );
}
