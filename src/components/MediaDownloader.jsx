import { useState, useEffect } from 'react';
import { 
  Download, Search, Clipboard, User, 
  Music, Film, LoaderCircle as Loader2, CircleAlert as AlertCircle, CircleCheck as CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MediaDownloader({ onDownloadComplete }) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const cleanup = window.electronAPI.onDownloadProgress((val) => {
      setDownloadProgress(val);
    });
    return cleanup;
  }, []);

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
      setError(err.message || 'Lỗi không xác định.');
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
    if (downloading) return;
    setDownloading(true);
    setDownloadProgress(0);
    try {
      const extension = type === 'audio' ? 'mp3' : 'mp4';
      const defaultName = `${videoData.author}_${videoData.id}_${videoData.platform}.${extension}`;
      
      const result = await window.electronAPI.downloadMedia(mediaUrl, defaultName, {});
      
      if (result.success) {
        // Update History
        if (onDownloadComplete) {
          onDownloadComplete({
            ...videoData,
            filePath: result.path,
            downloadId: Date.now(),
            type: type
          });
        }
      } else if (result.error) {
        setError('Tải về thất bại: ' + result.error);
      }
    } catch (err) {
      setError('Lỗi: ' + err.message);
    } finally {
      setDownloading(false);
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
          {videoData && videoData.platform === 'tiktok' ? 'TikTok' : 'Douyin'} Downloader
        </motion.h1>
        <motion.p 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="hero-subtitle"
        >
          Tải video không logo chất lượng cao từ TikTok & Douyin
        </motion.p>

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="input-group"
        >
          <input 
            type="text" 
            className="url-input" 
            placeholder="Dán link TikTok hoặc Douyin vào đây..." 
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
            <span>{status === 'loading' ? 'Đang xử lý...' : 'Phân tích'}</span>
          </button>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ marginTop: '20px', color: '#ff4d4d', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 77, 77, 0.1)', padding: '10px 20px', borderRadius: '10px' }}
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
            className="video-card"
          >
            <div className="video-cover">
              <img src={videoData.cover} alt="Cover" />
              {videoData.platform === 'tiktok' && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#fe2c55', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}>TIKTOK</div>
              )}
            </div>
            <div className="video-info">
              <h2 className="video-title">{videoData.title || 'Video Media'}</h2>
              <div className="author-info">
                <img src={videoData.avatar} alt="Avatar" className="author-avatar" />
                <span className="author-name">@{videoData.author}</span>
              </div>

              
              <div className="download-options">
                <button 
                  className="btn-dl btn-dl-video" 
                  onClick={() => handleDownload(videoData.videoUrl, 'video')}
                  disabled={downloading}
                >
                  {downloading ? <Loader2 className="animate-spin" size={20} /> : <Film size={20} />}
                  <span>{downloading ? 'Đang xử lý...' : 'Download MP4 (HD)'}</span>
                </button>
                <button 
                  className="btn-dl btn-dl-audio" 
                  onClick={() => handleDownload(videoData.musicUrl, 'audio')}
                  disabled={downloading}
                >
                  <span>Download MP3</span>
                </button>
              </div>

              {downloading && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: '20px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                        <span style={{ opacity: 0.6, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Loader2 size={14} className="animate-spin" /> Đang tải dữ liệu...
                        </span>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{downloadProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${downloadProgress}%` }}
                            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                            style={{ 
                                height: '100%', 
                                background: 'linear-gradient(90deg, var(--primary), #8a91ff)', 
                                boxShadow: '0 0 10px rgba(100, 108, 255, 0.5)' 
                            }}
                        />
                    </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
