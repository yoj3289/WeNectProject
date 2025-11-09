pipeline {
    agent any

    environment {
        // Docker Registry 설정 (Oracle Container Registry 또는 Docker Hub)
        DOCKER_REGISTRY = 'ap-chuncheon-1.ocir.io'  // Oracle Container Registry - 춘천 리전
        DOCKER_NAMESPACE = 'axabwwl6wx8h/wenect'
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
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm

                script {
                    env.BUILD_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"
                }
            }
        }

        stage('Build Backend') {
            steps {
                echo 'Building Spring Boot backend...'
                dir('backend') {
                    sh """
                        chmod +x gradlew
                        ./gradlew clean build -x test
                    """
                }
            }
        }

        stage('Build Frontend') {
            steps {
                echo 'Building React frontend...'
                dir('frontend/donation-platform') {
                    sh """
                        npm ci
                        npm run build
                    """
                }
            }
        }

        stage('Run Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh './gradlew test'
                        }
                    }
                    post {
                        always {
                            junit 'backend/build/test-results/test/*.xml'
                        }
                    }
                }

                stage('Frontend Tests') {
                    steps {
                        dir('frontend/donation-platform') {
                            sh 'npm run lint || true'
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        script {
                            dir('backend') {
                                docker.build("${BACKEND_IMAGE}:${BUILD_TAG}")
                                docker.build("${BACKEND_IMAGE}:latest")
                            }
                        }
                    }
                }

                stage('Build Frontend Image') {
                    steps {
                        script {
                            dir('frontend/donation-platform') {
                                docker.build("${FRONTEND_IMAGE}:${BUILD_TAG}")
                                docker.build("${FRONTEND_IMAGE}:latest")
                            }
                        }
                    }
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS_ID) {
                        // Backend 이미지 푸시
                        sh """
                            docker push ${BACKEND_IMAGE}:${BUILD_TAG}
                            docker push ${BACKEND_IMAGE}:latest
                        """

                        // Frontend 이미지 푸시
                        sh """
                            docker push ${FRONTEND_IMAGE}:${BUILD_TAG}
                            docker push ${FRONTEND_IMAGE}:latest
                        """
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS_ID, variable: 'KUBECONFIG')]) {
                        sh """
                            # Namespace 생성 (존재하지 않는 경우)
                            kubectl apply -f k8s/namespace.yaml

                            # ConfigMap 및 Secret 적용
                            kubectl apply -f k8s/configmap.yaml
                            kubectl apply -f k8s/secret.yaml

                            # MySQL 배포
                            kubectl apply -f k8s/mysql-deployment.yaml

                            # Backend 배포
                            kubectl set image deployment/backend backend=${BACKEND_IMAGE}:${BUILD_TAG} -n ${K8S_NAMESPACE} || \
                            kubectl apply -f k8s/backend-deployment.yaml

                            # Frontend 배포
                            kubectl set image deployment/frontend frontend=${FRONTEND_IMAGE}:${BUILD_TAG} -n ${K8S_NAMESPACE} || \
                            kubectl apply -f k8s/frontend-deployment.yaml

                            # Ingress 적용
                            kubectl apply -f k8s/ingress.yaml

                            # 배포 상태 확인
                            kubectl rollout status deployment/backend -n ${K8S_NAMESPACE} --timeout=5m
                            kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE} --timeout=5m
                        """
                    }
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS_ID, variable: 'KUBECONFIG')]) {
                        sh """
                            echo "=== Pods Status ==="
                            kubectl get pods -n ${K8S_NAMESPACE}

                            echo "=== Services Status ==="
                            kubectl get services -n ${K8S_NAMESPACE}

                            echo "=== Ingress Status ==="
                            kubectl get ingress -n ${K8S_NAMESPACE}
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded! Deployment completed successfully.'
            // 성공 알림 (Slack, Email 등)
        }

        failure {
            echo 'Pipeline failed! Check the logs for details.'
            // 실패 알림
        }

        always {
            // Docker 이미지 정리
            sh """
                docker rmi ${BACKEND_IMAGE}:${BUILD_TAG} || true
                docker rmi ${FRONTEND_IMAGE}:${BUILD_TAG} || true
            """

            cleanWs()
        }
    }
}
