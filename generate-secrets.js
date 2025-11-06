#!/usr/bin/env node

/**
 * 배포용 Secret 생성 도구
 *
 * 사용법:
 * node generate-secrets.js
 */

const crypto = require('crypto');

console.log('='.repeat(60));
console.log('WeNect 프로젝트 Secret 생성 도구');
console.log('='.repeat(60));
console.log();

// 1. JWT Secret 생성 (Base64, 64바이트)
const jwtSecret = crypto.randomBytes(64).toString('base64');
console.log('📝 JWT Secret (로그인 토큰용):');
console.log(jwtSecret);
console.log();

// 2. MySQL 비밀번호 생성 (영문+숫자+특수문자, 24자)
const mysqlPassword = crypto.randomBytes(18).toString('base64').replace(/[+/=]/g, (c) => {
  return c === '+' ? '@' : c === '/' ? '#' : '!';
});
console.log('🔐 MySQL Root Password (데이터베이스용):');
console.log(mysqlPassword);
console.log();

console.log('='.repeat(60));
console.log('💡 사용 방법:');
console.log('='.repeat(60));
console.log();
console.log('1. 로컬 테스트용 (.env 파일):');
console.log('---');
console.log(`MYSQL_ROOT_PASSWORD=${mysqlPassword}`);
console.log(`JWT_SECRET=${jwtSecret}`);
console.log();

console.log('2. Kubernetes Secret 생성 (프로덕션):');
console.log('---');
console.log('kubectl create secret generic wenect-secret \\');
console.log(`  --from-literal=MYSQL_ROOT_PASSWORD='${mysqlPassword}' \\`);
console.log(`  --from-literal=DB_PASSWORD='${mysqlPassword}' \\`);
console.log(`  --from-literal=JWT_SECRET='${jwtSecret}' \\`);
console.log('  --from-literal=MYSQL_DATABASE=mydb \\');
console.log('  --from-literal=DB_USERNAME=root \\');
console.log('  -n wenect');
console.log();

console.log('⚠️  주의사항:');
console.log('- 위 비밀번호들을 안전한 곳에 보관하세요');
console.log('- Git에 절대 커밋하지 마세요');
console.log('- 프로덕션에서는 위 값들을 복사해서 사용하세요');
console.log();
