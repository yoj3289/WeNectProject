# 배포에 필요한 정보 체크리스트

이 문서는 실제 배포에 필요한 모든 정보를 정리합니다.

---

## ✅ 현재 보유 중인 정보

### Jenkins
- [x] Jenkins 주소 (URL)
- [x] Jenkins 아이디
- [x] Jenkins 비밀번호

### Oracle Cloud
- [x] Public Key (SSH 접속용)
- [x] Private Key (SSH 접속용)

---

## ❓ 추가로 필요한 정보

### 1. Oracle Cloud 상세 정보

#### 1-1. Tenancy 정보
```
Oracle Cloud Console → 프로필(우측 상단) → Tenancy: <이름> 클릭
```

**필요한 것**:
- [ ] **Tenancy OCID** (ocid1.tenancy.oc1..aaaaa...)
- [ ] **Object Storage Namespace** (예: axabcdefgh)
- [ ] **Region** (예: ap-seoul-1, ap-chuncheon-1, us-ashburn-1)

**확인 방법**:
```
Oracle Cloud Console
→ 우측 상단 프로필 아이콘 클릭
→ "Tenancy: <이름>" 클릭
→ "Object Storage Namespace" 복사
→ "Home Region" 확인
```

#### 1-2. OKE (Kubernetes) 클러스터
- [ ] **OKE 클러스터가 생성되어 있습니까?**
  - [ ] 예 → 클러스터 이름: _______________
  - [ ] 아니오 → 새로 생성 필요

**확인 방법**:
```
Oracle Cloud Console
→ 좌측 메뉴
→ Developer Services
→ Kubernetes Clusters (OKE)
```

#### 1-3. Docker Registry (OCIR)
- [ ] **Container Registry 사용 계획**
  - [ ] OCIR (Oracle Container Image Registry) 사용
  - [ ] Docker Hub 사용
  - [ ] 기타: _______________

**OCIR 사용 시 필요**:
- [ ] **Auth Token** (Docker 로그인용)

**Auth Token 생성 방법**:
```
Oracle Cloud Console
→ 우측 상단 프로필 아이콘
→ My profile
→ Auth tokens (좌측 메뉴)
→ Generate token
→ 복사하여 안전한 곳에 보관 (다시 볼 수 없음!)
```

#### 1-4. 도메인
- [ ] **도메인을 보유하고 계십니까?**
  - [ ] 예 → 도메인 이름: _______________
  - [ ] 아니오 → IP 주소로 접근

---

### 2. 데이터베이스 정보

#### 옵션 A: Kubernetes 내부 MySQL 사용 (권장)
- [x] k8s에 MySQL 배포 (이미 설정됨)
- [x] 비밀번호는 이미 생성됨 (.env 파일 참조)

#### 옵션 B: Oracle MySQL Database Service 사용
- [ ] Oracle Cloud MySQL Database Service
- [ ] 연결 정보:
  - Host: _______________
  - Port: _______________
  - Database: _______________
  - Username: _______________
  - Password: _______________

---

### 3. Jenkins 상세 정보

- [ ] **Jenkins가 설치된 위치는?**
  - [ ] Oracle Cloud VM에 설치됨
  - [ ] 외부 서버 (어디: _______________)
  - [ ] 로컬 컴퓨터

- [ ] **Jenkins에서 Oracle Cloud에 접근 가능합니까?**
  - [ ] 예
  - [ ] 아니오 → 네트워크 설정 필요

---

## 📊 정보 정리표

아래 표에 정보를 기입해주세요:

| 항목 | 값 | 확인 |
|------|-----|------|
| **Oracle Cloud** | | |
| Tenancy OCID | ocid1.tenancy.oc1.._____________ | [ ] |
| Object Storage Namespace | _____________ | [ ] |
| Region (리전) | _____________ | [ ] |
| Auth Token | _____________ | [ ] |
| **Kubernetes (OKE)** | | |
| 클러스터 생성 여부 | [ ] 예 [ ] 아니오 | [ ] |
| 클러스터 이름 | _____________ | [ ] |
| **도메인** | | |
| 도메인 보유 | [ ] 예 [ ] 아니오 | [ ] |
| 도메인 이름 | _____________ | [ ] |
| **Jenkins** | | |
| Jenkins URL | _____________ | [x] |
| Jenkins 위치 | [ ] Oracle Cloud [ ] 외부 [ ] 로컬 | [ ] |
| **Database** | | |
| 사용할 DB | [ ] k8s MySQL [ ] Oracle MySQL | [ ] |

---

## 🎯 다음 단계

### 시나리오 1: OKE 클러스터가 이미 있는 경우
1. kubeconfig 다운로드
2. kubectl 설정
3. Jenkins에서 Kubernetes 접근 설정
4. 배포 시작

### 시나리오 2: OKE 클러스터가 없는 경우
1. OKE 클러스터 생성 (15분 소요)
2. kubeconfig 다운로드
3. kubectl 설정
4. Nginx Ingress Controller 설치
5. 배포 시작

---

## 💡 지금 확인해주세요

아래 명령어로 현재 상태를 확인해보세요:

### Oracle Cloud CLI 설치 여부
```bash
oci --version
```

### kubectl 설치 여부
```bash
kubectl version --client
```

### Docker 설치 여부
```bash
docker --version
```

---

## 📞 다음 단계

위의 정보를 확인하신 후, 다음 중 하나를 알려주세요:

1. **OKE 클러스터가 있어요**
   → "클러스터 이름은 _____입니다"

2. **OKE 클러스터가 없어요**
   → "클러스터를 새로 만들어야 해요"

3. **도메인이 있어요**
   → "도메인은 _____입니다"

4. **도메인이 없어요**
   → "IP 주소로 접근하고 싶어요"

5. **모르겠어요**
   → "하나씩 같이 확인해주세요"

알려주시면 그에 맞게 설정을 도와드리겠습니다!
