import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Mic2, Play, Download, Trash2, 
  Settings, Volume2, Save, FileAudio,
  Sparkles, CheckCircle2
} from 'lucide-react';

export default function VoiceoverStudio() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle, playing, downloading
  const [lang, setLang] = useState('vi');
  const [message, setMessage] = useState('');
  const audioRef = useRef(null);

  const handlePreview = () => {
    if (!text.trim()) return;
    
    // Stop previous audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setStatus('playing');
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.slice(0, 200))}&tl=${lang}&client=tw-ob`;
    
    audioRef.current = new Audio(ttsUrl);
    audioRef.current.onended = () => setStatus('idle');
    audioRef.current.onerror = () => {
      setStatus('idle');
      alert('Không thể phát âm thanh. Vui lòng thử lại.');
    };
    audioRef.current.play();
  };

  const handleDownload = async () => {
    if (!text.trim()) return;
    
    setStatus('downloading');
    setMessage('Đang xử lý âm thanh...');
    
    try {
      // Google TTS has a limit per request, for long text we might need to batch (future improvement)
      const result = await window.electronAPI.downloadTtsAudio(text, lang);
      if (result.success) {
        setMessage('Đã lưu file thành công!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="studio-main" style={{ overflowY: 'auto' }}>
      <header className="control-bar" style={{ marginBottom: '30px' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mic2 size={24} color="#10b981" /> Lồng tiếng AI (Text-to-Speech)
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5 }}>Tạo giọng đọc tiếng Việt tự nhiên cho video của bạn.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
            <button 
                className="btn btn-secondary" 
                onClick={handlePreview} 
                disabled={status !== 'idle' || !text.trim()}
            >
                {status === 'playing' ? <Volume2 className="pulse" size={16} /> : <Play size={16} />}
                {status === 'playing' ? 'Đang đọc...' : 'Nghe thử'}
            </button>
            <button 
                className="btn btn-primary" 
                onClick={handleDownload} 
                disabled={status !== 'idle' || !text.trim()}
            >
                <Download size={16} /> {status === 'downloading' ? 'Đang tạo...' : 'Tải file .mp3'}
            </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', height: 'calc(100% - 100px)' }}>
        <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981' }}>
              <FileAudio size={18} />
              <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Nội dung cần đọc</h3>
            </div>
            <div style={{ fontSize: '12px', opacity: 0.4 }}>{text.length} ký tự</div>
          </div>
          
          <textarea 
            className="textbox" 
            placeholder="Dán nội dung tiếng Việt đã dịch vào đây để tạo giọng đọc..." 
            style={{ flex: 1, minHeight: '300px', fontSize: '16px', lineHeight: '1.6' }}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {message && (
             <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                    marginTop: '20px', 
                    padding: '10px 15px', 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    borderRadius: '10px', 
                    color: '#10b981',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}
            >
                <CheckCircle2 size={16} /> {message}
            </motion.div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Cài đặt giọng đọc</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Ngôn ngữ</label>
                        <select 
                            className="select-mini" 
                            style={{ width: '100%', fontSize: '13px', padding: '10px' }}
                            value={lang}
                            onChange={(e) => setLang(e.target.value)}
                        >
                            <option value="vi">Tiếng Việt (Mặc định)</option>
                            <option value="zh-CN">Tiếng Trung (Phổ thông)</option>
                            <option value="en">Tiếng Anh (US)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(100, 108, 255, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#646cff', marginBottom: '10px' }}>
                    <Sparkles size={16} />
                    <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Mẹo nhỏ</h3>
                </div>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.7, lineHeight: '1.5' }}>
                    Sử dụng dấu phẩy (,) hoặc dấu chấm (.) để AI ngắt nghỉ tự nhiên hơn. Hiện tại bản miễn phí hỗ trợ tối đa 200 ký tự mỗi lần nghe thử, nhưng khi tải về có thể tạo file dài hơn.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
