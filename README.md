# 📒 Kiroku (記録) Notes

> **"Every word matters, especially when it's kept close to home."**

---

### 🇨🇳 中文 (Chinese)
这是一款 **完全本地化** 的笔记本应用。
- **不上传、不同步、不依赖云端**。
- 您的所有内容都以 `JSON` 格式存储在项目根目录的 `./Storage` 文件夹中。
- 真正的数据所有权，适合重视隐私、需要离线笔记或纯净写作环境的用户。

### 🇺🇸 English
A **fully local** minimalist note-taking application.
- **No Cloud, No Sync, No Tracking**.
- Your data is stored directly on your computer in the `./Storage` directory as a simple `JSON` file.
- Complete data ownership, perfect for privacy-conscious users who prefer offline-first workflows.

---

## ✨ 主要功能 (Key Features)

*   **💾 真·本地存储 (True Local Storage)**: 放弃了不稳定的浏览器缓存，直接读写本地文件系统。
*   **✍️ 禅意写作 (Zen Mode)**: 极致精简的界面，专注文字本身，无视觉干扰。
*   **🎨 唯美视觉 (Anime Aesthetic)**: 灵感来自新海诚式的天空与光影，采用毛玻璃 (Glassmorphism) 与柔和色彩。
*   **🖋️ Markdown 核心**: 支持标准的 Markdown 语法，快速记录格式化想法。
*   **🔍 即时搜索 (Instant Search)**: 极速索引标题与正文内容。
*   **☁️ 离线优先 (Offline First)**: 无需联网即可使用，启动极快。

---

## 🛠️ 本地开发与部署 (Local Development)

本应用采用 **Express (Backend) + React & Vite (Frontend)** 架构。

### 1. 克隆与安装 (Install)
```bash
# 安装依赖
npm install
```

### 2. 运行应用 (Run)
```bash
# 启动开发服务器 (自动创建 Storage 文件夹)
npm run dev
```
启动后访问 `http://localhost:3000`。

### 3. 构建生产版本 (Build)
```bash
# 编译前后端代码
npm run build

# 启动生产环境
npm start
```

---

## 📁 目录说明 (Structure)

- `/Storage`: **你的数据核心**。`notes.json` 存储在这里，请务必备份此文件夹！
- `/src`: 前端 React 源代码。
- `server.ts`: 后端 Node.js/Express 服务器，处理文件读写。

---

## 🔒 隐私承诺 (Privacy)

本程序代码开源且透明，没有任何代码会向除您本地服务器之外的任何地址发送请求。您的笔记永远属于您。

---

*Made with ❤️ for writers and dreamers.*
