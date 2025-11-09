# Jenkinsfile 수정 가이드

## 🎯 수정해야 할 위치

현재 Jenkinsfile은 간단한 버전입니다. Docker 이미지 빌드 및 Kubernetes 배포를 위해서는 **환경변수 섹션**을 추가해야 합니다.

---

## 📍 수정할 2곳

### 현재 Jenkinsfile 구조
```groovy
pipeline {
    agent any

    stages {
        stage('Checkout') {
            ...
        }
        stage('Build') {
            ...
        }
    }
}
```

### 수정 후 구조
```groovy
pipeline {
    agent any

    environment {  // ← 여기를 추가!
        DOCKER_REGISTRY = 'your-region.ocir.io'      // ← 수정 위치 1
        DOCKER_NAMESPACE = 'your-tenancy-namespace'  // ← 수정 위치 2
        ...
    }

    stages {
        ...
    }
}
```

---

## 🔧 수정 방법

### 방법 1: 현재 Jenkinsfile 상단에 추가

**Line 2와 3 사이에 다음을 추가:**

```groovy
pipeline {
    agent any

    environment {
        // Docker Registry 설정 (Oracle Container Registry)
        DOCKER_REGISTRY = 'ap-seoul-1.ocir.io'           // ← 여기 수정! (Region)
        DOCKER_NAMESPACE = 'your-tenancy-namespace'      // ← 여기 수정! (Namespace)
        DOCKER_CREDENTIALS_ID = 'docker-registry-credentials'

        // 이미지 이름
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/wenect-backend"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/wenect-frontend"

        // Kubernetes 설정
        KUBECONFIG_CREDENTIALS_ID = 'kubeconfig'
        K8S_NAMESPACE = 'wenect'

        // Git 설정
        GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
    }

    stages {
        stage('Checkout') {
            ...
```

---

## 📝 구체적인 수정 예시

### 예시 1: 서울 리전 + Tenancy Namespace가 "axabcdefgh"인 경우

```groovy
environment {
    DOCKER_REGISTRY = 'ap-seoul-1.ocir.io'          // ✅ 서울
    DOCKER_NAMESPACE = 'axabcdefgh/wenect'          // ✅ 실제 Namespace
    ...
}
```

### 예시 2: 춘천 리전 + Tenancy Namespace가 "abcd1234"인 경우

```groovy
environment {
    DOCKER_REGISTRY = 'ap-chuncheon-1.ocir.io'      // ✅ 춘천
    DOCKER_NAMESPACE = 'abcd1234/wenect'            // ✅ 실제 Namespace
    ...
}
```

---

## 🌏 Region 코드표

| 리전명 | Region 코드 | Docker Registry |
|--------|-------------|-----------------|
| 서울 | ap-seoul-1 | ap-seoul-1.ocir.io |
| 춘천 | ap-chuncheon-1 | ap-chuncheon-1.ocir.io |
| 도쿄 | ap-tokyo-1 | ap-tokyo-1.ocir.io |
| 오사카 | ap-osaka-1 | ap-osaka-1.ocir.io |
| 뭄바이 | ap-mumbai-1 | ap-mumbai-1.ocir.io |
| 싱가포르 | ap-singapore-1 | ap-singapore-1.ocir.io |
| 시드니 | ap-sydney-1 | ap-sydney-1.ocir.io |

---

## 🔍 Tenancy Namespace 확인 방법

### Oracle Cloud Console에서 확인:

1. **Oracle Cloud Console 접속**
2. **우측 상단 프로필 아이콘** 클릭
3. **"Tenancy: <이름>"** 클릭
4. **"Object Storage Namespace"** 항목 찾기
5. **복사하기**

**예시:**
```
Object Storage Namespace: axabcdefgh
```

---

## 🎯 완성된 Jenkinsfile 예시

실제 값으로 수정한 전체 예시:

```groovy
pipeline {
    agent any

    environment {
        // Docker Registry 설정
        DOCKER_REGISTRY = 'ap-seoul-1.ocir.io'
        DOCKER_NAMESPACE = 'axabcdefgh/wenect'
        DOCKER_CREDENTIALS_ID = 'docker-registry-credentials'

        // 이미지 이름
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/wenect-backend"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/wenect-frontend"

        // Kubernetes 설정
        KUBECONFIG_CREDENTIALS_ID = 'kubeconfig'
        K8S_NAMESPACE = 'wenect'

        // Git 설정
        GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'chmod +x ./gradlew'
                    sh './gradlew clean build'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend/donation-platform') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    // Backend 이미지 빌드
                    dir('backend') {
                        sh "docker build -t ${BACKEND_IMAGE}:${GIT_COMMIT_SHORT} ."
                        sh "docker build -t ${BACKEND_IMAGE}:latest ."
                    }

                    // Frontend 이미지 빌드
                    dir('frontend/donation-platform') {
                        sh "docker build -t ${FRONTEND_IMAGE}:${GIT_COMMIT_SHORT} ."
                        sh "docker build -t ${FRONTEND_IMAGE}:latest ."
                    }
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS_ID) {
                        sh "docker push ${BACKEND_IMAGE}:${GIT_COMMIT_SHORT}"
                        sh "docker push ${BACKEND_IMAGE}:latest"
                        sh "docker push ${FRONTEND_IMAGE}:${GIT_COMMIT_SHORT}"
                        sh "docker push ${FRONTEND_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS_ID, variable: 'KUBECONFIG')]) {
                        sh """
                            kubectl apply -f k8s/namespace.yaml
                            kubectl apply -f k8s/configmap.yaml
                            kubectl apply -f k8s/mysql-deployment.yaml
                            kubectl apply -f k8s/backend-deployment.yaml
                            kubectl apply -f k8s/frontend-deployment.yaml
                            kubectl apply -f k8s/ingress.yaml

                            kubectl rollout status deployment/backend -n ${K8S_NAMESPACE}
                            kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE}
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
```

---

## ✅ 정리

### 수정해야 할 2곳:

1. **DOCKER_REGISTRY** (Line 6)
   ```groovy
   DOCKER_REGISTRY = 'ap-seoul-1.ocir.io'  // ← 여기! (리전에 맞게)
   ```

2. **DOCKER_NAMESPACE** (Line 7)
   ```groovy
   DOCKER_NAMESPACE = 'axabcdefgh/wenect'  // ← 여기! (실제 Namespace)
   ```

---

## 🚀 다음 단계

### 1. 정보 확인
- [ ] Oracle Cloud Region: _______________
- [ ] Tenancy Namespace: _______________

### 2. Jenkinsfile 수정
- [ ] DOCKER_REGISTRY 수정
- [ ] DOCKER_NAMESPACE 수정

### 3. Git 커밋
```bash
git add Jenkinsfile
git commit -m "chore: Update Jenkinsfile with Oracle Cloud configuration"
git push origin main
```

---

## 💬 도움이 필요하신가요?

**"Region과 Namespace를 알려드릴게요"**
→ 바로 Jenkinsfile을 수정해드립니다!

**"어떻게 확인하는지 모르겠어요"**
→ Oracle Cloud Console 화면 안내해드립니다!

**"일단 Jenkins 없이 배포하고 싶어요"**
→ kubectl 명령어로 수동 배포 가능합니다!
