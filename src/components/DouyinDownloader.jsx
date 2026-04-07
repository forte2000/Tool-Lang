import { useState } from 'react';
import { 
  Download, Search, Clipboard, User, 
  Music, Film, LoaderCircle as Loader2, CircleAlert as AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DouyinDownloader() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState(null);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setStatus('loading');
    setError(null);
    try {
      const result = await window.electronAPI.fetchMediaMetadata(url);
      if (result.success) {
        setVideoData(result.data);
        setStatus('success');
      } else {
        setError(result.error);
        setStatus('error');
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch (err) {
      console.error('Không thể đọc clipboard:', err);
    }
  };

  const handleDownload = async (mediaUrl, type) => {
    try {
      const defaultName = `${videoData.author}_${videoData.id}.${type === 'audio' ? 'mp3' : 'mp4'}`;
      const result = await window.electronAPI.downloadMedia(mediaUrl, defaultName);
      if (result.success) {
        // Có thể thêm thông báo thành công ở đây
      } else if (result.error) {
        alert('Lỗi tải về: ' + result.error);
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  return (
    <div className="downloader-container">
      <section className="downloader-hero">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="hero-title"
        >
          Douyin Downloader
        </motion.h1>
        <motion.p 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="hero-subtitle"
        >
          Tải video Douyin không logo, chất lượng cao
        </motion.p>

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="input-group"
        >
          <input 
            type="text" 
            className="url-input" 
            placeholder="Dán link Douyin vào đây..." 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          />
          <button className="btn-paste" onClick={handlePaste}>
            <Clipboard size={18} /> <span>Dán</span>
          </button>
          <button 
            className="btn-download-start" 
            disabled={status === 'loading'} 
            onClick={handleFetch}
          >
            {status === 'loading' ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
            <span>{status === 'loading' ? 'Đang lấy tin...' : 'Phân tích'}</span>
          </button>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ marginTop: '20px', color: '#ff4d4d', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {videoData && status === 'success' && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="video-card"
          >
            <div className="video-cover">
              <img src={videoData.cover} alt="Video Cover" />
            </div>
            <div className="video-info">
              <h2 className="video-title">{videoData.title || 'Video Douyin'}</h2>
              <div className="author-info">
                <img src={videoData.avatar} alt="Avatar" className="author-avatar" />
                <span className="author-name">{videoData.author}</span>
              </div>
              
              <div className="download-options">
                <button className="btn-dl btn-dl-video" onClick={() => handleDownload(videoData.videoUrl, 'video')}>
                  <Film size={20} />
                  <span>Download MP4 (No Logo)</span>
                </button>
                <button className="btn-dl btn-dl-audio" onClick={() => handleDownload(videoData.musicUrl, 'audio')}>
                  <Music size={20} />
                  <span>Download MP3</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div style={{ height: '40px' }}></div>
    </div>
  );
}
