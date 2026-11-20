# 🎋 BaashBot AI — Full-Stack Cross-Platform PWA (Render + Vercel)

**iPhone (iOS), Android, এবং PC** — সব ডিভাইসে ইনস্টলযোগ্য রিয়েল অ্যাপ!
- **Backend (`backend/`)**: Python FastAPI → **Render**-এ ডিপ্লয় (তোমার `GEMINI_API_KEY` এখানে সম্পূর্ণ নিরাপদ থাকবে)।
- **Frontend (`frontend/`)**: Vite + React + Tailwind + PWA → **Vercel**-এ ডিপ্লয় (iOS Safe-Area, Touch + Mouse + Keyboard গেম, Service Worker, PNG মুক্তিপত্র ও বন্ধুকে ডাইরেক্ট চ্যালেঞ্জ লিংক)।

---

## ১. GitHub-এ পুশ করো
```bash
git init
git add .
git commit -m "Initial BaashBot AI Full-Stack PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/baashbot-ai.git
git push -u origin main
```

---

## ২. Backend ডিপ্লয় করো (Render)
1. [render.com](https://render.com) → **New +** → **Web Service** → তোমার GitHub repo সিলেক্ট করো।
2. নিচের সেটিংস দাও:
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Environment Variables** যোগ করো:
   - `GEMINI_API_KEY` = তোমার Google AI Studio API Key (অপশনাল — না দিলেও স্মার্ট বাংলা ফলব্যাক চলবে)
   - `ALLOWED_ORIGINS` = `*` (পরে তোমার Vercel URL বসিয়ে দিও)
4. Deploy হয়ে গেলে Render-এর URL কপি করো (যেমন: `https://baashbot-ai-backend.onrender.com`)।

---

## ৩. Frontend ডিপ্লয় করো (Vercel)
1. [vercel.com](https://vercel.com) → **Add New Project** → একই GitHub repo সিলেক্ট করো।
2. নিচের সেটিংস দাও:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
3. **Environment Variables** যোগ করো:
   - `VITE_API_URL` = তোমার Render Backend URL (যেমন: `https://baashbot-ai-backend.onrender.com`)
4. **Deploy** বাটনে ক্লিক করো! ৩০ সেকেন্ডে তোমার লাইভ HTTPS অ্যাপ রেডি।

---

## ৪. সব ডিভাইসে "অ্যাপ" হিসেবে ইনস্টল করো

### 📱 iPhone (iOS)-এ অ্যাপ হিসেবে ডাউনলোড/ইনস্টল:
1. তোমার Vercel লিংকটি iPhone-এর **Safari** ব্রাউজারে ওপেন করো (Chrome নয়, Safari)।
2. স্ক্রিনের নিচের **Share (↑)** বাটনে ট্যাপ করো।
3. নিচে স্ক্রল করে **Add to Home Screen** → **Add** ট্যাপ করো।
4. ব্যাস! Home Screen-এ কাস্টম **BaashBot AI** আইকন চলে আসবে — ওপেন করলে ব্রাউজারের অ্যাড্রেস বার ছাড়াই একদম নেটিভ iPhone অ্যাপের মতো ফুল-স্ক্রিন চলবে!

### 🤖 Android-এ ইনস্টল:
- Chrome-এ লিংক ওপেন করলেই উপরে **Install** ব্যানার দেখাবে → এক ট্যাপেই হোম স্ক্রিনে অ্যাপ ইনস্টল হয়ে যাবে।

### 💻 PC (Windows / Mac)-এ ইনস্টল:
- Chrome বা Edge-এ লিংক ওপেন করে অ্যাড্রেস বারের ডানদিকের **Install App (⊕)** আইকনে ক্লিক করো → ডেস্কটপ অ্যাপ হিসেবে চলবে (কীবোর্ড Arrow / WASD + মাউস সাপোর্টসহ)।

---

## ৫. লোকাল টেস্ট (PC-তে)
**Terminal 1 (Backend):**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```
