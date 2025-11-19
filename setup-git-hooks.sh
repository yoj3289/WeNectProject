#!/bin/bash

# Git hooks 설치 스크립트

echo "🔧 Installing Git hooks..."

# Git hooks 디렉토리로 복사
cp .githooks/post-merge .git/hooks/post-merge

# 실행 권한 부여
chmod +x .git/hooks/post-merge

echo "✅ Git hooks installed successfully!"
echo "📌 Now 'npm install' will run automatically after 'git pull' if package files changed."
