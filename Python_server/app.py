from flask import Flask, request, jsonify
from flask_cors import CORS
from ytmusicapi import YTMusic
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import requests
import urllib.parse
from sqlalchemy import create_engine, text
from cachetools import cached, TTLCache # 🟢 THÊM THƯ VIỆN CACHE

app = Flask(__name__)
CORS(app) 

yt = YTMusic()
TMDB_API_KEY = '46f87255f304cb323c76a53abf325782'

# TẠO CACHE: Lưu kết quả AI trong 5 phút. Nếu user load lại trang, AI lấy luôn kết quả cũ trả về siêu nhanh!
ai_cache = TTLCache(maxsize=100, ttl=300) 

conn_str = "DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost;DATABASE=RecommenderDB;UID=ADMIN;PWD=KhangPham2005"
params = urllib.parse.quote_plus(conn_str)
DB_URL = f"mssql+pyodbc:///?odbc_connect={params}"
engine = create_engine(DB_URL, pool_size=10, max_overflow=20)


@app.route('/api/search', methods=['GET'])
def search_music():
    query = request.args.get('q')
    if not query: return jsonify([])
    try:
        results = yt.search(query, filter='songs')
        if not results: results = yt.search(query)
        return jsonify(results)
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/api/song/<video_id>', methods=['GET'])
def get_song_detail(video_id):
    try:
        song_info = yt.get_song(video_id)
        watch_playlist = yt.get_watch_playlist(videoId=video_id)
        lyrics = None
        if 'lyrics' in watch_playlist and watch_playlist['lyrics']:
            lyrics_data = yt.get_lyrics(watch_playlist['lyrics'])
            lyrics = lyrics_data['lyrics'] if lyrics_data else "Không tìm thấy lời"
        return jsonify({"info": song_info, "lyrics": lyrics, "related": watch_playlist.get('tracks', [])[:10]})
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/api/charts', methods=['GET'])
def get_charts():
    try:
        results = yt.search("Top Hits Vietnam", filter='songs', limit=50)
        return jsonify([s for s in results if 'videoId' in s])
    except: return jsonify([])


