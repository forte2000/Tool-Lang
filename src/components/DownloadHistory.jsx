import { 
  Folder, Trash2, ExternalLink, 
  Film, Music, Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DownloadHistory({ history, onClear }) {
  const handleOpenFolder = async (filePath) => {
    if (!filePath) return;
    await window.electronAPI.openFolder(filePath);
  };

  return (
    <div className="downloader-container" style={{ padding: '0 40px 40px' }}>
      <header style={{ padding: '60px 0 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="hero-title" style={{ fontSize: '2.5rem', marginBottom: '5px' }}>Lịch sử Tải về</h1>
          <p className="hero-subtitle" style={{ fontSize: '0.9rem', marginBottom: 0 }}>Quản lý và xem lại các video đã tải xuống</p>
        </div>
        {history.length > 0 && (
          <button className="btn btn-secondary" style={{ height: 'fit-content' }} onClick={onClear}>
            <Trash2 size={16} /> <span>Xóa tất cả</span>
          </button>
        )}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        <AnimatePresence>
          {history.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel" 
              style={{ gridColumn: '1 / -1', padding: '100px', textAlign: 'center', opacity: 0.5 }}
            >
              <Clock size={48} style={{ marginBottom: '20px', opacity: 0.3 }} />
              <p>Chưa có dữ liệu nào được tải xuống.</p>
            </motion.div>
          ) : (
            history.map((item, index) => (
              <motion.div 
                key={item.downloadId || index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-panel" 
                style={{ display: 'flex', gap: '15px', padding: '15px', cursor: 'default' }}
              >
                <div style={{ width: '80px', height: '110px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={item.cover} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    {item.type === 'audio' ? <Music size={14} color="#a855f7" /> : <Film size={14} color="#646cff" />}
                    <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#666' }}>
                      {item.platform} • {item.type}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '0.9rem', margin: '0 0 5px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title || 'Video media'}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#888', margin: '0 0 15px 0' }}>@{item.author}</p>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
                      onClick={() => handleOpenFolder(item.filePath)}
                    >
                      <Folder size={14} /> <span>Xem thư mục</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
