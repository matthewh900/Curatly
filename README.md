# 🖼️ Curatly

An interactive web application for creating and managing art exhibitions, built with **Next.js** and **Supabase**.

Users can log in, curate exhibitions with artworks from museum APIs, and share them with others. Built with modular, component-based architecture and secure, user-level access.

---

## 🚀 Features

- 🔐 Supabase Authentication (sign up / login)
- 🖼️ Curate exhibitions with artworks from museum APIs (e.g. MET, AIC)
- ✍️ Edit exhibition name and description
- ➕ Add / remove artworks from exhibitions
- 👤 Profile page with user’s saved exhibitions
- 📱 Responsive design with CSS Modules

---

## 🧱 Tech Stack

- **Framework:** Next.js 13+ (App Router)
- **Database & Auth:** Supabase
- **Language:** TypeScript
- **Styling:** CSS Modules
- **Deployment:** Vercel

---

## 🛠️ Getting Started

### 1. Clone the Repository

git clone https://github.com/matthewh900/Curatly.git
cd Curatly

## 2. Install dependencies

npm install

## 3. Configure environment variables

Create a .env.local file in the root of your project and add the following:

NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

## 4. Run the development server

npm run dev

## 🔐 Supabase Setup

Make sure your Supabase database includes the following:

Tables:

exhibitions - id, user_id, name, description
favourites - id, provider, title, artist, image_url, artwork_url
exhibition_favourites (join table) - exhibition_id, favourite_id, position

Row-Level Security (RLS):

Apply RLS policies to restrict users to their own exhibitions and favourites.

## 📌 Notes

    - Uses a client-side Supabase client (supabaseClient.ts) for browser interactions
    - Uses a server-side Supabase client (supabaseServerClient.ts) with the service role key for server data fetching
