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

## 🌟 About The Project

**StudySync** is a professional SaaS platform designed to streamline task and study management. The project is engineered using **Clean Architecture** on the Backend and modern Component-based architecture on the Frontend. It features real-time synchronization to ensure seamless collaboration among team members.

### ✨ Key Features
- **Real-time Kanban Board:** Manage tasks using drag-and-drop. All changes are instantly synced to all active users via SignalR.
- **Workspace Management:** Create and manage collaborative team workspaces with role-based access.
- **Cloudinary Integration:** Fast and reliable attachment and image uploading.
- **Robust Security:** Implements JWT Authentication and secure data encryption.
- **Zero-Install (Docker):** Fully containerized setup. New team members can run the entire project without installing local dependencies.

---

## 🛠️ Tech Stack

*   **Frontend:** ReactJS, TypeScript, Vite, TailwindCSS.
*   **Backend:** ASP.NET Core 8 Web API, Entity Framework Core, SignalR.
*   **Database:** Microsoft SQL Server 2022.
*   **DevOps & Deployment:** Docker, Docker Compose, Nginx.

---

## 🚀 Quick Start 

This project is **100% Dockerized**. You DO NOT need to install the .NET SDK, Node.js, or SQL Server on your local machine.

### Prerequisites
* You must have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Installation (Takes ~3 minutes)

**Step 1: Clone the repository**
```bash
git clone https://github.com/phanhoaian1203/StudySync-SaaS
cd StudySync-SaaS
```

**Step 2: Configure environment variables**
The project requires secret keys that are not pushed to GitHub.
1. In the root directory, locate the `.env.example` file.
2. Duplicate the file and rename the copy to `.env`.
3. Open the `.env` file and fill in your configuration. *(Note: The SQL password must contain uppercase, lowercase, numbers, and special characters. E.g., `StudySync@Strong2026!`)*.

**Step 3: Run the project**
Open a Terminal in the root directory (where `docker-compose.yml` is located) and execute:
```bash
docker compose up -d --build
```
> ⏳ **Note:** During the first run, Docker will download the required images and **automatically run database migrations**. Please wait 1-3 minutes for the SQL Server to fully initialize.

### 🌐 Accessing the Application
Once the containers report a `healthy` status, the system is ready at:
*   **Web Interface:** [http://localhost:3000](http://localhost:3000)
*   **API Documentation (Swagger):** [http://localhost:8080/swagger](http://localhost:8080/swagger)
*   **Database Connection:** Use SSMS/DBeaver to connect to `localhost,14333` (User: `sa` / Password: the password in your `.env` file).

---
*Developed with 💖 and committed to Clean Architecture.*
