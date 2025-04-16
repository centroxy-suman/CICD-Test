pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'suman/ultimate-cicd-app'
        DOCKER_TAG = 'latest'
        DOCKER_HUB_CREDENTIALS = 'dockerhub-credentials'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', git url: 'https://github.com/centroxy-suman/CICD-Test.git', credentialsId: 'github-token'
            }
        }

        stage('Install & Test') {
            steps {
                sh 'npm install'
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
            }
        }

        stage('Scan with Trivy') {
            steps {
                sh "trivy image ${DOCKER_IMAGE}:${DOCKER_TAG} || true"
            }
        }

        stage('Push to DockerHub') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDENTIALS}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                    sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                }
            }
        }
    }
}

