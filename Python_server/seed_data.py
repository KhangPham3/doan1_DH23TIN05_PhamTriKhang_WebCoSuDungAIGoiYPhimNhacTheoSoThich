import pyodbc
import random

# --- CẤU HÌNH KẾT NỐI (Giữ nguyên của bạn) ---
conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=localhost;'
    'DATABASE=RecommenderDB;'
    'UID=ADMIN;PWD=KhangPham2005'
)
cursor = conn.cursor()

print("🚀 Bắt đầu tạo dữ liệu giả lập...")

# ---------------------------------------------------------
# 1. TẠO USER GIẢ (Nếu chưa có)
# ---------------------------------------------------------
print("1️⃣ Đang tạo User giả...")
# Tạo 50 user mẫu (user1 -> user50)
for i in range(1, 51): 
    try:
        # Kiểm tra xem user đã tồn tại chưa để tránh lỗi trùng lặp
        cursor.execute("SELECT COUNT(*) FROM Users WHERE Username = ?", (f'user{i}',))
        if cursor.fetchone()[0] == 0:
            cursor.execute(f"INSERT INTO Users (Username, PasswordHash, FullName, Email, BirthYear, Gender) VALUES ('user{i}', '123', 'User Giả {i}', 'user{i}@test.com', 2000, 'Nam')")
    except Exception as e:
        print(f"   ⚠️ Lỗi tạo user{i}: {e}")

conn.commit()

# ---------------------------------------------------------
# 2. LẤY DANH SÁCH USER ID THỰC TẾ
# (Quan trọng: Để tránh lỗi khóa ngoại nếu ID không liên tục)
# ---------------------------------------------------------
cursor.execute("SELECT UserID FROM Users WHERE Username LIKE 'user%'")
valid_user_ids = [row[0] for row in cursor.fetchall()]
print(f"✅ Đã tìm thấy {len(valid_user_ids)} user giả để tạo tương tác.")

# ---------------------------------------------------------
# 3. KHO DỮ LIỆU ITEM MẪU (Mở rộng thêm để AI học tốt hơn)
# ---------------------------------------------------------
# ID lấy từ TMDB (Phim thật)
fake_movie_ids = [
    '934632', '693134', '1011985', '823464', '35941',  # Dune, Kungfu Panda...
    '157336', '155', '299534', '299536', '603',        # Interstellar, Dark Knight, Avengers...
    '13', '120', '121', '122', '550',                  # Forrest Gump, Lord of Rings...
    '27205', '78', '105', '165', '196',                # Inception, Blade Runner...
    '496243', '497', '585', '597', '87827'             # Parasite, Green Mile...
]

# ID lấy từ Youtube (Nhạc thật)
fake_song_ids = [
    'dQw4w9WgXcQ', 'QU9c0053UAU', 'jfKfPfyJRdk',       # Nhạc Demo cũ
    'kffacxfA7G4', '9bZkp7q19f0', 'RgKAFK5djSk',       # Baby, Gangnam Style...
    'OPf0YbXqDm0', '09R8_2nJtjg', 'kJQP7kiw5Fk',       # Uptown Funk, Sugar...
    'JGwWNGJdvx8', 'lp-EO5I60KA', 'ALZHF5UqnU4'        # Shape of You, Ed Sheeran...
]

actions = ['VIEW', 'LIKE', 'LIKE', 'LIKE', 'VIEW'] # Tỷ lệ LIKE cao hơn để AI dễ bắt cặp

# ---------------------------------------------------------
# 4. TẠO TƯƠNG TÁC (INTERACTIONS)
# ---------------------------------------------------------
print("2️⃣ Đang bơm dữ liệu tương tác (Like/View)...")

interaction_count = 0

for user_id in valid_user_ids:
    # --- A. Random xem PHIM (Mỗi user xem 5-15 phim) ---
    num_movies = random.randint(5, 15)
    selected_movies = random.sample(fake_movie_ids, min(len(fake_movie_ids), num_movies))
    
    for movie_id in selected_movies:
        action = random.choice(actions)
        try:
            # Chỉ insert nếu chưa có tương tác này
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM UserInteractions WHERE UserID = ? AND ItemID = ? AND ItemType = 'movie')
                BEGIN
                    INSERT INTO UserInteractions (UserID, ItemID, ItemType, ActionType)
                    VALUES (?, ?, 'movie', ?)
                END
            """, (user_id, movie_id, user_id, movie_id, action))
            interaction_count += 1
        except:
            pass

    # --- B. Random nghe NHẠC (Mỗi user nghe 5-10 bài) ---
    num_songs = random.randint(5, 10)
    selected_songs = random.sample(fake_song_ids, min(len(fake_song_ids), num_songs))
    
    for song_id in selected_songs:
        action = random.choice(actions)
        try:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM UserInteractions WHERE UserID = ? AND ItemID = ? AND ItemType = 'song')
                BEGIN
                    INSERT INTO UserInteractions (UserID, ItemID, ItemType, ActionType)
                    VALUES (?, ?, 'song', ?)
                END
            """, (user_id, song_id, user_id, song_id, action))
            interaction_count += 1
        except:
            pass

conn.commit()
print(f"🎉 ĐÃ XONG! Đã thêm khoảng {interaction_count} tương tác mới.")
print("👉 Bây giờ bạn có thể chạy 'python app.py' và test thử API gợi ý.")
conn.close()