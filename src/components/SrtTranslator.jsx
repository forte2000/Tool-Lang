import { useState, useEffect } from 'react';
import SrtParser from 'srt-parser-2';
import {
  Upload, Sparkles, Save, Trash2,
  Pencil as Edit3, Download, Languages, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';

const parser = new SrtParser();

// Utility: Convert SRT time to seconds
const timeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.replace(',', '.').split(':');
  if (parts.length < 3) return 0;
  const h = parseFloat(parts[0]) || 0;
  const m = parseFloat(parts[1]) || 0;
  const s = parseFloat(parts[2]) || 0;
  return h * 3600 + m * 60 + s;
};

// Utility: Wrap text to max chars per line
const wrapText = (text, maxChars = 45) => {
  if (!text || text.length <= maxChars) return text;
  const words = text.split(' ');
  let currentLine = '';
  const lines = [];

  words.forEach(word => {
    if ((currentLine + word).length <= maxChars) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
};

const translateBatch = async (items, apiKey = null, style = 'normal', from = 'auto', to = 'vi', retries = 3) => {
  if (!items || items.length === 0) return [];
  const wait = (ms) => new Promise(res => setTimeout(res, ms));

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      
      let systemPrompt = '';
      if (style === 'tûtien') {
        systemPrompt = `Bạn là một đại sư ngôn ngữ cấp độ "Đỉnh Phong", chuyên về "Hoạt hình 3D Trung Quốc" (Đông Hoa) thể loại Tiên Hiệp, Tu Chân, Huyền Huyễn.
Nhiệm vụ: Dịch phụ đề từ tiếng Trung sang tiếng Việt với phong cách CỔ KÍNH, TRANG TRỌNG, ĐẬM CHẤT TU TIÊN THƯỢNG THỪA.

【QUY TẮC PERSONA - TUYỆT ĐỐI】
• Không dùng ngôn ngữ hiện đại. Tuyệt đối không xưng hô "anh, em, bạn, tôi, cậu, mình...".
• Phải dùng từ Hán Việt cổ: "Ta, Ngươi, Hắn, Tại hạ, Các hạ, Đạo hữu, Tiền bối, Vãn bối, Sư tôn, Đồ nhi, Bản tôn, Lão phu, Tiểu tử, Súc sinh, Nghiệt súc, Kẻ hèn này".
• Biến đổi linh hoạt: 
  - "Xin lỗi" -> "Thỉnh tội", "Mong tiền bối lượng thứ", "Lão phu biết sai".
  - "Cảm ơn" -> "Đa tạ", "Đại ân đại đức", "Ghi lòng tạc dạ".
  - "Chào" -> "Bái kiến", "Cáo từ", "Gặp lại".
  - "Chết" -> "Vẫn lạc", "Mất mạng", "Chôn thây", "Hồn phi phách tán".

【GHI CHÚ VỀ NHỊP ĐIỆU】
• Dịch CỰC NGẮN (dưới 1s = 3-4 từ). Ưu tiên cô đọng như thơ văn cổ.
• Ví dụ: "Tìm chết!", "Phá cho ta!", "Kiếm tới!", "To gan!", "Cút!".

【ĐỊNH DẠNG TRẢ VỀ】
Trả về đúng: [số thứ tự]|Nội dung đã dịch. 
KHÔNG giải thích, KHÔNG thêm bớt bất kỳ ký tự nào khác ngoài định dạng này.`;
      } else {
        systemPrompt = `Dịch phụ đề phim từ tiếng Trung sang tiếng Việt tự nhiên, hiện đại. Phân tích ngữ cảnh để xưng hô đúng vai vế. Dịch cực kỳ NGẮN GỌN để kịp lồng tiếng.
        Trả về định dạng: [số thứ tự]|Nội dung đã dịch`;
      }

      const batchLines = items.map((item, idx) => {
        const duration = timeToSeconds(item.endTime) - timeToSeconds(item.startTime);
        return `${item.id}|[${duration.toFixed(1)}s]|${item.text}`;
      }).join('\n');

      const prompt = `${systemPrompt}\n\nNội dung cần dịch:\n${batchLines}`;
      
      let response;
      let lastError = null;
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          const result = await model.generateContent(prompt);
          response = await result.response;
          break; // Success!
        } catch (err) {
          lastError = err;
          // Retry on 503 (High demand) or 429 (Rate limit)
          if (err.message?.includes('503') || err.message?.includes('429')) {
             const delay = (attempt < 3) ? 2000 * (attempt + 1) : 15000; 
             console.warn(`Gemini attempt ${attempt + 1} failed (429/Busy), retrying in ${delay/1000}s...`);
             if (attempt >= 2) {
               // Notify user it's waiting for Google quota reset
               console.log("Waiting for Google Cloud quota reset...");
             }
             await wait(delay);
             continue;
          }
          throw err;
        }
      }

      if (!response) throw lastError;

      const resultText = response.text().trim();
      
      // Parse the batch response
      const lines = resultText.split('\n');
      const resultMap = {};
      lines.forEach(line => {
        const parts = line.split('|');
        if (parts.length >= 2) {
          const id = parts[0].trim().replace('[', '').replace(']', '');
          const content = parts.slice(1).join('|').trim();
          resultMap[id] = content;
        }
      });
      return { success: true, data: resultMap };
    } catch (e) {
      console.error('Gemini batch error:', e);
      return { success: false, error: e.message };
    }
  }

  // Fallback ONLY if no API Key or Gemini fails
  const results = {};
  for (const item of items) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(item.text)}`;
      const response = await fetch(url);
      const data = await response.json();
      results[item.id] = data[0].map(i => i[0]).join('');
    } catch (err) {
      console.error('Google fallback error:', err);
    }
  }
  return { success: true, isFallback: true, data: results };
};


export default function SrtTranslator() {
  const [subtitles, setSubtitles] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading, editing, translating, done
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [translationStyle, setTranslationStyle] = useState('tûtien'); // 'normal', 'tûtien'

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
    // Optional: Log available models for debugging (Check F12/Console)
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      // Not always working in older SDKs but helps
      console.log("Checking for Gemini 3 Compatibility...");
    }
  }, [apiKey]);


  const processFile = async (file) => {
    try {
      setStatus('loading');
      setMessage('Đang nạp file...');
      setFileName(file.name);
      const content = await file.text();
      const parsed = parser.fromSrt(content);
      const initialSubtitles = parsed.map(item => ({
        ...item,
        translatedText: item.translatedText || ''
      }));
      setSubtitles(initialSubtitles);
      setStatus('editing');
      setMessage(`Đã nạp ${initialSubtitles.length} câu phụ đề.`);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Lỗi: ' + err.message);
    }
  };

  const translateAll = async () => {
    if (status === 'translating') return;
    setStatus('translating');
    setMessage('Đang dịch theo ngữ cảnh, vui lòng đợi...');
    const total = subtitles.length;
    const batchSize = 15; // Restoration: Original smooth batch size
    const updatedSubtitles = [...subtitles];
    const wait = (ms) => new Promise(res => setTimeout(res, ms));

    for (let i = 0; i < total; i += batchSize) {
      const currentBatchCount = Math.min(i + batchSize, total);
      setMessage(`Đang dịch dòng ${i + 1} - ${currentBatchCount} của ${total}...`);
      const batchItems = updatedSubtitles.slice(i, i + batchSize);
      let response = await translateBatch(batchItems, apiKey, translationStyle);
      
      // AUTO-FALLBACK: Only for NORMAL style. For TC/TuTien, stay on AI to maintain quality.
      if (!response || !response.success) {
        if (translationStyle === 'normal') {
          console.warn('Gemini Failed. Triggering Safe Fallback (Google Translate)...');
          setMessage(`Lỗi AI. Đang tự động chuyển sang chế độ dự phòng (Dòng ${i + 1})...`);
          response = await translateBatch(batchItems, null, translationStyle);
        } else {
          // For Tu Tiên, don't fallback to standard Google (lose flavor). Pause and show error.
          setMessage(`Lỗi AI Tu Tiên: ${response?.error || 'Quá tải (429)'}. Vui lòng chờ 1 phút thử lại.`);
          setStatus('editing');
          return;
        }
      }
      
      setProgress(Math.round((currentBatchCount / total) * 100));
      
      if (response && response.success) {
        if (response.isFallback) {
          setMessage('Lưu ý: Đang dùng chế độ dự phòng (Google Translate) do AI quá tải.');
        }

        const results = response.data;
        batchItems.forEach((item, index) => {
          const trans = results[item.id];
          if (trans) {
            updatedSubtitles[i + index].translatedText = wrapText(trans);
          }
        });
        setSubtitles([...updatedSubtitles]);
      } else {
        setMessage(`Lỗi: ${response?.error || 'Không thể dịch'}`);
        setStatus('editing');
        return;
      }
      
      await wait(1000); // Restoration: Original 1s delay
    }
    setStatus('editing');
    setMessage(`Hoàn tất dịch thuật!`);
  };

  const handleSave = async () => {
    if (subtitles.length === 0) return;
    try {
      const defaultName = fileName ? fileName.replace('.srt', '_vi.srt') : 'translated_vi.srt';
      const filePath = await window.electronAPI.saveFileDialog(defaultName);
      if (!filePath) return;
      let finalSrt = '';
      subtitles.forEach((s, index) => {
        const content = ((s.translatedText && s.translatedText.trim()) ? s.translatedText : s.text).trim();
        // CapCut prefers direct blocks without weird spacing
        finalSrt += `${index + 1}\n${s.startTime} --> ${s.endTime}\n${content}\n\n`;
      });
      // Use standard CRLF and remove any triple newlines
      const result = await window.electronAPI.writeFile(filePath, finalSrt.trim().replace(/\n/g, '\r\n') + '\r\n\r\n');
      if (result.success) {
        setStatus('done');
        setMessage(`Đã lưu thành công!`);
      }
    } catch (err) {
      alert('Lỗi khi lưu file: ' + err.message);
    }
  };


  return (
    <div 
      className="studio-main" 
      onDragOver={(e) => { e.preventDefault(); setIsHovered(true); }} 
      onDragLeave={() => setIsHovered(false)} 
      onDrop={async (e) => {
        e.preventDefault();
        setIsHovered(false);
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.srt')) await processFile(file);
      }}
    >
      <AnimatePresence>
        {isHovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="drop-overlay">
            <Upload size={60} color="#fff" />
            <h2 style={{ color: '#fff' }}>Thả file .srt vào đây</h2>
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'idle' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel glass-panel-interactive" 
            style={{ cursor: 'pointer', textAlign: 'center', padding: '60px', maxWidth: '500px' }} 
            onClick={() => document.getElementById('file-btn').click()}
          >
            <Languages size={64} color="#646cff" style={{ marginBottom: '20px' }} />
            <h2 style={{ margin: '0 0 10px 0' }}>Dịch Phụ Đề (.srt)</h2>
            <p style={{ opacity: 0.5, margin: 0 }}>Kéo thả file vào đây hoặc click để chọn file.</p>
          </motion.div>
          <input type="file" id="file-btn" accept=".srt" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && processFile(e.target.files[0])} />
        </div>
      ) : (
        <>
          <header className="control-bar" style={{ marginBottom: '20px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Edit3 size={18} color="#646cff" /> {fileName}
              </h1>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5 }}>{message} {status === 'translating' && `(${progress}%)`}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="password" 
                placeholder="Gemini API Key..." 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(100,108,255,0.2)', 
                  color: '#fff', 
                  fontSize: '11px', 
                  padding: '6px 10px', 
                  borderRadius: '8px',
                  width: '160px'
                }}
              />
              <select 
                className="btn btn-secondary" 
                value={translationStyle}
                onChange={(e) => setTranslationStyle(e.target.value)}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(100,108,255,0.2)', 
                  color: '#fff', 
                  fontSize: '11px', 
                  padding: '6px 10px', 
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <option value="normal" style={{ background: '#1a1a1a' }}>Phong cách: Bình thường</option>
                <option value="tûtien" style={{ background: '#1a1a1a' }}>Phong cách: Tu Tiên</option>
              </select>
              <button className="btn btn-secondary" onClick={() => setStatus('idle')}><Trash2 size={16} /></button>
              <button className="btn btn-primary" onClick={translateAll} disabled={status === 'translating'}>
                <Download size={16} /> {status === 'translating' ? 'Đang dịch...' : 'Dịch Tất Cả'}
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={!subtitles.length}>
                  <Download size={16} /> Lưu file .SRT
                </button>
              </div>
            </div>
          </header>

          <div className="editor-container">
            <div className="subtitle-header">
              <div className="index">#</div>
              <div className="time">Thời gian</div>
              <div style={{ color: '#646cff' }}>NGUYÊN BẢN</div>
              <div style={{ color: '#10b981' }}>DỊCH (TIẾNG VIỆT)</div>
            </div>
            <div className="subtitle-list">
              {subtitles.map((sub, idx) => (
                <div key={idx} className="subtitle-row">
                  <div className="index">{idx + 1}</div>
                  <div className="time">{sub.startTime.split(',')[0]}</div>
                  <textarea 
                    className="textbox" 
                    value={sub.text} 
                    onChange={(e) => {
                      const updated = [...subtitles];
                      updated[idx].text = e.target.value;
                      setSubtitles(updated);
                    }} 
                  />
                  <textarea 
                    className="textbox" 
                    value={sub.translatedText} 
                    onChange={(e) => {
                      const updated = [...subtitles];
                      updated[idx].translatedText = e.target.value;
                      setSubtitles(updated);
                    }} 
                    placeholder="Đang chờ dịch..." 
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
