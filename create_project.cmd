@echo off
echo Creating static project...

REM ===== MAIN FILES =====
type nul > index.html
type nul > about.html
type nul > contact.html
type nul > apply-mentor.html
type nul > apply-mentee.html
type nul > news.html
type nul > news-spring-2025-intake.html
type nul > news-partnership-company-x.html
type nul > news-success-story-nver.html

REM ===== ASSETS =====
mkdir assets
mkdir assets\js
mkdir assets\css

type nul > assets\js\app.js
type nul > assets\css\custom.css

echo Done! Static site structure created.
pause
