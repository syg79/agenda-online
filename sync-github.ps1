# Script de sincronizacao automática com GitHub
$projectPath = "D:\PROJETO\Agenda online"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "[*] Iniciando sincronizacao..." -ForegroundColor Cyan
Set-Location $projectPath

# Pull das mudanças remotas
Write-Host "[DOWN] Puxando mudanças remotas..." -ForegroundColor Yellow
git pull origin main 2>$null

# Adicionar todos os arquivos
Write-Host "[ADD] Adicionando arquivos..." -ForegroundColor Yellow
git add .

# Verificar se há mudanças
$status = git status --porcelain
if ($status) {
    Write-Host "[SAVE] Commitando mudanças..." -ForegroundColor Yellow
    git commit -m "Auto-sync: $timestamp"
    
    # Push
    Write-Host "[PUSH] Fazendo push para GitHub..." -ForegroundColor Yellow
    git push origin main
    
    Write-Host "[OK] Sincronizacao concluida com sucesso!" -ForegroundColor Green
} else {
    Write-Host "[INFO] Nenhuma mudanca para sincronizar" -ForegroundColor Gray
}
