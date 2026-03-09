// client/src/API/tmdbAPI.jsx

// 1. CẤU HÌNH (CONSTANTS)
export const API_KEY = '46f87255f304cb323c76a53abf325782'; 
export const BASE_URL = 'https://api.themoviedb.org/3';

// URL ảnh Poster (Dọc - dùng cho danh sách phim)
export const IMAGE_URL = 'https://image.tmdb.org/t/p/w500'; 

// 👇 URL ảnh Nền (Ngang - dùng cho HeroSection) - Lấy khổ 'original' cho nét căng
export const BACKDROP_URL = 'https://image.tmdb.org/t/p/original'; 

// 2. HÀM GỌI DANH SÁCH PHIM (Có hỗ trợ lấy nhiều trang)
export const fetchMovies = async (pages = 500) => {
    try {
        const requests = [];
        // Gọi song song nhiều trang
        for (let i = 1; i <= pages; i++) {
            requests.push(
                fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=vi-VN&page=${i}`)
                .then(res => res.json())
            );
        }
        
        const results = await Promise.all(requests);
        // Gộp kết quả lại thành 1 mảng duy nhất
        return results.flatMap(data => data.results || []);
    } catch (error) {
        console.error("Lỗi lấy danh sách phim:", error);
        return [];
    }
};

// 3. HÀM TÌM KIẾM PHIM (Cho thanh tìm kiếm)
export const searchMovies = async (keyword) => {
    try {
        if (!keyword) return [];
        const response = await fetch(
            `${BASE_URL}/search/movie?api_key=${API_KEY}&language=vi-VN&query=${encodeURIComponent(keyword)}&page=1`
        );
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
        return [];
    }
};

// ... (Các code cũ giữ nguyên)

// 4. Hàm LỌC PHIM NÂNG CAO (Đã thêm chặn phim tương lai & Lấy nhiều trang)
export const discoverMovies = async (filters = {}, pagesToFetch = 3) => {
    try {
        const { sortBy, withGenres, releaseYear, region } = filters;
        
        let baseUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=vi-VN`;
        
        if (sortBy) baseUrl += `&sort_by=${sortBy}`;
        if (withGenres) baseUrl += `&with_genres=${withGenres}`;
        if (releaseYear) baseUrl += `&primary_release_year=${releaseYear}`;
        if (region) baseUrl += `&region=${region}`;

        // 🟢 NÂNG CẤP: Nếu người dùng chọn "Mới nhất", chặn các phim chưa ra mắt
        if (sortBy === 'primary_release_date.desc') {
            const today = new Date().toISOString().split('T')[0]; // Lấy ngày hôm nay (VD: 2026-03-09)
            baseUrl += `&primary_release_date.lte=${today}`; // lte: Less than or equal to (Nhỏ hơn hoặc bằng)
        }

        // 🟢 NÂNG CẤP: Lấy nhiều trang (VD: 3 trang = 60 phim) cùng lúc thay vì chỉ 20 phim
        const requests = [];
        for (let i = 1; i <= pagesToFetch; i++) {
            requests.push(fetch(`${baseUrl}&page=${i}`).then(res => res.json()));
        }
        
        const results = await Promise.all(requests);
        return results.flatMap(data => data.results || []);
    } catch (error) {
        console.error("Lỗi lọc phim:", error);
        return [];
    }
};

// 5. Hàm lấy danh sách Thể loại (Để hiện trong bộ lọc)
export const fetchGenres = async () => {
    try {
        const response = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=vi-VN`);
        const data = await response.json();
        return data.genres || [];
    } catch (error) {
        return [];
    }
};