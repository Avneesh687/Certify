# CERTIFY — System Design & Technical Architecture Document

## 1. Executive Summary
**Certify** is an enterprise-grade, full-stack MERN (MongoDB, Express.js, React, Node.js) credential generation and verification platform. It solves the critical bottlenecks in traditional certification processes: slow manual creation, high error rates, delivery failures, and rampant credential forgery.

---

## 2. High-Level System Architecture

```
+-------------------------------------------------------------------------+
|                              REACT FRONTEND                             |
|  (Vite + Tailwind CSS + Lucide Icons + React Router + Axios Client)     |
|                                                                         |
|  [Public Verify Page]   [Bulk Upload Wizard]   [Admin Dashboard]        |
+------------------------------------+------------------------------------+
                                     |  HTTP REST / JSON / FormData
                                     v
+-------------------------------------------------------------------------+
|                            EXPRESS BACKEND                              |
|                                                                         |
|  [Auth Middleware] ---> [Role Guard] ---> [API Key Authenticator]       |
|                                                                         |
|  +---------------------+  +--------------------+  +------------------+  |
|  | File Parsing Engine |  | PDF Vector Engine  |  | Email Dispatcher |  |
|  | (csv-parser + xlsx) |  | (pdf-lib + canvas) |  | (nodemailer)     |  |
|  +---------------------+  +--------------------+  +------------------+  |
+------------------------------------+------------------------------------+
                                     |  Mongoose ODM
                                     v
+-------------------------------------------------------------------------+
|                           DATABASE & STORAGE                            |
|                                                                         |
|  [MongoDB]: Users, Certificates, Batches, Templates                     |
|  [Storage]: Static Local File Engine (/uploads/certificates)            |
+-------------------------------------------------------------------------+
```

---

## 3. Comprehensive Tool & Technology Mapping

| Tool / Technology | Category | Where Used in Project | Purpose & Implementation Details |
| :--- | :--- | :--- | :--- |
| **React 18** | Frontend Framework | `client/src/App.jsx`, `client/src/pages/*` | Component-based single page application (SPA) rendering UI, wizards, and dashboards. |
| **Vite** | Build Tool & Dev Server | `client/vite.config.js` | Ultra-fast HMR and production bundle optimization. Proxies API requests to backend port 5000. |
| **Tailwind CSS** | Styling & Design System | `client/src/index.css`, `tailwind.config.js` | Glassmorphism surfaces, dark mode palette, responsive layouts, and gradient buttons. |
| **Lucide React** | Iconography | `client/src/components/*`, `pages/*` | Crisp vector icons for UI actions, status badges, and dashboard widgets. |
| **Canvas Confetti** | UX / Animations | `client/src/pages/BulkGeneratorPage.jsx` | Celebratory visual confetti animation triggered upon successful batch generation. |
| **Axios** | HTTP Client | `client/src/api/axiosInstance.js` | Centralized API client with automatic JWT token attachment in `Authorization: Bearer <token>`. |
| **Node.js + Express** | Backend Server | `server/server.js`, `server/routes/*` | High-throughput REST API routing, file handling, and business logic execution. |
| **MongoDB + Mongoose** | Database & ODM | `server/models/*.js` | Schemas for `User`, `Certificate`, `GenerationBatch`, and `Template` with indexed lookups. |
| **pdf-lib** | PDF Vector Engine | `server/utils/pdfGenerator.js` | Renders landscape A4 vector PDFs, embeds custom fonts, dynamic coordinates, and QR images. |
| **canvas (Node Canvas)** | Graphic Rendering | `server/utils/pdfGenerator.js` | Pre-renders high-res decorative certificate background with gold borders and official seal. |
| **qrcode** | Cryptographic QR | `server/utils/pdfGenerator.js` | Generates verification QR PNG data buffer linking to public URL `/verify/:certificateId`. |
| **xlsx** | Spreadsheet Parser | `server/utils/fileParser.js` | Parses native `.xlsx` and `.xls` Microsoft Excel workbooks into normalized JSON rows. |
| **csv-parser** | Stream CSV Parser | `server/utils/fileParser.js` | High-speed streaming parser for `.csv` files. |
| **Nodemailer** | Email Engine | `server/utils/mailer.js` | Dispatches personalized HTML emails with attached PDF certificates via SMTP / Ethereal fallback. |
| **jsonwebtoken (JWT)** | Authentication | `server/middleware/authMiddleware.js` | Stateless session management with 7-day expiration and role payload verification. |
| **bcryptjs** | Security & Hashing | `server/models/User.js` | 10-round salted password hashing before persisting user credentials. |
| **Multer** | Multipart Form Data | `server/routes/certificateRoutes.js` | Handles disk storage for uploaded CSV and Excel recipient files with 10MB size limit. |
| **MongoDB Memory Server**| Zero-Config Fallback| `server/server.js` | Auto-launches in-memory database if local MongoDB daemon is offline during testing. |

---

## 4. Key Architectural Flows

### A. Bulk Certificate Generation Pipeline
1. **File Upload:** User uploads `.csv` or `.xlsx` file via React wizard.
2. **Header Normalization:** Backend parses columns, strips whitespace, and extracts keys (`Name`, `Email`, `Course`, `Date`).
3. **Dynamic Field Mapping:** User maps arbitrary column names to standard certificate placeholders.
4. **Live PDF Preview:** Backend generates single-row preview PDF rendered in an embedded iframe.
5. **Batch Generation Execution:**
   - Generates unique ID (`CERT-<TIMESTAMP>-<UUID>`).
   - Encodes public verification URL into scannable QR Code.
   - Vector PDF generated via `pdf-lib` and saved to `/uploads/certificates/`.
   - Automated email dispatched with PDF attachment via Nodemailer.
   - Batch database record updated with real-time delivery counts.

### B. Anti-Forgery Public Verification Pipeline
1. Anyone accesses `/verify/:certificateId` or scans the certificate's QR code.
2. Express controller performs indexed query on `Certificate.findOne({ certificateId })`.
3. If authentic, returns verified status badge, recipient metadata, and streams verified PDF directly from secure storage.
4. If modified, revoked, or non-existent, system flags fraudulent/invalid record.

---

## 5. Security & Governance Matrix
- **Role-Based Access Control (RBAC):** Admin-only endpoints (`/api/admin/*`) guarded by `isAdmin` middleware.
- **Certificate Revocation Engine:** Admins can instantly toggle certificate status (`valid` vs `revoked`).
- **Developer API Authentication:** Public/private programmatic endpoints secured by `X-API-KEY` header.
- **Account State Verification:** Deactivated accounts are instantly blocked across all JWT and API key routes.
