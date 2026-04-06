import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Sparkles, Copy, 
  CheckCircle, AlertCircle, FileText, 
  Pencil, Hash
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function YoutubeSeo() {
  const [sourceData, setSourceData] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(null);

  const handleGenerate = async () => {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      alert('Vui lòng nhập Gemini API Key trong tab "Dịch Phụ đề" trước.');
      return;
    }
    if (!sourceData.trim()) return;

    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Bạn là một chuyên gia SEO YouTube cho kênh chuyên về TIÊN HIỆP, TU TIÊN, KIẾM HIỆP, chuyên dịch video từ Trung Quốc sang Việt Nam.
      
      Nội dung gốc (có thể chứa tiếng Trung): "${sourceData}"
      
      Hãy tạo ra các nội dung SEO bằng tiếng Việt theo phong cách Tiên Hiệp/Tu Tiên:
      1. Tiêu đề: Cuốn hút, sử dụng tên Hán Việt cho nhân vật/địa danh. (Ví dụ: "Lâm Phong Đại Chiến Lam Hải" thay vì "Trận đánh của Lin Feng").
      2. Mô tả: Hấp dẫn, tóm tắt diễn biến chính bằng ngôn ngữ cổ phong, hào hùng.
      3. Tags: Tập trung vào các từ khóa liên quan đến thể loại (Tu tiên, Tiên hiệp, Kiếm hiệp, Hoạt hình Trung Quốc, v.v.) và tên nhân vật.
      
      Trả về dưới dạng JSON cực kỳ chuẩn:
      {
        "titles": ["Tiêu đề 1", "Tiêu đề 2", "Tiêu đề 3"],
        "description": "Mô tả đầy đủ...",
        "tags": "tag1, tag2, tag3"
      }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim().replace(/```json|```/g, '');
      setResults(JSON.parse(text));
    } catch (err) {
      alert('Lỗi AI: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="studio-main" style={{ overflowY: 'auto' }}>
      <header className="control-bar" style={{ marginBottom: '30px' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Video size={24} color="#646cff" /> Trợ lý SEO YouTube (AI)
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5 }}>Tối ưu tiêu đề và mô tả video nhanh chóng.</p>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || !sourceData.trim()}>
          {loading ? <Sparkles className="spin" size={16} /> : <Sparkles size={16} />}
          {loading ? 'Đang tạo...' : 'Tạo SEO'}
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: results ? '1fr 1.5fr' : '1fr', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#646cff' }}>
            <FileText size={18} />
            <h3 style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase' }}>Thông tin video gốc</h3>
          </div>
          <textarea 
            className="textbox" 
            placeholder="Dán tiêu đề tiếng Trung hoặc nội dung tóm tắt..." 
            style={{ minHeight: '200px' }}
            value={sourceData}
            onChange={(e) => setSourceData(e.target.value)}
          />
        </div>

        <AnimatePresence>
          {results && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', color: '#10b981', textTransform: 'uppercase' }}>Gợi ý tiêu đề</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {results.titles.map((title, i) => (
                    <div key={i} className="seo-item-row" onClick={() => copyToClipboard(title, `title-${i}`)}>
                      <span>{title}</span>
                      {copied === `title-${i}` ? <CheckCircle size={14} color="#10b981" /> : <Copy size={14} style={{ opacity: 0.3 }} />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '11px', color: '#646cff', textTransform: 'uppercase' }}>Mô tả video</h3>
                  <button className="btn-copy-icon" onClick={() => copyToClipboard(results.description, 'desc')}>
                    {copied === 'desc' ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <div className="seo-text-area">{results.description}</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '11px', color: '#a78bfa', textTransform: 'uppercase' }}>Tags & Hashtags</h3>
                  <button className="btn-copy-icon" onClick={() => copyToClipboard(results.tags, 'tags')}>
                    {copied === 'tags' ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <div className="seo-text-area" style={{ color: '#a78bfa', fontSize: '12px' }}>{results.tags}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
