# 🍽️ Kusina ni Lola — Restaurant Website

A dynamic full-stack restaurant website built with HTML, CSS, JavaScript, PHP, and MySQL.

## Features

- Dynamic menu loaded from database
- Online table reservation system
- Contact form
- REST API with versioning (/api/v1/)
- Mobile responsive

## Tech Stack

| Layer           | Technology                          |
| --------------- | ----------------------------------- |
| Frontend        | HTML5, CSS3, JavaScript (Fetch API) |
| Backend         | PHP 8.2                             |
| Database        | MySQL via PDO                       |
| Local Dev       | XAMPP                               |
| Version Control | Git + GitHub                        |

## Local Setup

1. Clone this repo into `C:\xampp\htdocs\kusina-ni-lola\`
2. Copy `.env.example` to `.env` and fill in your credentials
3. Import `kusina_db.sql` into phpMyAdmin
4. Start Apache and MySQL in XAMPP
5. Visit `http://localhost/kusina-ni-lola`

## API Endpoints

| Method | Endpoint                        | Description          |
| ------ | ------------------------------- | -------------------- |
| GET    | /api/v1/menu.php                | Get all menu items   |
| GET    | /api/v1/menu.php?category=mains | Filter by category   |
| POST   | /api/v1/reservations.php        | Submit a reservation |
| POST   | /api/v1/contact.php             | Submit contact form  |

## Version History

- v1.0.0 — Initial release (menu, reservations, contact)
- v2.0.0 — Planned: online ordering system

## Developer

Built by Mark Angelo — Freelance Web Developer 🇵🇭
GitHub: https://github.com/nonomarkangelod-creator
