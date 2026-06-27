# 🌾 FarmFusion: Full-Stack Smart Agriculture Ecosystem

**FarmFusion** is a modern, multilingual platform designed to empower farmers with data-driven insights. By combining AI-driven crop recommendations, real-time weather risk analysis, and voice-enabled assistance, it bridges the gap between complex agricultural science and everyday farming.

---

## 🚀 Key Features

* 🤖 **Adiii AI Chatbot**
  A multilingual voice assistant supporting Hindi, Marathi, Bengali, Tamil, and English using the Web Speech API.

* 🌾 **Smart Crop Recommendation**
  Analyzes soil NPK levels, pH, and environmental factors to suggest the most profitable crops.

* 📈 **Yield Prediction**
  Uses Recharts to visualize and predict harvest totals based on historical and real-time data.

* ⚠️ **Weather Guard**
  Identifies risks like frost, humidity, and extreme weather, providing actionable alerts.

* 🧪 **Soil Analysis Dashboard**
  Monitors soil chemical and physical properties to optimize fertilizer usage.

* 🇮🇳 **Government Schemes Hub**
  Helps farmers discover and apply for agricultural subsidies and insurance schemes.

---

## 🛠️ Tech Stack

| Category      | Technology                 | Purpose                                |
| ------------- | -------------------------- | -------------------------------------- |
| Frontend      | React 18, TypeScript       | Scalable and type-safe UI              |
| Build Tool    | Vite                       | Fast development and optimized builds  |
| Database      | Supabase (PostgreSQL, RLS) | Secure data storage and authentication |
| Styling       | Tailwind CSS               | Responsive glassmorphism UI            |
| Animations    | Framer Motion              | Smooth UI interactions                 |
| UI Components | Radix UI                   | Accessible UI primitives               |
| Icons         | Lucide React               | Clean and modern icon set              |

---

## 🏗️ Architecture & Logic

* 🔹 **Custom Hooks**
  Modular hooks like `useAuth`, `useLanguage`, and `useMobile` for clean state management and scalability.

* 🔹 **Headless UI Design**
  Built using Radix UI primitives to ensure accessibility for users with varying digital literacy.

* 🔹 **Real-Time Feedback System**
  Integrated Sonner and Toast notifications for instant alerts (weather updates, system changes).

---

## 📦 Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/farmfusion.git
cd farmfusion
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Setup environment variables

Create a `.env` file in the root directory and add:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4️⃣ Run the development server

```bash
npm run dev
```

---

## 💡 Future Enhancements

* 📱 Mobile app (React Native)
* 🤖 ML-based advanced crop prediction
* 📡 IoT integration for real-time soil data
* 🛰️ Satellite/weather API integration

---

## 👨‍💻 Author

**Aditya Gupta**

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
