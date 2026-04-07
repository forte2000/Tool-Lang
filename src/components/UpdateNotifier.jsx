import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, XCircle, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { listenToSystemConfig } from '../firebase';
import packageJson from '../../package.json';

const LOCAL_VERSION = packageJson.version;

export default function UpdateNotifier() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [message, setMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    // Listen to updater messages
    const removeMsg = window.electronAPI.onUpdateMessage((msg) => {
        setMessage(msg);
        console.log('Updater:', msg);
    });

    const removeAvailable = window.electronAPI.onUpdateAvailable((info) => {
        setUpdateInfo(info);
        setShowNotification(true);
    });

    const removeProgress = window.electronAPI.onUpdateDownloadProgress((percent) => {
        setDownloadProgress(percent);
    });

    const removeDownloaded = (info) => {
        setIsReady(true);
        setMessage('Bản cập nhật đã sẵn sàng cài đặt!');
    };
    window.electronAPI.onUpdateDownloaded(removeDownloaded);

    const removeError = window.electronAPI.onUpdateError((err) => {
        console.error('Update Error:', err);
    });

    return () => {
        removeMsg();
        removeAvailable();
        removeProgress();
        // removeDownloaded is handled slightly differently in preload, but let's assume cleanup works or refactor
        removeError();
    };
  }, []);

  const handleRestart = () => {
    window.electronAPI.quitAndInstall();
  };

  if (!showNotification) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 9999,
          width: '380px'
        }}
      >
        <div className="glass-panel" style={{ 
          padding: '24px', 
          background: 'rgba(20, 20, 25, 0.95)', 
          border: '1px solid rgba(139, 92, 246, 0.5)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(139, 92, 246, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '14px', 
              background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
            }}>
              {isReady ? <Sparkles size={24} color="#fff" /> : <Download size={24} color="#fff" />}
            </div>
            
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#8b5cf6', fontWeight: '800', letterSpacing: '1px' }}>
                {isReady ? 'CẬP NHẬT SẴN SÀNG' : 'ĐANG TẢI CẬP NHẬT'}
              </h4>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                Phiên bản {updateInfo?.version || 'mới'}
              </h3>
              
              {!isReady ? (
                <div style={{ marginBottom: '15px' }}>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                        <motion.div 
                            style={{ height: '100%', background: 'var(--primary)', width: `${downloadProgress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                    <span style={{ fontSize: '11px', color: '#666' }}>Đang tải: {Math.round(downloadProgress)}%</span>
                </div>
              ) : (
                <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#aaa', lineHeight: '1.5' }}>
                   Bản cập nhật đã được tải về. Nhấn tải lại ứng dụng để áp dụng ngay.
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                {isReady ? (
                  <button 
                    onClick={handleRestart}
                    className="btn-activate-premium"
                    style={{ flex: 1, height: '40px', fontSize: '13px' }}
                  >
                    🚀 Tải lại & Cập nhật
                  </button>
                ) : (
                  <button 
                    disabled
                    style={{ flex: 1, height: '40px', fontSize: '13px', opacity: 0.5, cursor: 'not-allowed', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Vui lòng chờ...
                  </button>
                )}
                
                <button 
                  onClick={() => setShowNotification(false)}
                  style={{ 
                      padding: '0 15px', 
                      borderRadius: '10px', 
                      color: '#666',
                      fontSize: '12px',
                      background: 'transparent',
                      border: 'none'
                  }}
                >
                  Để sau
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
