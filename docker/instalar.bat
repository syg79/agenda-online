@echo off
echo =============================================
echo   Browserless - Instalacao Automatica
echo   Vitrine do Imovel - Scraping Engine
echo =============================================
echo.

:: Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Docker nao encontrado!
    echo Instale o Docker Desktop: https://www.docker.com/products/docker-desktop/
    echo Apos instalar, reinicie o PC e rode este script novamente.
    pause
    exit /b 1
)

echo [OK] Docker encontrado.
echo.

:: Check Docker running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Docker nao esta rodando!
    echo Abra o Docker Desktop e espere iniciar, depois rode este script novamente.
    pause
    exit /b 1
)

echo [OK] Docker esta rodando.
echo.
echo Baixando imagem do Browserless (pode levar alguns minutos)...
echo.

:: Navigate to script directory
cd /d "%~dp0"

:: Start container
docker compose up -d

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao iniciar o container.
    pause
    exit /b 1
)

echo.
echo =============================================
echo   SUCESSO! Browserless rodando.
echo.
echo   URL local:  ws://localhost:3033
echo   URL rede:   ws://%COMPUTERNAME%:3033
echo   Token:      vitrine2026
echo.
echo   Teste: http://localhost:3033/json/version?token=vitrine2026
echo =============================================
echo.
echo O container reinicia automaticamente com o PC.
echo Para parar: docker compose down
echo.
pause
