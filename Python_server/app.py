from flask import Flask, request, jsonify
from flask_cors import CORS
from ytmusicapi import YTMusic

#Thư viện cho AI dựa vào user interaction
import pyodbc
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

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


# 3. API Lấy Bảng Xếp Hạng (Sửa để lấy 50 bài)
@app.route('/api/charts', methods=['GET'])
def get_charts():
    try:
        # Thêm limit=50 vào hàm search
        results = yt.search("Top Hits Vietnam", filter='songs', limit=50)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# AI Logic
def get_ai_recommendations(user_id, item_type='movie'):
    try:
        conn = pyodbc.connect(
            'DRIVER={ODBC Driver 17 for SQL Server};'
            'SERVER=localhost;'
            'DATABASE=RecommenderDB;'
            'UID=ADMIN;PWD=KhangPham2005'
        )
        
        # CHỈ LẤY DỮ LIỆU TƯƠNG TÁC (KHÔNG CẦN JOIN VỚI BẢNG MOVIES/SONGS)
        query = f"""
            SELECT UserID, ItemID, 
            CASE 
                WHEN ActionType = 'LIKE' THEN 5 
                WHEN ActionType = 'VIEW' THEN 1 
                ELSE 0 
            END as Rating
            FROM UserInteractions
            WHERE ItemType = '{item_type}'
        """
        df = pd.read_sql(query, conn)
        conn.close()

        if df.empty: return []

        # Tạo ma trận và tính toán (Giống code trước)
        user_item_matrix = df.pivot_table(index='UserID', columns='ItemID', values='Rating', aggfunc='max').fillna(0)
        
        if user_id not in user_item_matrix.index: return []

        user_similarity = cosine_similarity(user_item_matrix)
        user_similarity_df = pd.DataFrame(user_similarity, index=user_item_matrix.index, columns=user_item_matrix.index)
        
        similar_users = user_similarity_df[user_id].sort_values(ascending=False).index[1:]
        
        suggested_items = {}
        watched_items = set(user_item_matrix.loc[user_id][user_item_matrix.loc[user_id] > 0].index)

        for other_user in similar_users:
            other_user_ratings = user_item_matrix.loc[other_user]
            liked_items = other_user_ratings[other_user_ratings >= 3].index
            
            for item in liked_items:
                if item not in watched_items:
                    suggested_items[item] = suggested_items.get(item, 0) + user_similarity_df[user_id][other_user]
            
            if len(suggested_items) >= 10: break
        
        sorted_suggestions = sorted(suggested_items.items(), key=lambda x: x[1], reverse=True)
        
        # TRẢ VỀ DANH SÁCH ID (Dạng String hoặc Int tùy dữ liệu gốc)
        return [str(item[0]) for item in sorted_suggestions[:10]]

    except Exception as e:
        print(f"Lỗi AI: {e}")
        return []
    
# API Endpoint cho React gọi
@app.route('/api/recommend/movies', methods=['GET'])
def recommend_movies():
    user_id = request.args.get('userId')
    if not user_id: return jsonify([])
    # Trả về list ID (VD: ["123", "456"])
    return jsonify(get_ai_recommendations(int(user_id), 'movie'))

@app.route('/api/recommend/songs', methods=['GET'])
def recommend_songs():
    user_id = request.args.get('userId')
    if not user_id: return jsonify([])
    return jsonify(get_ai_recommendations(int(user_id), 'song'))

if __name__ == '__main__':
    print("🤖 AI & Music Server running on http://localhost:8000")
    app.run(port=8000, debug=True)