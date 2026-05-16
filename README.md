<div align="center">
  <h1>🚀 StudySync SaaS</h1>
  <p><b>A comprehensive Productivity & Study Management SaaS platform.</b></p>
  <p>Built with modern technologies: ASP.NET Core Clean Architecture, React, TypeScript, and SignalR.</p>
  <!-- Badges -->
  <img src="https://img.shields.io/badge/.NET_8-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt=".NET 8" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/SQL_Server-CC2927?style=for-the-badge&logo=microsoft-sql-server&logoColor=white" alt="SQL Server" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</div>
<br />
## 🌟 Giới Thiệu (About The Project)
**StudySync** là một nền tảng SaaS chuyên nghiệp hỗ trợ quản lý công việc và học tập. Dự án được thiết kế theo chuẩn **Clean Architecture** ở Backend và kiến trúc Component-based hiện đại ở Frontend. Đặc biệt, hệ thống hỗ trợ đồng bộ hóa thời gian thực (Real-time) để các thành viên trong nhóm có thể làm việc cùng nhau mượt mà.
### ✨ Các Tính Năng Nổi Bật (Key Features)
- **Bảng Kanban Real-time:** Quản lý công việc bằng thao tác kéo thả, mọi thay đổi được cập nhật tức thì tới tất cả người dùng thông qua SignalR.
- **Quản Lý Không Gian Làm Việc (Workspace):** Tạo và phân quyền làm việc theo nhóm.
- **Tích hợp Cloudinary:** Hỗ trợ upload ảnh và file đính kèm tốc độ cao.
- **Bảo mật cao:** Sử dụng JWT Authentication kết hợp mã hóa dữ liệu an toàn.
- **Zero-Install (Docker):** Toàn bộ dự án đã được tự động hóa. Người mới tải code về KHÔNG CẦN cài đặt môi trường.
---
## 🛠️ Công Nghệ Sử Dụng (Tech Stack)
*   **Frontend:** ReactJS, TypeScript, Vite, TailwindCSS.
*   **Backend:** ASP.NET Core 8 Web API, Entity Framework Core, SignalR.
*   **Cơ Sở Dữ Liệu:** Microsoft SQL Server 2022.
*   **DevOps & Deployment:** Docker, Docker Compose, Nginx.
---
## 🚀 Hướng Dẫn Chạy Dự Án Nhanh (Dành Cho Thành Viên Nhóm)
Dự án này đã được cấu hình **Docker hóa 100%**. Bạn KHÔNG CẦN cài đặt .NET SDK, Node.js hay SQL Server trên máy thật.
### Yêu Cầu Cơ Bản
* Máy đã cài đặt sẵn [Docker Desktop](https://www.docker.com/products/docker-desktop/) và đang mở phần mềm này.
### Các Bước Cài Đặt (Chỉ mất 3 phút)
**Bước 1: Clone dự án về máy**
```bash
git clone https://github.com/your-username/StudySync-SaaS.git
cd StudySync-SaaS
Bước 2: Thiết lập biến môi trường Dự án cần một số mật khẩu bảo mật không được đẩy lên GitHub.

Tại thư mục gốc, tìm file .env.example.
Copy file đó và đổi tên thành .env.
Mở file .env và điền cấu hình của bạn. (Lưu ý: Mật khẩu SQL phải chứa chữ Hoa, Thường, Số và Ký tự đặc biệt. VD: StudySync@Strong2026!).
Bước 3: Khởi chạy dự án Mở Terminal ngay tại thư mục chứa file docker-compose.yml và chạy lệnh sau:

bash
docker compose up -d --build
⏳ Lưu ý: Trong lần chạy đầu tiên, Docker sẽ tải về các thư viện cần thiết và tự động chạy lệnh tạo Database (Migration). Vui lòng đợi khoảng 1-3 phút để SQL Server khởi động hoàn tất.

🌐 Truy Cập Ứng Dụng
Sau khi các container báo trạng thái healthy, bạn có thể sử dụng hệ thống tại:

Giao Diện Web: http://localhost:3000
Tài Liệu API (Swagger): http://localhost:8080/swagger
Kết nối Database: Dùng SSMS/DBeaver kết nối vào localhost,14333 (User: sa / Pass: mật khẩu trong file .env).
📁 Cấu Trúc Dự Án (Folder Structure)
text
StudySync-SaaS/
├── StudySync.Backend/     # Chứa mã nguồn .NET 8 (API, Application, Domain, Infrastructure)
├── frontend/              # Chứa mã nguồn ReactJS + Vite
├── docker-compose.yml     # File cấu hình nhạc trưởng cho toàn bộ container
├── .env.example           # File mẫu biến môi trường cho thành viên
├── .gitignore             # Danh sách bỏ qua của Git
└── DOCKER_ARCHITECTURE_GUIDE.md  # Tài liệu đọc thêm về kiến trúc Docker
