const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình Database
const dbConfig = {
    user: 'ADMIN', 
    password: 'KhangPham2005', // 
    server: 'localhost', 
    port: 1433, // Mặc định cổng SQL Server
    database: 'RecommenderDB', 
    options: {
        encrypt: false,
        trustServerCertificate: true,
        //instanceName: 'SQLEXPRESS'
    }
};

// API lấy danh sách phim
app.get('/api/movies', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        console.log("Đã kết nối SQL thành công!"); // Log để kiểm tra
        
        let result = await pool.request().query("SELECT * FROM Movies");
        
        res.json(result.recordset);
    } catch (err) {
        console.log("Lỗi:", err);
        res.status(500).json({ error: err.message });
    }
});


// API Lấy chi tiết 1 bộ phim theo ID
app.get('/api/movies/:id', async (req, res) => {
    try {
        const id = req.params.id; // Lấy số 1 từ URL
        let pool = await sql.connect(dbConfig);
        
        // Dùng @input để tránh lỗi bảo mật SQL Injection
        let result = await pool.request()
            .input('id', sql.Int, id)
            .query("SELECT * FROM Movies WHERE MovieID = @id");

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy phim này!' });
        }

        // Trả về phần tử đầu tiên (vì ID là duy nhất)
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ... (Code listen port ở dưới)

const PORT = 5000;
// ... (Code cũ ở trên)

// API Gợi ý phim dựa trên độ tương đồng (Content-Based Filtering)
app.get('/api/movies/:id/recommend', async (req, res) => {
    try {
        const currentId = parseInt(req.params.id);
        const pool = await sql.connect(dbConfig);

        // 1. Lấy thông tin phim hiện tại
        const currentMovieResult = await pool.request()
            .input('id', sql.Int, currentId)
            .query("SELECT * FROM Movies WHERE MovieID = @id");

        if (currentMovieResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy phim' });
        }

        const currentMovie = currentMovieResult.recordset[0];
        
        // Tách Tags của phim hiện tại thành mảng (Ví dụ: "hành động, bom tấn" -> ["hành động", "bom tấn"])
        // toLowerCase() để không phân biệt hoa thường
        const currentTags = currentMovie.Tags 
            ? currentMovie.Tags.toLowerCase().split(',').map(t => t.trim()) 
            : [];

        // 2. Lấy tất cả các phim khác để so sánh
        const allMoviesResult = await pool.request()
            .input('id', sql.Int, currentId)
            .query("SELECT * FROM Movies WHERE MovieID != @id"); // Trừ phim đang xem ra

        const allMovies = allMoviesResult.recordset;

        // 3. Tính điểm tương đồng cho từng phim
        const scoredMovies = allMovies.map(movie => {
            let score = 0;
            const movieTags = movie.Tags 
                ? movie.Tags.toLowerCase().split(',').map(t => t.trim()) 
                : [];

            // Thuật toán: Đếm số tag trùng nhau
            currentTags.forEach(tag => {
                if (movieTags.includes(tag)) {
                    score += 1; // Trùng 1 từ khóa cộng 1 điểm
                }
            });
            
            // Cộng thêm điểm nếu cùng Thể loại (Genre)
            if (movie.Genre === currentMovie.Genre) {
                score += 0.5;
            }

            return { ...movie, score }; // Trả về phim kèm điểm số
        });

        // 4. Sắp xếp điểm từ cao xuống thấp và lấy Top 5
        const recommendations = scoredMovies
            .filter(m => m.score > 0) // Chỉ lấy phim có liên quan
            .sort((a, b) => b.score - a.score) // Sắp xếp giảm dần
            .slice(0, 5); // Lấy 5 phim đầu

        res.json(recommendations);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// MODULE ÂM NHẠC (SONGS API)
// ==========================================

// 1. Lấy danh sách bài hát
app.get('/api/songs', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query("SELECT * FROM Songs");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Lấy chi tiết 1 bài hát
app.get('/api/songs/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('id', sql.Int, id)
            .query("SELECT * FROM Songs WHERE SongID = @id"); // Lưu ý: SongID

        if (result.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy bài hát' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Gợi ý bài hát tương đồng (AI Logic cho Nhạc)
app.get('/api/songs/:id/recommend', async (req, res) => {
    try {
        const currentId = parseInt(req.params.id);
        const pool = await sql.connect(dbConfig);

        // Lấy bài hát hiện tại
        const currentSongResult = await pool.request().input('id', sql.Int, currentId).query("SELECT * FROM Songs WHERE SongID = @id");
        if (currentSongResult.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy' });
        
        const currentSong = currentSongResult.recordset[0];
        const currentTags = currentSong.Tags ? currentSong.Tags.toLowerCase().split(',').map(t => t.trim()) : [];

        // Lấy các bài còn lại
        const allSongsResult = await pool.request().input('id', sql.Int, currentId).query("SELECT * FROM Songs WHERE SongID != @id");
        
        // Tính điểm (giống hệt phim)
        const scoredSongs = allSongsResult.recordset.map(song => {
            let score = 0;
            const songTags = song.Tags ? song.Tags.toLowerCase().split(',').map(t => t.trim()) : [];
            
            currentTags.forEach(tag => {
                if (songTags.includes(tag)) score += 1;
            });

            if (song.Genre === currentSong.Genre) score += 0.5; // Cùng thể loại nhạc cộng điểm
            return { ...song, score };
        });

        // Sắp xếp và lấy Top 5
        const recommendations = scoredSongs.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
        res.json(recommendations);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// MODULE TÌM KIẾM (SEARCH API)
// ==========================================

app.get('/api/search', async (req, res) => {
    try {
        const keyword = req.query.q; // Lấy từ khóa từ URL (VD: ?q=mai)
        
        if (!keyword) return res.json({ movies: [], songs: [] });

        const pool = await sql.connect(dbConfig);
        
        // 1. Tìm trong bảng Phim (Tìm theo Tên hoặc Tags)
        const movieResult = await pool.request()
            .input('kw', sql.NVarChar, `%${keyword}%`) // Dùng % để tìm kiếm tương đối
            .query("SELECT * FROM Movies WHERE Title LIKE @kw OR Tags LIKE @kw");

        // 2. Tìm trong bảng Nhạc (Tìm theo Tên, Ca sĩ hoặc Tags)
        const songResult = await pool.request()
            .input('kw', sql.NVarChar, `%${keyword}%`)
            .query("SELECT * FROM Songs WHERE Title LIKE @kw OR Artist LIKE @kw OR Tags LIKE @kw");

        // Trả về cả 2 danh sách
        res.json({
            movies: movieResult.recordset,
            songs: songResult.recordset
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ... (Code app.listen ở dưới)
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
}); 

// API ghi nhận hành động người dùng
app.post('/api/log-interaction', async (req, res) => {
    try{
        const{ userId, itemId, itemType, actionType } = req.body;

        let pool = await sql.connect(dbConfig);

        await pool.request()
        .input('UserID', sql.Int, userId || null)
        .input('ItemID', sql.NVarChar, itemId)
        .input('ItemType', sql.NVarChar, itemType)
        .input('ActionType', sql.NVarChar, actionType)
        .query (`
            INSERT INTO UserInteractions (UserID, ItemID, ItemType, ActionType)
            VALUES (@UserID, @ItemID, @ItemType, @ActionType)
            `);
        
    res.status(200).send({message: 'Log saved'});
    }   catch (err)
    {
        console.error("Lỗi ghi log:",err);
        res.status(500).send({error: 'Lỗi Server'});
    }
});