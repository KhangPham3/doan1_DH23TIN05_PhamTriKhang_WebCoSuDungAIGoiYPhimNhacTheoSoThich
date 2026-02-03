from flask import Flask, request, jsonify
from flask_cors import CORS
from ytmusicapi import YTMusic

app = Flask(__name__)
CORS(app) # Cho phép mọi nguồn gọi vào (React)

# Khởi tạo thư viện YouTube Music
yt = YTMusic()

# 1. API Tìm kiếm bài hát
@app.route('/api/search', methods=['GET'])
def search_music():
    query = request.args.get('q')
    if not query:
        return jsonify([])
    
    try:
        # filter='songs' để chỉ lấy bài hát, bỏ qua video/album rác
        results = yt.search(query, filter='songs')
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 2. API Lấy chi tiết bài hát & Lời bài hát (Nếu có)
@app.route('/api/song/<video_id>', methods=['GET'])
def get_song_detail(video_id):
    try:
        # Lấy thông tin chi tiết
        song_info = yt.get_song(video_id)
        
        # Lấy lời bài hát (Nếu có browseId của lyrics)
        lyrics = None
        watch_playlist = yt.get_watch_playlist(videoId=video_id)
        if 'lyrics' in watch_playlist and watch_playlist['lyrics']:
            lyrics_id = watch_playlist['lyrics']
            lyrics_data = yt.get_lyrics(lyrics_id)
            lyrics = lyrics_data['lyrics'] if lyrics_data else "Không tìm thấy lời"

        return jsonify({
            "info": song_info,
            "lyrics": lyrics,
            "related": watch_playlist.get('tracks', [])[:5] # Lấy 5 bài liên quan
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 3. API Lấy Bảng Xếp Hạng (Charts)
@app.route('/api/charts', methods=['GET'])
def get_charts():
    try:
        # 1. Tăng limit lên 100 bài
        # 2. Dùng từ khóa "Vietnam" để lấy nhạc Việt hot
        results = yt.search("Nhạc Trẻ Remix Vietnam Top Hits", filter='songs', limit=100)
        
        # Lọc bớt kết quả lỗi (không có videoId)
        clean_results = [s for s in results if 'videoId' in s]
        
        return jsonify(clean_results)
    except Exception as e:
        print(f"Lỗi Python: {e}")
        return jsonify([])

if __name__ == '__main__':
    # Chạy server Python ở port 8000 để không đụng port 5000 của Node.js
    print("🎵 Music Server running on http://localhost:8000")
    app.run(port=8000, debug=True)

# ... (đoạn import giữ nguyên)

# 3. API Lấy Bảng Xếp Hạng (Sửa để lấy 50 bài)
@app.route('/api/charts', methods=['GET'])
def get_charts():
    try:
        # Thêm limit=50 vào hàm search
        results = yt.search("Top Hits Vietnam", filter='songs', limit=50)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ... (phần còn lại giữ nguyên)