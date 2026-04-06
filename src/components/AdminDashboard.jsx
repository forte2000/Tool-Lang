import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Key, Copy, CheckCircle2, 
  Trash2, UserPlus, Users, Terminal,
  Cpu, History, Save, Calendar, Clock, User, CloudUpload
} from 'lucide-react';
import { syncKeyToCloud, revokeKeyFromCloud, syncSystemConfig, listenToSystemConfig } from '../firebase';
import logoAdmin from '../assets/logo_admin.png';

export default function AdminDashboard() {
  const [hwid, setHwid] = useState('');
  const [userName, setUserName] = useState('');
  const [days, setDays] = useState(30);
  const [generatedKey, setGeneratedKey] = useState('');
  const [keyHistory, setKeyHistory] = useState([]);
  const [copySuccess, setCopySuccess] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load local key history
  const [latestVersion, setLatestVersion] = useState('1.0.0');
  const [updateUrl, setUpdateUrl] = useState('');
  const [showUpdateConfig, setShowUpdateConfig] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_key_history');
    if (saved) setKeyHistory(JSON.parse(saved));

    // Listen to current system config
    const unsubscribe = listenToSystemConfig((data) => {
      if (data) {
        setLatestVersion(data.latest_version || '1.0.0');
        setUpdateUrl(data.download_url || '');
      }
    });

    return () => unsubscribe();
  }, []);

  const saveHistory = (newHistory) => {
    setKeyHistory(newHistory);
    localStorage.setItem('admin_key_history', JSON.stringify(newHistory));
  };

  const handleGenerate = async () => {
    if (!hwid.trim()) return;
    setIsSyncing(true);
    
    const key = await window.electronAPI.generateSecretKey(hwid.trim(), parseInt(days));
    setGeneratedKey(key);
    
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + parseInt(days));

    const entry = {
      id: Date.now(),
      userName: userName.trim() || 'Khách ẩn danh',
      hwid: hwid.trim(),
      key,
      days: parseInt(days),
      expireDate: expireDate.toLocaleDateString('vi-VN'),
      expireTimestamp: expireDate.getTime(),
      date: new Date().toLocaleString('vi-VN'),
      status: 'active'
    };

    // 1. Sync to Cloud (Firebase)
    await syncKeyToCloud(entry.hwid, {
      key: entry.key,
      expireTimestamp: entry.expireTimestamp,
      userName: entry.userName,
      status: 'active'
    });

    // 2. Save locally
    const newHistory = [entry, ...keyHistory].slice(0, 100);
    saveHistory(newHistory);
    
    setIsSyncing(false);
    setHwid('');
    setUserName('');
  };

  const deleteEntry = async (id, targetHwid) => {
    if (window.confirm('XÁC NHẬN THU HỒI (KICK-OUT)?\nNgười dùng này sẽ bị khóa Tool ngay lập tức.')) {
      setIsSyncing(true);
      // 1. Remove from Cloud
      await revokeKeyFromCloud(targetHwid);
      
      // 2. Update local list
      const newHistory = keyHistory.filter(item => item.id !== id);
      saveHistory(newHistory);
      setIsSyncing(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(type);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handlePushUpdate = async () => {
    if (!latestVersion.trim() || !updateUrl.trim()) {
      alert('Vui lòng nhập đầy đủ Version và Link tải.');
      return;
    }
    
    setIsSyncing(true);
    await syncSystemConfig({
      latest_version: latestVersion.trim(),
      download_url: updateUrl.trim()
    });
    setIsSyncing(false);
    alert('ĐÃ ĐẨY CẬP NHẬT THÀNH CÔNG!\nTất cả người dùng sẽ nhận được thông báo ngay lập tức.');
  };

  const isExpired = (timestamp) => {
    return Date.now() > timestamp;
  };

  return (
    <div className="studio-main" style={{ overflowY: 'auto', padding: '40px' }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '20px' }}>
            <img src={logoAdmin} alt="Admin Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', filter: 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.4))' }} />
            Master Control
          </h1>
          <p style={{ opacity: 0.5, marginTop: '10px' }}>Quản lý người dùng và cấu hình hệ thống chuyên sâu.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px 20px', borderRadius: '100px', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '11px', fontWeight: '800', letterSpacing: '1px' }}>
              CLOUD SYNC ACTIVE
            </div>
            {isSyncing && <div style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
               <CloudUpload size={12} className="spin" /> ĐANG ĐỒNG BỘ...
            </div>}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
        {/* Left: Input & Generator */}
        <section>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel"
            style={{ padding: '30px', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}>
              <Cpu size={120} />
            </div>

            <h3 style={{ margin: '0 0 25px 0', fontSize: '14px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserPlus size={18} /> CẤP BẢN QUYỀN MỚI
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '8px', fontWeight: 'bold' }}>TÊN NGƯỜI SỬ DỤNG</label>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 15px', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
                  <User size={18} color="#666" />
                  <input 
                    type="text" 
                    placeholder="VD: Nguyễn Văn A..."
                    style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none' }}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '8px', fontWeight: 'bold' }}>MÃ HWID THIẾT BỊ</label>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 15px', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
                  <Terminal size={18} color="#666" />
                  <input 
                    type="text" 
                    placeholder="Dán HWID tại đây..."
                    style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'JetBrains Mono, monospace' }}
                    value={hwid}
                    onChange={(e) => setHwid(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '8px', fontWeight: 'bold' }}>HẠN DÙNG (NGÀY)</label>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 15px', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <Calendar size={16} color="#666" />
                      <input 
                        type="number" 
                        style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none' }}
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                     <button 
                        className="btn-activate-premium" 
                        style={{ background: '#f59e0b', boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)', width: '100%', height: '45px', fontSize: '12px' }}
                        onClick={handleGenerate}
                        disabled={!hwid.trim() || isSyncing}
                      >
                        {isSyncing ? <CloudUpload className="spin" size={16} /> : <Key size={16} />}
                        <span>{isSyncing ? 'ĐANG ĐỒNG BỘ...' : 'TẠO & SYNC KEY'}</span>
                      </button>
                  </div>
              </div>

              <AnimatePresence>
                {generatedKey && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ marginTop: '10px', background: 'rgba(16, 185, 129, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}
                  >
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#10b981', display: 'block', marginBottom: '10px' }}>KEY ({days} NGÀY) CHO {userName || 'KHÁCH'}:</span>
                    <code style={{ fontSize: '18px', letterSpacing: '1px', fontWeight: 'bold', color: '#fff' }}>{generatedKey}</code>
                    <button 
                      onClick={() => copyToClipboard(generatedKey, 'current')}
                      className="btn btn-secondary" 
                      style={{ marginTop: '15px', width: '100%', justifyContent: 'center' }}
                    >
                      {copySuccess === 'current' ? <CheckCircle2 size={16} color="#10b981" /> : <Copy size={16} />}
                      {copySuccess === 'current' ? 'ĐÃ SAO CHÉP' : 'SAO CHÉP GỬI KHÁCH'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Update Management Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel"
            style={{ padding: '30px', marginTop: '30px', border: '1px solid rgba(139, 92, 246, 0.2)' }}
          >
            <h3 style={{ margin: '0 0 25px 0', fontSize: '14px', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Download size={18} /> ĐẨY PHIÊN BẢN MỚI (SYNC UPDATE)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '8px', fontWeight: 'bold' }}>VERSION MỚI (V2, V3...)</label>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 15px', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
                  <span style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}>v</span>
                  <input 
                    type="text" 
                    placeholder="VD: 1.1.0"
                    style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none' }}
                    value={latestVersion}
                    onChange={(e) => setLatestVersion(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '8px', fontWeight: 'bold' }}>LINK TẢI XUỐNG (DOWNLOAD URL)</label>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 15px', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
                  <CloudUpload size={18} color="#666" />
                  <input 
                    type="text" 
                    placeholder="Dán link drive, telegram hoặc web tải tại đây..."
                    style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none' }}
                    value={updateUrl}
                    onChange={(e) => setUpdateUrl(e.target.value)}
                  />
                </div>
              </div>

              <button 
                className="btn-activate-premium" 
                style={{ background: 'linear-gradient(to right, #8b5cf6, #d946ef)', boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)', width: '100%', height: '45px', fontSize: '12px' }}
                onClick={handlePushUpdate}
                disabled={isSyncing}
              >
                {isSyncing ? <CloudUpload className="spin" size={16} /> : <Sparkles size={16} />}
                <span>{isSyncing ? 'ĐANG ĐỒNG BỘ...' : 'ĐẨY CẬP NHẬT ĐẾN TẤT CẢ NGƯỜI DÙNG'}</span>
              </button>
            </div>
          </motion.div>
        </section>

        {/* Right: History & Customer Management */}
        <section>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel"
            style={{ padding: '30px', height: '100%', minHeight: '600px', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: '#646cff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={18} /> QUẢN LÝ TỪ XA ({keyHistory.length})
              </h3>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {keyHistory.length === 0 ? (
                <div style={{ textAlign: 'center', opacity: 0.2, padding: '100px 0' }}>
                  <Users size={64} style={{ marginBottom: '20px' }} />
                  <p>Chưa có người dùng nào.</p>
                </div>
              ) : (
                keyHistory.map(item => (
                  <div key={item.id} className="history-entry" style={{ 
                    background: 'rgba(255,255,255,0.02)', 
                    padding: '20px', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    opacity: isExpired(item.expireTimestamp) ? 0.6 : 1
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'rgba(100, 108, 255, 0.1)', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(100, 108, 255, 0.2)' }}>
                            <span style={{ fontSize: '12px', color: '#646cff', fontWeight: 'bold' }}>{item.userName}</span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#555', fontFamily: 'JetBrains Mono' }}>HWID: {item.hwid.slice(0, 12)}...</span>
                        {isExpired(item.expireTimestamp) ? (
                            <span style={{ fontSize: '9px', background: 'rgba(254, 44, 85, 0.1)', color: '#fe2c55', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>ĐÃ HẾT HẠN</span>
                        ) : (
                            <span style={{ fontSize: '9px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>ĐANG HOẠT ĐỘNG</span>
                        )}
                      </div>
                      <span style={{ fontSize: '10px', color: '#333' }}>{item.date}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <code style={{ fontSize: '13px', color: '#fff', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>{item.key}</code>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '11px', color: '#555' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {item.days} ngày</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> Hết hạn: {item.expireDate}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => copyToClipboard(item.key, item.id)} 
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#666', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                          title="Copy Key"
                        >
                          {copySuccess === item.id ? <CheckCircle2 size={16} color="#10b981" /> : <Copy size={16} />}
                        </button>
                        <button 
                          onClick={() => deleteEntry(item.id, item.hwid)}
                          style={{ background: 'rgba(254, 44, 85, 0.05)', border: '1px solid rgba(254, 44, 85, 0.2)', color: '#fe2c55', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                          title="THU HỒI BẢN QUYỀN (KICK)"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255, 107, 107, 0.05)', borderRadius: '16px', fontSize: '11px', color: '#ff6b6b', border: '1px dashed rgba(255, 107, 107, 0.2)' }}>
              <Save size={14} style={{ marginBottom: '-2px', marginRight: '8px' }} />
              <strong>Cơ chế Kick-out thời gian thực:</strong> Khi nhấn nút Thùng rác, HWID này sẽ bị xóa khỏi Firebase. Tool trên máy khách sẽ tự động nhận diện và khóa App ngay lập tức (không cần khởi động lại).
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
