import pyodbc
import random

# --- CẤU HÌNH KẾT NỐI ---
conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=localhost;'
    'DATABASE=RecommenderDB;'
    'UID=ADMIN;PWD=KhangPham2005'
)
cursor = conn.cursor()

print("🚀 Bắt đầu tạo dữ liệu giả lập có chiều sâu cho AI (Collaborative Filtering)...")

# 1. TẠO 100 USER GIẢ
print("1️⃣ Đang tạo 100 User mẫu...")
for i in range(1, 101): 
    try:
        cursor.execute("SELECT COUNT(*) FROM Users WHERE Username = ?", (f'user{i}',))
        if cursor.fetchone()[0] == 0:
            cursor.execute(f"INSERT INTO Users (Username, PasswordHash, FullName, Email, BirthYear, Gender) VALUES ('user{i}', '123', 'User AI {i}', 'user{i}@test.com', 2000, 'Nam')")
    except:
        pass
conn.commit()

cursor.execute("SELECT UserID FROM Users WHERE Username LIKE 'user%'")
valid_user_ids = [row[0] for row in cursor.fetchall()]

# ---------------------------------------------------------
# 2. XÂY DỰNG 3 NHÓM SỞ THÍCH (PERSONAS/CLUSTERS)
# Việc này giúp AI nhận diện các nhóm người dùng giống nhau
# ---------------------------------------------------------

# NHÓM 1: Fan Phim Hành Động (Marvel/Sci-Fi) + Nhạc Sôi Động (EDM/Rap)
group_1_movies = ['299534', '299536', '19995', '634649', '157336', '27205', '603'] # Endgame, Infinity War, Avatar, Interstellar...
group_1_songs = ['YykjpeuMNEk', 'ALZHF5UqnU4', '09R8_2nJtjg', 'tvTRZJ-4EyI', 'QvswgfCWq1I'] # Faded, Shape of You, Nhạc Rap/EDM...

# NHÓM 2: Fan Phim Tình Cảm/Drama + Nhạc Pop Nhẹ Nhàng (V-Pop, Ballad)
group_2_movies = ['597', '11036', '313369', '32280', '11216', '332562', '453'] # Titanic, The Notebook, La La Land, Mắt Biếc...
group_2_songs = ['0Sjc0hQ3G7Q', 'x181GgqHl8I', '7wtfhZwyrcc', '450p7goxZqg'] # Nơi này có anh, Chạy ngay đi, All of me...

# NHÓM 3: Fan Phim Kinh Dị/Hoạt Hình + Nhạc Lofi
group_3_movies = ['274', '423', '129', '13', '120', '121', '122'] # Vùng đất linh hồn, Spirited away, LOTR...
group_3_songs = ['Llw9Q6akRo4', 'kN0iD0pI3o0', 'fnPN-qG42NU', 'dQw4w9WgXcQ'] # Lofi, Chill...

print("2️⃣ Đang thiết lập ma trận sở thích (Like/View) cho các User...")
interaction_count = 0

# Duyệt qua từng User và gán ngẫu nhiên vào 1 trong 3 Nhóm sở thích
for user_id in valid_user_ids:
    cluster = random.choice([1, 2, 3])
    
    if cluster == 1:
        my_movies, my_songs = group_1_movies, group_1_songs
    elif cluster == 2:
        my_movies, my_songs = group_2_movies, group_2_songs
    else:
        my_movies, my_songs = group_3_movies, group_3_songs

    # A. Bơm dữ liệu xem PHIM (Mỗi user xem/like 5-7 phim ruột của nhóm mình)
    num_movies = random.randint(4, len(my_movies))
    selected_movies = random.sample(my_movies, num_movies)
    
    for movie_id in selected_movies:
        action = random.choice(['LIKE', 'LIKE', 'VIEW']) # Tỉ lệ LIKE cao để AI học nhanh
        try:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM UserInteractions WHERE UserID = ? AND ItemID = ? AND ItemType = 'movie')
                BEGIN
                    INSERT INTO UserInteractions (UserID, ItemID, ItemType, ActionType) VALUES (?, ?, 'movie', ?)
                END
            """, (user_id, movie_id, user_id, movie_id, action))
            interaction_count += 1
        except: pass

    # B. Bơm dữ liệu nghe NHẠC (Mỗi user nghe/like 3-5 bài ruột của nhóm mình)
    num_songs = random.randint(3, len(my_songs))
    selected_songs = random.sample(my_songs, num_songs)
    
    for song_id in selected_songs:
        action = random.choice(['LIKE', 'LIKE', 'VIEW'])
        try:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM UserInteractions WHERE UserID = ? AND ItemID = ? AND ItemType = 'song')
                BEGIN
                    INSERT INTO UserInteractions (UserID, ItemID, ItemType, ActionType) VALUES (?, ?, 'song', ?)
                END
            """, (user_id, song_id, user_id, song_id, action))
            interaction_count += 1
        except: pass

conn.commit()
print(f"🎉 HOÀN TẤT! Đã bơm thành công {interaction_count} tương tác chuẩn xác.")
print("👉 AI hiện tại đã cực kỳ thông minh. Hãy vào web và click thử 1 phim Marvel để xem sự thay đổi!")
conn.close()