# ==========================================
# 🧠 CORE AI: ĐÃ TỐI ƯU HÓA HIỆU SUẤT VÀ CACHE
# ==========================================
@cached(cache=ai_cache) # 🟢 GẮN CACHE VÀO HÀM NÀY
def generate_recommendations(user_id, item_type):
    try:
        user_id = int(user_id)
    except:
        user_id = 0

    try:
        query = f"SELECT UI.UserID, UI.ItemID, UI.ActionType, U.BirthYear, U.Gender FROM UserInteractions UI JOIN Users U ON UI.UserID = U.UserID WHERE UI.ItemType = '{item_type}' OR UI.ItemType = 'mixed' OR UI.ActionType = 'SEARCH' OR UI.ActionType LIKE 'PREFER_%'"
        
        with engine.connect() as conn:
            df = pd.read_sql(text(query), conn)

        empty_result = {"history": [], "popular": [], "age": [], "gender": [], "content_based": [], "personalized": [], "cold_start": []}
        if df.empty: return empty_result

        def get_rating(x):
            if x == 'LIKE': return 5
            if x == 'DISLIKE': return -2 
            if x == 'VIEW': return 1.5 
            if str(x).startswith('RATE_'): 
                try: return float(x.split('_')[1])
                except: return 0
            return 0 

        df['Rating'] = df['ActionType'].apply(get_rating)
        
        # 🟢 XỬ LÝ COLD START CHUẨN XÁC: Tách biệt Phim và Nhạc
        cold_start_items = []
        prefer_action = 'PREFER_MOVIE' if item_type == 'movie' else 'PREFER_SONG'
        user_prefers = df[(df['UserID'] == user_id) & (df['ActionType'] == prefer_action)]['ItemID'].dropna().unique().tolist()
        
        # Lọc df chỉ giữ lại hành vi thật (bỏ SEARCH và PREFER ra khỏi logic tính toán CF)
        action_df = df[~df['ActionType'].isin(['SEARCH', 'PREFER_MOVIE', 'PREFER_SONG'])]

        user_actions = action_df[(action_df['UserID'] == user_id) & (action_df['Rating'] >= 3)]
        history_items = user_actions.groupby('ItemID')['Rating'].max().sort_values(ascending=False).index.tolist()[:15]
        
        # Nếu user không có lịch sử, dùng sở thích đã chọn
        if len(history_items) == 0 and len(user_prefers) > 0:
            try:
                if item_type == 'movie':
                    genre_query = ",".join(user_prefers)
                    res = requests.get(f"https://api.themoviedb.org/3/discover/movie?api_key={TMDB_API_KEY}&language=vi-VN&with_genres={genre_query}&sort_by=popularity.desc").json()
                    for m in res.get('results', [])[:15]: cold_start_items.append(str(m['id']))
                else: # song
                    for tag in user_prefers:
                        search_res = yt.search(f"{tag} hay nhất", filter='songs', limit=5) # 🟢 Lấy từ khóa trực tiếp
                        for s in search_res: 
                            if 'videoId' in s: cold_start_items.append(s['videoId'])
            except Exception as e:
                print("Lỗi Cold Start:", e)


        search_df = df[(df['UserID'] == user_id) & (df['ActionType'] == 'SEARCH')]
        user_searches = search_df['ItemID'].dropna().unique().tolist()[-5:]
        recent_loved_items = history_items[:5] 

        stats = action_df.groupby('ItemID')['Rating'].agg(['mean', 'count', 'sum'])
        popular_items = stats[stats['count'] > 0].sort_values(by=['sum', 'mean'], ascending=False).index.tolist()[:15]

        age_items, gender_items = [], []
        if user_id in action_df['UserID'].values:
            user_birth = action_df[action_df['UserID'] == user_id]['BirthYear'].max()
            user_gender = action_df[action_df['UserID'] == user_id]['Gender'].max()
            
            if pd.notna(user_birth):
                age_df = action_df[(action_df['BirthYear'] >= user_birth - 5) & (action_df['BirthYear'] <= user_birth + 5) & (action_df['UserID'] != user_id)]
                age_items = age_df.groupby('ItemID')['Rating'].agg(['sum']).sort_values(by=['sum'], ascending=False).index.tolist()[:15]
                
            if pd.notna(user_gender):
                gender_df = action_df[(action_df['Gender'] == user_gender) & (action_df['UserID'] != user_id)]
                gender_items = gender_df.groupby('ItemID')['Rating'].agg(['sum']).sort_values(by=['sum'], ascending=False).index.tolist()[:15]

        content_items_set = set()
        try:
            if item_type == 'movie':
                for mid in recent_loved_items:
                    res = requests.get(f"https://api.themoviedb.org/3/movie/{mid}/recommendations?api_key={TMDB_API_KEY}&language=vi-VN").json()
                    for m in res.get('results', [])[:8]: content_items_set.add(str(m['id']))
            else: 
                for sid in recent_loved_items:
                    res = yt.get_watch_playlist(videoId=sid, limit=15)
                    for track in res.get('tracks', []):
                        if 'videoId' in track and track['videoId'] != sid:
                            content_items_set.add(track['videoId'])
        except Exception as e: pass

        content_items = list(content_items_set - set(history_items))[:15]

        personalized_items = []
        user_item_matrix = action_df.pivot_table(index='UserID', columns='ItemID', values='Rating', aggfunc='max').fillna(0)
        if user_id in user_item_matrix.index and len(history_items) > 0:
            user_sim = cosine_similarity(user_item_matrix)
            user_sim_df = pd.DataFrame(user_sim, index=user_item_matrix.index, columns=user_item_matrix.index)
            similar_users = user_sim_df[user_id].sort_values(ascending=False).index[1:]
            
            suggested = {}
            watched = set(user_item_matrix.loc[user_id][user_item_matrix.loc[user_id] > 0].index)
            for other_user in similar_users:
                other_ratings = user_item_matrix.loc[other_user]
                liked = other_ratings[other_ratings >= 3].index
                for item in liked:
                    if item not in watched:
                        suggested[item] = suggested.get(item, 0) + user_sim_df[user_id][other_user]
                if len(suggested) >= 20: break
            personalized_items = [item[0] for item in sorted(suggested.items(), key=lambda x: x[1], reverse=True)[:15]]

        return {
            "history": [str(x) for x in history_items],
            "popular": [str(x) for x in popular_items],
            "age": [str(x) for x in age_items],
            "gender": [str(x) for x in gender_items],
            "content_based": [str(x) for x in content_items],
            "personalized": [str(x) for x in personalized_items],
            "cold_start": [str(x) for x in cold_start_items] # 🟢 TRẢ VỀ KẾT QUẢ TỪ ONBOARDING
        }
    except Exception as e:
        print(f"Lỗi Hệ Thống AI: {e}")
        return {"history": [], "popular": [], "age": [], "gender": [], "content_based": [], "personalized": [], "cold_start": []}


@app.route('/api/recommend/dashboard', methods=['GET'])
def recommend_dashboard():
    user_id = request.args.get('userId', 0)
    item_type = request.args.get('type', 'movie') 
    data = generate_recommendations(user_id, item_type)
    return jsonify(data)

@app.route('/api/recommend/movies', methods=['GET'])
def recommend_movies():
    user_id = request.args.get('userId')
    if not user_id: return jsonify([])
    
    res = generate_recommendations(user_id, 'movie')
    # 🟢 Ưu tiên Cold Start lên đầu, sau đó mới đến cá nhân hóa
    final_list = list(dict.fromkeys(res.get('cold_start', []) + res.get('personalized', []) + res.get('content_based', []) + res.get('popular', [])))
    return jsonify(final_list[:15])

@app.route('/api/recommend/songs', methods=['GET'])
def recommend_songs():
    user_id = request.args.get('userId')
    if not user_id: return jsonify([])
    
    res = generate_recommendations(user_id, 'song')
    final_list = list(dict.fromkeys(res.get('cold_start', []) + res.get('personalized', []) + res.get('content_based', []) + res.get('popular', [])))
    return jsonify(final_list[:15])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True, threaded=True)