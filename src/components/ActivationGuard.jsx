import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, Key, Copy, AlertCircle, 
  CheckCircle2, Loader2, ShieldCheck, ExternalLink, XCircle
} from 'lucide-react';
import { listenToKeyStatus } from '../firebase';

export default function ActivationGuard({ children }) {
  const [hwid, setHwid] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [isActivated, setIsActivated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRevoked, setIsRevoked] = useState(false);

  // 1. Initial Local Check
  useEffect(() => {
    const checkActivation = async () => {
      try {
        const id = await window.electronAPI.getHwid();
        setHwid(id);

        const savedKey = localStorage.getItem('license_key');
        if (savedKey) {
          setLicenseKey(savedKey);
          const result = await window.electronAPI.verifyLicense(savedKey, id);
          if (result.success) {
            setIsActivated(true);
          } else {
            setError(result.error);
          }
        }
      } catch (e) {
        console.error('Lỗi khi kiểm tra bản quyền:', e);
      } finally {
        setIsChecking(false);
      }
    };

    checkActivation();
  }, []);

  // 2. Real-time Cloud Revocation Listener (Kick-out)
  useEffect(() => {
    if (!hwid || !isActivated) return;

    // Lắng nghe trạng thái từ Firebase
    const unsubscribe = listenToKeyStatus(hwid, (cloudData) => {
      const savedKey = localStorage.getItem('license_key');
      
      // Nếu dữ liệu trên Cloud bị xóa (Admin nhấn Delete)
      // Hoặc Key trên Cloud khác với Key hiện tại
      if (!cloudData || cloudData.key !== savedKey) {
        console.warn("CLOUD: BẢN QUYỀN ĐÃ BỊ THU HỒI HOẶC KHÔNG TÌM THẤY.");
        setIsRevoked(true);
        setIsActivated(false);
        setError("Bản quyền của bạn đã bị Quản trị viên thu hồi (KICK-OUT).");
      }
    });

    return () => unsubscribe();
  }, [hwid, isActivated]);

  const handleActivate = async () => {
    if (!licenseKey.trim()) return;
    setIsLoading(true);
    setError(null);
    setIsRevoked(false);

    try {
      const id = await window.electronAPI.getHwid();
      const result = await window.electronAPI.verifyLicense(licenseKey.trim(), id);
      if (result.success) {
        setIsActivated(true);
        localStorage.setItem('license_key', licenseKey.trim());
      } else {
        setError(result.error || 'Khoá kích hoạt không hợp lệ cho thiết bị này.');
      }
    } catch (e) {
      setError('Lỗi kết nối hệ thống xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="activation-overlay">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="loading-state">
           <Loader2 className="spin" size={40} color="var(--primary)" />
           <p style={{ marginTop: '20px', color: '#666', fontSize: '14px', fontWeight: 'bold' }}>ĐANG XÁC THỰC BẢN QUYỀN...</p>
        </motion.div>
      </div>
    );
  }

  // Màn hình Kick-out
  if (isRevoked) {
      return (
        <div className="activation-overlay" style={{ background: '#000' }}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-panel"
                style={{ padding: '60px', textAlign: 'center', maxWidth: '500px', border: '1px solid #fe2c55' }}
            >
                <XCircle size={80} color="#fe2c55" style={{ marginBottom: '30px' }} />
                <h1 style={{ color: '#fff', fontSize: '24px', marginBottom: '20px' }}>TRUY THU BẢN QUYỀN</h1>
                <p style={{ color: '#aaa', lineHeight: '1.6', marginBottom: '30px' }}>
                    Tài khoản của bạn đã bị từ chối truy cập bởi máy chủ quản trị. 
                    Vui lòng liên hệ Admin để giải quyết khiếu nại hoặc nhận Key mới.
                </p>
                <button 
                   className="btn-activate-premium" 
                   style={{ background: '#333' }}
                   onClick={() => { setIsRevoked(false); setIsActivated(false); }}
                >
                    QUAY LẠI TRANG KÍCH HOẠT
                </button>
            </motion.div>
        </div>
      );
  }

  if (isActivated) {
    return children;
  }

  return (
    <div className="activation-overlay">
      <div className="bg-blob" style={{ top: '-15%', left: '-15%', background: 'rgba(254, 44, 85, 0.1)', filter: 'blur(100px)' }}></div>
      <div className="bg-blob" style={{ bottom: '-15%', right: '-15%', background: 'rgba(99, 102, 241, 0.1)', filter: 'blur(100px)' }}></div>

      <div className="activation-container">
        <header className="activation-header">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="icon-badge-outer"
          >
            <div className="icon-badge-inner">
               <ShieldAlert size={32} color="#fff" />
            </div>
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="activation-title"
          >
            Yêu cầu kích hoạt
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="activation-desc"
          >
            Hệ thống nhận diện ứng dụng chưa được cấp bản quyền trên thiết bị này. 
            Vui lòng liên hệ quản trị viên để nhận License Key.
          </motion.p>
        </header>

        <div className="activation-panel-grid">
          <motion.div 
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-panel activation-main-panel"
          >
            <div className="panel-header">
               <Key size={16} /> QUẢN LÝ BẢN QUYỀN
            </div>

            <div className="hwid-field">
              <label>Mã thiết bị (HWID)</label>
              <div className="hwid-box">
                <code>{hwid}</code>
                <button className="btn-icon-styled" title="Copy HWID" onClick={() => {
                  navigator.clipboard.writeText(hwid);
                }}>
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="key-field">
              <label>Mã kích hoạt (License Key)</label>
              <div className="key-input-wrapper">
                <input 
                  type="text" 
                  placeholder="Dán License Key của bạn..."
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="activation-error-msg"
              >
                <AlertCircle size={14} /> {error}
              </motion.div>
            )}

            <button 
              className="btn-activate-premium"
              onClick={handleActivate}
              disabled={isLoading || !licenseKey.trim()}
            >
              {isLoading ? (
                <Loader2 className="spin" size={18} />
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>{error?.includes('hết hạn') ? 'GIA HẠN NGAY' : 'KÍCH HOẠT NGAY'}</span>
                </>
              )}
            </button>
          </motion.div>

          <motion.div 
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-panel activation-side-panel"
          >
            <div className="panel-header">
               <ShieldCheck size={16} /> HỖ TRỢ KỸ THUẬT
            </div>

            <div className="contact-list">
              <a href="https://t.me/yuu_dev" target="_blank" rel="noreferrer" className="contact-item">
                <div className="contact-icon tel"><ExternalLink size={18} /></div>
                <div className="contact-info">
                  <span className="label">Telegram</span>
                  <span className="value">@yuu_dev</span>
                </div>
              </a>
              <a href="https://fb.com/yuu.developer" target="_blank" rel="noreferrer" className="contact-item">
                <div className="contact-icon fb"><ExternalLink size={18} /></div>
                <div className="contact-info">
                  <span className="label">Facebook</span>
                  <span className="value">Yuu Developer</span>
                </div>
              </a>
              <a href="https://toollang.pro" target="_blank" rel="noreferrer" className="contact-item">
                <div className="contact-icon web"><ExternalLink size={18} /></div>
                <div className="contact-info">
                  <span className="label">Website</span>
                  <span className="value">toollang.pro</span>
                </div>
              </a>
            </div>

            <div className="security-badges">
              <div className="badge"><ShieldCheck size={12} color="#10b981" /> Norton Secured</div>
              <div className="badge"><ShieldCheck size={12} color="#10b981" /> AES Encryption</div>
            </div>
          </motion.div>
        </div>

        <footer className="activation-legal">
           <p>© 2026 ToolLang Studio • All Rights Reserved</p>
           <p style={{ opacity: 0.3 }}>Version 2.4.0 (Latest)</p>
        </footer>
      </div>
    </div>
  );
}
