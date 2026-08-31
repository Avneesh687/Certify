# Certify

**Certify** is a MERN Stack web application for generating, sending, and verifying digital certificates in bulk.

## 🚀 Features

* 📄 Generate certificates in bulk
* 📊 Upload CSV and Excel files
* 🎨 Dynamic certificate generation
* 🔳 QR code-based verification
* 📧 Email certificates automatically
* 🔐 JWT-based authentication
* 👤 User and Admin roles
* 🚫 Certificate revocation
* 🔎 Public certificate verification
* 🔑 Developer API for certificate generation
* 📊 Admin dashboard

## 🛠️ Tech Stack

**Frontend**

* React
* Vite
* Tailwind CSS
* Axios
* React Router

**Backend**

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcryptjs

**Other Tools**

* pdf-lib
* Node Canvas
* QRCode
* Multer
* XLSX
* csv-parser
* Nodemailer

## 📁 Project Structure

```text
certify-mern/
│
├── client/          # React frontend
│
├── server/          # Node.js + Express backend
│
├── sample_recipients.csv
├── sample_recipients.xlsx
├── docker-compose.yml
├── .env.sample
└── README.md
```

## ⚡ Installation

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd certify-mern
```

### 2. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `server` folder and add your required configuration.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

### 4. Start Backend

```bash
cd server
npm start
```

Backend will run on:

```text
http://localhost:5000
```

### 5. Start Frontend

Open another terminal:

```bash
cd client
npm run dev
```

Frontend will run on:

```text
http://localhost:5173
```

## 🔄 How It Works

```text
CSV / Excel
     ↓
Upload Recipients
     ↓
Map Certificate Fields
     ↓
Generate Certificate
     ↓
Generate QR Code
     ↓
Send Certificate by Email
     ↓
Verify Certificate Online
```

## 🔎 Certificate Verification

Every certificate gets a unique certificate ID and QR code.

Users can scan the QR code or open the verification URL to check whether the certificate is valid or revoked.

Example:

```text
http://localhost:5173/verify/CERT-XXXXXX
```

## 📡 API

Certify also provides a REST API for programmatically generating certificates.

Example:

```http
POST /api/v1/certificates/issue
```

Authentication:

```http
X-API-KEY: your_api_key
```

## 🔐 Security

* JWT authentication
* Password hashing with bcrypt
* Role-based access control
* API key authentication
* Certificate revocation
* Protected admin routes

## 📌 Future Improvements

* Cloud storage
* More certificate templates
* Digital signatures
* Advanced analytics
* Multi-organization support

## 👨‍💻 Author

**Avneesh Sharma**

---

⭐ If you find this project useful, consider giving it a star!
