🍽️ Food Delivery App

Food-Delivery-App is a modern, full-stack food delivery web application built using the **MERN Stack** (MongoDB, Express.js, React.js, and Node.js). It offers a seamless food ordering experience for customers, efficient order management for admins, and real-time delivery tracking for delivery personnel.


---

📦 Features

👤 Customer
- User registration and login (JWT-based)
- Browse food items by category
- Add to cart and place orders
- Razorpay integration for payments
- Track order status in real-time

👨‍🍳 Admin
- Secure login for admin panel
- Add/update/delete food items
- View all orders
- Update order status

🚚 Delivery Personnel
- Login to view assigned orders
- Update order delivery status

---

🧩 Project Structure

```

Food-Delivery-App/
│
├── admin/     # React-based Admin Panel
├── backend/   # Node.js + Express backend
├── frontend/  # React-based Customer Interface
├── .gitignore
├── README.md
└── package.json

````

---

⚙️ Tech Stack

- **Frontend**: React.js, Axios, React Router, Toastify
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Payments**: Razorpay
- **Database**: MongoDB (Local or MongoDB Atlas)
- **Testing**: Postman

---

🔐 API Endpoints (Sample)

🔸 Cart Routes
- `GET /cart` - Get cart contents
- `POST /cart` - Add to cart
- `DELETE /cart` - Clear cart

🔸 Food Routes
- `GET /foods` - Get all food items
- `POST /foods` - Add new food
- `DELETE /foods/:id` - Delete food item

🔸 Order Routes
- `GET /orders` - Get all orders
- `POST /orders` - Create new order
- `PUT /orders/:id` - Update status

🔸 Auth Routes
- `POST /login`
- `POST /register`
- `POST /logout`

---

 🖥️ Setup Instructions

🧪 Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Razorpay account (for payments)

📥 Clone the Repository

```bash
git clone https://github.com/Asm2242/apnabaithakvegeterian.git
cd apnabaithakvegeterian
```

 🚀 Backend Setup

```bash
cd backend
npm install
cp .envtemplate .env   # Windows: Copy-Item .envtemplate .env
# Edit .env: MONGO_URI, JWT_SECRET, OTP_PEPPER, Razorpay keys, CORS_ORIGINS
npm start
```

🌐 Frontend Setup

```bash
cd frontend
npm install
cp .envtemplate .env   # Windows: Copy-Item .envtemplate .env
# Edit .env: VITE_API_URL, VITE_RAZORPAY_KEY_ID, VITE_FIREBASE_*
npm run dev
```

🛠️ Admin Panel Setup

```bash
cd admin
npm install
# Set VITE_API_URL (same as frontend) then:
npm run dev
```

🚴 Rider Panel Setup

```bash
cd rider
npm install
npm run dev
```

> Never commit `.env` files. On Vercel, add the same variables in
> **Project Settings → Environment Variables** for each app.

---

📸 Screenshots

* ✅ Responsive Design
* ✅ Clean Admin Dashboard
* ✅ Integrated Razorpay UI
* ✅ Real-Time Order List and Status

---

🚧 Limitations

* No live GPS tracking for delivery
* No ratings/reviews system
* Single admin role; no multi-role access
* Only Razorpay supported as a payment gateway

---

🚀 Future Scope

* Live map tracking using Google Maps API
* Customer reviews and ratings
* SMS/email notifications
* Multiple admin roles (Manager, Super Admin)
* Coupons and discounts
* Real-time chat with delivery personnel

---

🤝 Contributions

Pull requests and suggestions are welcome!
Please open an issue first to discuss what you would like to change.

---

🧾 License

This project is for academic and learning purposes only.

---

👨‍💻 Developed By

**Rahul Kumar**
MCA Graduate | MERN Developer
