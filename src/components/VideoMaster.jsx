import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileVideo, Wand2, Music, 
  Download, RefreshCcw, Layout, 
  Trash2, Layers, AlertCircle, CheckCircle2,
  Upload, ExternalLink, ShieldCheck
} from 'lucide-react';

export default function VideoMaster() {
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, processing, done, error
  const [progress, setProgress] = useState(0);
  const [activeMode, setActiveMode] = useState('blur-bg'); // 'blur-bg', 'merge-audio', 'bypass'
  const [message, setMessage] = useState('');
  
  const [bypassOptions, setBypassOptions] = useState({
    hflip: true,
    color: true,
    zoom: true,
    speed: true,
    noise: false
  });
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    const cleanup = window.electronAPI.onProcessProgress((val) => {
      setProgress(Math.round(val));
    });
    return cleanup;
  }, []);

  const handleFileSelect = async (type) => {
    if (type === 'logo') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const path = window.electronAPI.getFilePath(file);
                setLogoFile({ name: file.name, path });
            }
        };
        input.click();
        return;
    }
    // We use a trick: hidden file input
    document.getElementById(type === 'video' ? 'video-input' : 'audio-input').click();
  };

  const onFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Get absolute path using electron utility
    const path = window.electronAPI.getFilePath(file);
    if (type === 'video') setVideoFile({ name: file.name, path });
    else setAudioFile({ name: file.name, path });
  };

  const handleProcess = async () => {
    if (!videoFile) return;

    setStatus('processing');
    setMessage('Đang xử lý video, vui lòng không tắt ứng dụng...');
    setProgress(0);

    try {
      const defaultOut = videoFile.name.replace(/\.[^/.]+$/, "") + `_${activeMode}.mp4`;
      const outputPath = await window.electronAPI.saveFileDialog(defaultOut, [{ name: 'MP4 Video', extensions: ['mp4'] }]);
      
      if (!outputPath) {
        setStatus('idle');
        return;
      }

      const result = await window.electronAPI.processVideo({
        inputPath: videoFile.path,
        outputPath,
        type: activeMode,
        audioPath: audioFile?.path,
        bypassOptions: bypassOptions,
        logoPath: logoFile?.path
      });

      if (result.success) {
        setStatus('done');
        setMessage('Xử lý thành công! File đã được lưu.');
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setStatus('error');
      setMessage('Lỗi: ' + err.message);
    }
  };

  const handleCapCutExport = async () => {
    if (!videoFile) return;
    setStatus('processing');
    setMessage('Đang tạo dự án CapCut...');
    
    try {
      const result = await window.electronAPI.exportToCapcut({
        name: videoFile.name.replace(/\.[^/.]+$/, ""),
        videoPath: videoFile.path,
        audioPath: audioFile?.path
      });

      if (result.success) {
        setStatus('done');
        setMessage('Đã tạo dự án CapCut! Hãy mở CapCut Desktop để thấy dự án mới.');
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setStatus('error');
      setMessage('Lỗi CapCut: ' + err.message);
    }
  };

  return (
    <div className="studio-main" style={{ overflowY: 'auto' }}>
      <header className="control-bar" style={{ marginBottom: '30px' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wand2 size={24} color="#646cff" /> Video Master (Xử lý Video)
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5 }}>Tự động hóa các tác vụ hậu kỳ Video cho YouTube.</p>
        </div>
        {status === 'processing' && (
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginRight: '20px' }}>
                <div style={{ width: '150px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        style={{ height: '100%', background: 'var(--primary)' }}
                    />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>{progress}%</span>
             </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
            <button 
                className="btn btn-secondary" 
                onClick={handleCapCutExport} 
                disabled={status === 'processing' || !videoFile}
                style={{ background: 'rgba(100, 108, 255, 0.1)', color: 'var(--primary)' }}
            >
                <ExternalLink size={16} /> Xuất sang CapCut Pro
            </button>
            <button 
                className="btn btn-primary" 
                onClick={handleProcess} 
                disabled={status === 'processing' || !videoFile}
            >
                {status === 'processing' ? <RefreshCcw className="spin" size={16} /> : <Download size={16} />}
                {status === 'processing' ? 'Đang xử lý...' : 'Bắt đầu xử lý'}
            </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px', height: 'calc(100% - 130px)' }}>
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Mode Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div 
                    className={`nav-item ${activeMode === 'blur-bg' ? 'active' : ''}`} 
                    onClick={() => setActiveMode('blur-bg')}
                    style={{ justifyContent: 'center', padding: '15px', flexDirection: 'column', gap: '10px', height: 'auto' }}
                >
                    <Layout size={24} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Blur Background</div>
                        <div style={{ fontSize: '10px', opacity: 0.5 }}>Chuyển 9:16 sang 16:9</div>
                    </div>
                </div>
                <div 
                    className={`nav-item ${activeMode === 'merge-audio' ? 'active' : ''}`} 
                    onClick={() => setActiveMode('merge-audio')}
                    style={{ justifyContent: 'center', padding: '15px', flexDirection: 'column', gap: '10px', height: 'auto' }}
                >
                    <Layers size={24} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Ghép Thuyết Minh</div>
                        <div style={{ fontSize: '10px', opacity: 0.5 }}>Thay âm thanh gốc</div>
                    </div>
                </div>
                <div 
                    className={`nav-item ${activeMode === 'bypass' ? 'active' : ''}`} 
                    onClick={() => setActiveMode('bypass')}
                    style={{ justifyContent: 'center', padding: '15px', flexDirection: 'column', gap: '10px', height: 'auto' }}
                >
                    <ShieldCheck size={24} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Lách Bản Quyền</div>
                        <div style={{ fontSize: '10px', opacity: 0.5 }}>Biến đổi né quét content</div>
                    </div>
                </div>
            </div>

            {/* Sub-settings */}
            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>Tùy chọn bổ sung</h3>
                    <button className="btn btn-secondary" onClick={() => handleFileSelect('logo')} style={{ fontSize: '11px', padding: '5px 12px' }}>
                        {logoFile ? 'Thay Logo' : 'Chèn Logo'}
                    </button>
                </div>
                
                {logoFile && (
                    <div style={{ marginBottom: '15px', fontSize: '11px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle2 size={12} /> Đã chọn Logo: {logoFile.name}
                    </div>
                )}

                {activeMode === 'bypass' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                        {Object.entries({
                            hflip: 'Lật ngang',
                            color: 'Chỉnh màu',
                            zoom: 'Phóng to 5%',
                            speed: 'Tốc độ +3%',
                            noise: 'Nhiễu hạt'
                        }).map(([key, label]) => (
                            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                                <input 
                                    type="checkbox" 
                                    checked={bypassOptions[key]} 
                                    onChange={(e) => setBypassOptions({ ...bypassOptions, [key]: e.target.checked })}
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                )}
                {activeMode !== 'bypass' && (
                    <p style={{ margin: 0, fontSize: '12px', opacity: 0.5 }}>Chế độ này sẽ áp dụng các bộ lọc mặc định.</p>
                )}
            </div>

            {/* File Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '20px', borderStyle: 'dashed', borderColor: videoFile ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <FileVideo size={30} color={videoFile ? 'var(--primary)' : '#444'} />
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{videoFile ? videoFile.name : 'Chọn Video gốc (MP4)'}</div>
                                <div style={{ fontSize: '11px', opacity: 0.5 }}>Kéo thả hoặc nhấn để chọn file</div>
                            </div>
                        </div>
                        <button className="btn btn-secondary" onClick={() => handleFileSelect('video')}>
                            {videoFile ? 'Thay đổi' : 'Chọn file'}
                        </button>
                    </div>
                    <input type="file" id="video-input" accept="video/mp4" style={{ display: 'none' }} onChange={(e) => onFileChange(e, 'video')} />
                </div>

                {activeMode === 'merge-audio' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel" 
                        style={{ padding: '20px', borderStyle: 'dashed', borderColor: audioFile ? 'var(--secondary)' : 'rgba(255,255,255,0.1)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <Music size={30} color={audioFile ? 'var(--secondary)' : '#444'} />
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{audioFile ? audioFile.name : 'Chọn file Thuyết minh (MP3/AAC)'}</div>
                                    <div style={{ fontSize: '11px', opacity: 0.5 }}>File vừa tạo từ tab Lồng Tiếng</div>
                                </div>
                            </div>
                            <button className="btn btn-secondary" onClick={() => handleFileSelect('audio')}>
                                {audioFile ? 'Thay đổi' : 'Chọn file'}
                            </button>
                        </div>
                        <input type="file" id="audio-input" accept="audio/*" style={{ display: 'none' }} onChange={(e) => onFileChange(e, 'audio')} />
                    </motion.div>
                )}
            </div>
            
            <AnimatePresence>
                {message && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="alert"
                        style={{ 
                            padding: '15px', 
                            borderRadius: '12px', 
                            background: status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: status === 'error' ? '#ef4444' : '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px'
                        }}
                    >
                        {status === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                        {message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '11px', opacity: 0.6, textTransform: 'uppercase' }}>Thông tin xử lý</h3>
            <div style={{ fontSize: '13px', lineHeight: '1.6', opacity: 0.8 }}>
                <div style={{ marginBottom: '10px' }}>
                    <strong>Đầu vào:</strong> {videoFile ? 'Hợp lệ' : 'Chưa chọn'}
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <strong>Độ phân giải:</strong> 1920x1080 (HD)
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <strong>Bitrate:</strong> High Quality (CRF 18)
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <strong>Codec:</strong> H.264 / AAC
                </div>
                <hr style={{ opacity: 0.1, margin: '15px 0' }} />
                <p style={{ fontSize: '11px', opacity: 0.5 }}>
                    * Quá trình xử lý video tiêu tốn CPU/GPU, máy có thể sẽ chạy quạt mạnh hơn bình thường.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
