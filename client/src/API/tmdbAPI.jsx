
// 1. CẤU HÌNH (CONSTANTS)
export const API_KEY = '46f87255f304cb323c76a53abf325782'; 
export const BASE_URL = 'https://api.themoviedb.org/3';

export const IMAGE_URL = 'https://image.tmdb.org/t/p/w500'; 

export const BACKDROP_URL = 'https://image.tmdb.org/t/p/original'; 

// 2. HÀM GỌI DANH SÁCH PHIM 
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
        return results.flatMap(data => data.results || []);
    } catch (error) {
        console.error("Lỗi lấy danh sách phim:", error);
        return [];
    }
};

// 3. HÀM TÌM KIẾM PHIM 
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


// 4. Hàm LỌC PHIM NÂNG CAO 
export const discoverMovies = async (filters = {}, pagesToFetch = 3) => {
    try {
        const { sortBy, withGenres, releaseYear, region } = filters;
        
        let baseUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=vi-VN`;
        
        if (sortBy) baseUrl += `&sort_by=${sortBy}`;
        if (withGenres) baseUrl += `&with_genres=${withGenres}`;
        if (releaseYear) baseUrl += `&primary_release_year=${releaseYear}`;
        if (region) baseUrl += `&region=${region}`;

       
        if (sortBy === 'primary_release_date.desc') {
            const today = new Date().toISOString().split('T')[0]; 
            baseUrl += `&primary_release_date.lte=${today}`; 
        }

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

// 5. Hàm lấy danh sách Thể loại 
export const fetchGenres = async () => {
    try {
        const response = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=vi-VN`);
        const data = await response.json();
        return data.genres || [];
    } catch (error) {
        return [];
    }
};