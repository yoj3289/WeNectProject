# Git hooks 설치 스크립트 (PowerShell)

Write-Host "🔧 Installing Git hooks..." -ForegroundColor Cyan

# Git hooks 디렉토리로 복사
Copy-Item -Path ".githooks\post-merge" -Destination ".git\hooks\post-merge" -Force

Write-Host "✅ Git hooks installed successfully!" -ForegroundColor Green
Write-Host "📌 Now 'npm install' will run automatically after 'git pull' if package files changed." -ForegroundColor Yellow
