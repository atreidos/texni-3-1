@echo off
chcp 65001 >nul
echo ========================================
echo DocFlow — установка и запуск
echo ========================================
echo.

:: Проверка Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не найден.
    echo Установите Node.js: https://nodejs.org/
    echo Рекомендуется LTS-версия.
    pause
    exit /b 1
)

echo Node.js: 
node -v
echo npm:
npm -v
echo.

:: Установка зависимостей во frontend
echo Установка зависимостей в frontend...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    echo [ОШИБКА] npm install не удался.
    pause
    exit /b 1
)

echo.
echo Зависимости установлены.
echo Запуск dev-сервера...
echo.

:: Запуск dev
cd /d "%~dp0"
call npm run dev

pause
