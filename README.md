# QRPick 🎯

**QRPick** is a real-time QR-based registration and fair participant selection platform.  
Admins generate QR codes for instant onboarding, users register seamlessly, and selections happen transparently through a live spinning interface synced across all devices.

---

## 🚀 Features

### Admin
- Secure admin authentication
- Generate QR codes with public registration URLs
- View all registered users in real time
- Spin a live dice/wheel containing all participants
- Automatically select a random participant
- View selected participants history
- Export selected users list to Excel (.xlsx)

### User
- Register instantly by scanning a QR code
- Automatic login after registration
- Live view of spinning and selected participants
- Real-time updates (no refresh required)

---

## 🧩 Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- shadcn/ui
- Socket.io Client

### Backend
- Node.js
- Express.js
- Socket.io
- JWT Authentication

### Database
- MySQL

### Other
- QR Code generation
- Excel export (.xlsx)

---

## 🔐 Roles & Access
- **Admin:** Controls QR creation and spinning
- **User:** Registers via QR and views live results only

---

## 🔄 Real-Time Functionality
- Live spinning animation synced across all connected clients
- Selected users list updates instantly for admin and users
- Powered by **Socket.io**

---

## 🖥️ Dashboard Layout

- **Left Panel:** Registered users list
- **Center Panel:** Spinning dice / wheel with Spin button (admin only)
- **Right Panel:** Selected users list with export option

Fully responsive for:
- Mobile
- Tablet
- Laptop
- Desktop

---

## 🗄️ Database Tables

- `admins`
- `users`
- `qr_sessions`
- `spins`
- `selected_users`

(Relational structure with proper indexing)

---

## 📦 Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/qrpick.git
cd qrpick
````

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=qrpick_db
JWT_SECRET=your_jwt_secret
```

Run backend:

```bash
npm run dev
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 📊 Export

* Selected participants can be exported as an **Excel (.xlsx)** file directly from the admin dashboard.

---

## 🔒 Security

* JWT-based authentication
* Role-based access control
* Secure QR session handling

---

## 🎯 Use Cases

* Corporate events
* Training programs
* Safety briefings
* Lucky draws
* Transparent participant selection

---

## 📌 Future Improvements

* Multi-event support
* Analytics dashboard
* Admin role hierarchy
* Custom spin rules
* Audit logs

---

## 📄 License

This project is licensed under the **MIT License**.

---

## ✨ Author

Built with ❤️ using MERN, MySQL, Tailwind, and real-time tech.
