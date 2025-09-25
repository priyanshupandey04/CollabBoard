
# 🎨 CollabBoard


[![Next.js](https://img.shields.io/badge/Next.js-15-blue?logo=next.js)](https://nextjs.org/) 
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/) 
[![Prisma](https://img.shields.io/badge/Prisma-4-blue?logo=prisma)](https://www.prisma.io/) 
[![Liveblocks](https://img.shields.io/badge/Liveblocks-RealTime-purple)](https://liveblocks.io/) 
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?logo=vercel)](https://vercel.com/) 
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 🎯 Features at a Glance

[![Realtime](https://img.shields.io/badge/Realtime-Collaboration-green)](#) 
[![Draw](https://img.shields.io/badge/Draw-Free-blue)](#) 
[![Shapes](https://img.shields.io/badge/Shapes-Add-purple)](#) 
[![Text Editing](https://img.shields.io/badge/Text-Editing-orange)](#) 
[![Chat](https://img.shields.io/badge/Chat-Live-blueviolet)](#) 
[![Undo/Redo](https://img.shields.io/badge/Undo/Redo-yellow)](#) 
[![Dark Mode](https://img.shields.io/badge/Dark/Light-mode-black?logo=moon)](#) 
[![Responsive](https://img.shields.io/badge/Responsive-Mobile/Desktop-green)](#) 

**CollabBoard** is a real-time collaborative whiteboard web application built with **Next.js**, **React**, **Liveblocks**, and **Prisma**.  
It allows multiple users to draw, add shapes, and chat together in private or public rooms. Perfect for remote collaboration, brainstorming, or online teaching.  

---

## ✨ Features

- **Real-time Collaboration**: Draw, move, and edit shapes simultaneously with multiple users.
- **Text & Shape Editing**: Customize stroke color, fill, font, font size, alignment, and more.
- **Chat Integration**: Send messages in rooms with chat history saved in the database.
- **Room Management**:
  - Create public or private rooms.
  - Join rooms with role-based access: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`.
  - Accept or reject join requests.
- **Authentication**: Secure login using **NextAuth.js** with JWT sessions.
- **Dark & Light Mode**: Toggle theme seamlessly.
- **Responsive UI**: Works well on desktop and mobile devices.
- **Undo/Redo**: History tracking for collaborative changes.

---

## 🛠️ Tech Stack

- **Next.js 13+** – App router + server components
- **React** – Client-side interactions
- **Liveblocks** – Real-time collaboration backend
- **Prisma** – ORM for PostgreSQL
- **PostgreSQL / NeonDB** – Database
- **Tailwind CSS** – Styling
- **Framer Motion** – Animations
- **NextAuth.js** – Authentication
- **Vercel** – Deployment

---

## 🚀 Getting Started

### 1️⃣ Clone the repository
```bash
git clone https://github.com/priyanshupandey04/CollabBoard.git
cd CollabBoard
````

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Setup environment variables

Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require"
NEXTAUTH_URL="http://localhost:3000" # for local development
NEXTAUTH_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret"
NEXTAUTH_JWT_MAX_AGE=900
REFRESH_TOKEN_EXPIRES_IN=2592000
LIVEBLOCKS_SECRET_KEY="sk_dev_YOUR_LIVEBLOCKS_KEY"
```

> Make sure to replace values with your own credentials. For **Vercel deployment**, set these variables in Project Settings → Environment Variables.

### 4️⃣ Setup Database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5️⃣ Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6️⃣ Deploy to Vercel

1. Push your code to GitHub.
2. Import your repository into Vercel.
3. Set the **Environment Variables** in Vercel.
4. Deploy the project.

---

## 🔐 Authentication

* Login is handled by **NextAuth.js**.
* Sessions are **JWT-based**.
* Protected routes:

  * `/dashboard` – Shows all your rooms.
  * `/rooms/:id` – Individual whiteboard room.
* Middleware automatically redirects unauthenticated users to `/auth/signin`.

---

## 🖌️ Using CollabBoard Canvas

Once you enter a room, you can collaborate in real-time using the canvas. Here’s what you can do:

1. **Draw Freely**

   * Use the **pencil/pen tool** to draw freehand.
   * Change **stroke color**, **width**, and **opacity** from the toolbar.

2. **Add Shapes**

   * Add **rectangle, circle, line, arrow**, or other supported shapes.
   * Customize **fill color**, **border color**, and **border width**.

3. **Add & Edit Text**

   * Click the **text tool** to add a text box.
   * Customize **font family**, **font size**, **font weight**.
   * Change **text color**, **alignment**, and **line spacing**.
   * Move, resize, or rotate text boxes freely.

4. **Select & Manipulate Elements**

   * Use the **selection tool** to select one or multiple elements.
   * Move, resize, or rotate elements.
   * Change properties of selected elements (color, opacity, stroke, etc.).

5. **Undo / Redo**

   * Keep track of all changes with **undo/redo history**.
   * Actions are synchronized across all collaborators.

6. **Zoom & Pan**

   * Zoom in/out on the canvas for precision drawing.
   * Pan across the canvas to navigate larger boards.

7. **Real-Time Collaboration**

   * See edits from other users live.
   * Multiple users can draw, move, or edit elements simultaneously.

8. **Save & Persist**

   * All changes are saved in real-time.
   * New users joining the room see the current board state immediately.

> Tip: Use the **toolbar** on the side to switch tools, colors, and text properties efficiently. All edits are synchronized for all users in the room!

---

## 🧩 Folder Structure

```
app/
 ├─ api/         # API routes
 ├─ components/  # Reusable components (Sidebar, Player, Chat, etc.)
 ├─ rooms/       # Whiteboard rooms
 ├─ dashboard/   # User dashboard
prisma/
 ├─ schema.prisma
```

---

## 💡 Tips

* Always ensure **NEXTAUTH_URL** matches the deployed domain in production.
* Live collaboration uses **Liveblocks**; set your secret key properly.
* Clear cookies if you experience infinite redirects in production.

---

## 📄 License

This project is **MIT Licensed**.

---

## 💬 Feedback

For questions or contributions, open an issue or submit a pull request.

✨ Enjoy collaborating in real-time with **CollabBoard**!

```

---

If you want, I can also **add badges at the top** (Next.js, Prisma, Liveblocks, Vercel, license, build status, etc.) so your README looks like trending GitHub projects.  

Do you want me to do that next?
```
