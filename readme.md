# 🚀 Simple Demo: Laravel + Inertia + React

This is a simple demonstration to show how **Laravel (backend)** and **Inertia + React (frontend)** work together to build a modern fullstack application without using REST API or manual JSON responses.

---

## ✅ Requirements

- PHP 8.2 or higher
- Composer
- Node.js & npm
- MySQL / MariaDB
- Git

---

## 🔧 Installation

### 1. Clone Repository

```bash
git clone https://github.com/matiusnugroho/laravel-inertia-react.git
cd laravel-inertia-react
```

### 2. Install Dependencies

```bash
composer install
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
php artisan key:generate
```

Set your database configuration in `.env`.

### 4. Run Database Migration

```bash
php artisan migrate
```

### 5. Seed Dummy Data (Optional)

```bash
php artisan db:seed
```

### 6. Run Development Server

```bash
composer run dev
```

Your application will be available at `http://localhost:8000`

---

## 📂 Project Structure

```
laravel-inertia-react/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   └── Models/
├── resources/
│   └── js/
│       ├── Components/
│       ├── Layouts/
│       └── Pages/
├── routes/
│   └── web.php
├── database/
│   └── migrations/
└── public/
```

---

## 🎯 Key Features

- **Laravel** as backend framework
- **Inertia.js** as the glue between Laravel and React
- **React** for building interactive UI
- **Tailwind CSS** for styling
- No need for REST API endpoints
- Server-side routing with client-side rendering

---

## 📖 How It Works

1. **Laravel handles routing** in `routes/web.php`
2. **Controllers return Inertia responses** instead of JSON
3. **Inertia passes data to React components** as props
4. **React renders the UI** on the client side
5. **Form submissions go back to Laravel** through Inertia

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `composer run dev` | Start Laravel development server |
| `npm run dev` | Start Vite development server |
| `npm run build` | Build assets for production |
| `php artisan migrate` | Run database migrations |
| `php artisan db:seed` | Seed database with dummy data |

---

## 📝 License

This project is open-sourced software licensed under the MIT license.

---

## 👨‍💻 Author

Created by **Matius Nugroho**

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!