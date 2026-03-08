import pyodbc
import random

conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=localhost;'
    'DATABASE=RecommenderDB;'
    'UID=ADMIN;PWD=KhangPham2005'
)
cursor = conn.cursor()

print("🚀 Đang khởi tạo hàng ngàn dữ liệu thống kê (Views, Likes, Ratings)...")

# Lấy danh sách ID User
cursor.execute("SELECT UserID FROM Users")
user_ids = [row[0] for row in cursor.fetchall()]

# Danh sách một vài Phim và Nhạc nổi bật để buff chỉ số
hot_movies = ['299534', '19995', '313369', '157336', '11216'] # Endgame, Avatar, La La Land...
hot_songs = ['YykjpeuMNEk', 'ALZHF5UqnU4', '0Sjc0hQ3G7Q', 'Llw9Q6akRo4'] 

interaction_count = 0

def generate_fake_data(item_id, item_type):
    global interaction_count
    # 1. Buff Views (Tạo các lượt view từ user ẩn danh - NULL)
    views = random.randint(50, 500)
    for _ in range(views):
        cursor.execute("INSERT INTO UserInteractions (UserID, ItemID, ItemType, ActionType) VALUES (NULL, ?, ?, 'VIEW')", (item_id, item_type))
        interaction_count += 1

    # 2. Buff Likes/Dislikes & Ratings từ các user thực tế
    interacting_users = random.sample(user_ids, random.randint(10, len(user_ids)))
    
    for uid in interacting_users:
        # Tỉ lệ 80% Like, 20% Dislike
        emotion = 'LIKE' if random.random() > 0.2 else 'DISLIKE'
        cursor.execute("INSERT INTO UserInteractions (UserID, ItemID, ItemType, ActionType) VALUES (?, ?, ?, ?)", (uid, item_id, item_type, emotion))
        
        # Đánh giá sao (Thiên về 4 và 5 sao cho phim hot)
        star = random.choices([1, 2, 3, 4, 5], weights=[5, 5, 10, 40, 40], k=1)[0]
        cursor.execute("INSERT INTO UserInteractions (UserID, ItemID, ItemType, ActionType) VALUES (?, ?, ?, ?)", (uid, item_id, item_type, f'RATE_{star}'))
        
        interaction_count += 2

# Chạy tạo data
for mid in hot_movies:
    generate_fake_data(mid, 'movie')
for sid in hot_songs:
    generate_fake_data(sid, 'song')

conn.commit()
print(f"🎉 HOÀN TẤT! Đã bơm thành công {interaction_count} lượt tương tác vào cơ sở dữ liệu.")
conn.close()