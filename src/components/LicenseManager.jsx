import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fingerprint, Key, Copy, ExternalLink, 
  ShieldCheck, LogOut, RefreshCw, 
  HelpCircle, MessageSquare
} from 'lucide-react';

export default function LicenseManager() {
  const [hwid, setHwid] = useState('Đang tải...');
  const [licenseKey, setLicenseKey] = useState(localStorage.getItem('license_key') || 'N/A');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const fetchHwid = async () => {
      try {
        const id = await window.electronAPI.getHwid();
        setHwid(id);
      } catch (e) {
        setHwid('Lỗi lấy HWID');
      }
    };
    fetchHwid();
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleUnregister = () => {
    if (window.confirm('Bạn có chắc chắn muốn gỡ bỏ License Key khỏi thiết bị này?')) {
      localStorage.removeItem('license_key');
      window.location.reload();
    }
  };

  return (
    <div className="studio-main" style={{ overflowY: 'auto', padding: '40px' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Fingerprint size={40} color="var(--primary)" /> Quản Lý Bản Quyền
        </h1>
        <p style={{ opacity: 0.5, marginTop: '10px' }}>Thông tin định danh và trạng thái kích hoạt của ứng dụng.</p>
      </header>

      <div className="license-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px' }}>
        <div className="main-license-info">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel"
            style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}
          >
            <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={20} color="#10b981" />
                <span style={{ fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>TRẠNG THÁI: ĐÃ KÍCH HOẠT</span>
              </div>
              <span style={{ fontSize: '11px', color: '#666' }}>VĨNH VIỄN</span>
            </div>

            <div className="info-field">
              <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '8px', fontWeight: 'bold' }}>MÃ THIẾT BỊ (HWID)</label>
              <div className="hwid-display-modern" style={{ 
                background: 'rgba(0,0,0,0.2)', 
                padding: '15px 20px', 
                borderRadius: '12px', 
                border: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                <code style={{ color: 'var(--primary)', fontSize: '14px' }}>{hwid}</code>
                <button 
                  onClick={() => handleCopy(hwid)}
                  style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <div className="info-field">
              <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '8px', fontWeight: 'bold' }}>LICENSE KEY ĐANG DÙNG</label>
              <div className="key-display-modern" style={{ 
                background: 'rgba(0,0,0,0.2)', 
                padding: '15px 20px', 
                borderRadius: '12px', 
                border: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                <code style={{ color: '#fff', fontSize: '14px' }}>{licenseKey.slice(0, 8)} •••• •••• {licenseKey.slice(-8)}</code>
                <button 
                  onClick={() => handleCopy(licenseKey)}
                  style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <div style={{ marginTop: '10px', display: 'flex', gap: '15px' }}>
              <button className="btn btn-secondary" onClick={() => window.location.reload()} style={{ flex: 1, justifyContent: 'center' }}>
                <RefreshCw size={16} /> Làm mới trạng thái
              </button>
              <button className="btn btn-secondary" onClick={handleUnregister} style={{ flex: 1, justifyContent: 'center', color: '#fe2c55', borderColor: 'rgba(254, 44, 85, 0.2)' }}>
                <LogOut size={16} /> Gỡ bỏ bản quyền
              </button>
            </div>
          </motion.div>
        </div>

        <div className="support-info">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel"
            style={{ padding: '30px', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={18} /> TRUNG TÂM HỖ TRỢ
            </h3>
            
            <div className="contact-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a href="https://t.me/yuu_dev" target="_blank" rel="noreferrer" className="contact-item">
                <div className="contact-icon tel" style={{ background: '#0088cc', padding: '8px', borderRadius: '8px', color: '#fff' }}><ExternalLink size={14} /></div>
                <div className="contact-info">
                  <span style={{ fontSize: '10px', color: '#555', display: 'block' }}>TELEGRAM</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold' }}>@yuu_dev</span>
                </div>
              </a>
              <a href="https://fb.com/yuu.developer" target="_blank" rel="noreferrer" className="contact-item">
                <div className="contact-icon fb" style={{ background: '#1877f2', padding: '8px', borderRadius: '8px', color: '#fff' }}><ExternalLink size={14} /></div>
                <div className="contact-info">
                  <span style={{ fontSize: '10px', color: '#555', display: 'block' }}>FACEBOOK</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Yuu Developer</span>
                </div>
              </a>
            </div>

            <div style={{ marginTop: 'auto', background: 'rgba(99, 102, 241, 0.05)', padding: '20px', borderRadius: '15px', border: '1px dashed var(--primary)' }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--primary)', lineHeight: '1.5' }}>
                <HelpCircle size={14} style={{ marginBottom: '-3px', marginRight: '5px' }} />
                Bạn đang sử dụng phiên bản <strong>PREMIUM</strong>. Mọi thắc mắc về cài đặt hoặc lỗi HWID, vui lòng liên hệ admin để được xử lý trong 24h.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {copySuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#fff', padding: '10px 20px', borderRadius: '100px', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)', zIndex: 9999 }}
          >
            Đã sao chép vào bộ nhớ tạm!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
