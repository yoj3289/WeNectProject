pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                // GitHub에서 코드 가져오기
                checkout scm
            }
        }

        stage('Build') {
            steps {
                // backend 폴더 안으로 들어가서 빌드
                dir('backend') {
                    sh 'chmod +x ./gradlew'   // 권한 문제 방지용
                    sh './gradlew clean build'
                }
            }
        }
    }
}
