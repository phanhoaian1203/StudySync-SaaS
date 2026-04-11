import axios from 'axios';

// Khởi tạo một instance của Axios
const axiosClient = axios.create({
  // Đã sửa thành đúng cổng 7150 của Backend
  baseURL: 'https://localhost:7150/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Người gác cổng "trước khi" gửi request đi
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('studySync_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor: Người gác cổng "sau khi" nhận response về
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;