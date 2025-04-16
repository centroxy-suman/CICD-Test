pipeline {
    agent {
        docker {
            image 'node:18'
            args '-u root' // to avoid permission issues with npm
        }
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        GITHUB_TOKEN = credentials('github-token')
    }

    stages {
        stage('Checkout') {
            steps {
                git credentialsId: 'github-token', url: 'https://github.com/centroxy-suman/CICD-Test.git', branch: 'main'
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
                script {
                    dockerImage = docker.build("centroxy-suman/cicd-test")
                }
            }
        }

        stage('Scan with Trivy') {
            steps {
                sh '''
                    apk add --no-cache curl
                    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
                    trivy image centroxy-suman/cicd-test
                '''
            }
        }

        stage('Push to DockerHub') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-creds') {
                        dockerImage.push("${env.BUILD_NUMBER}")
                        dockerImage.push("latest")
                    }
                }
            }
        }
    }

    post {
        failure {
            echo "Build failed! Check the logs."
        }
        success {
            echo "Pipeline executed successfully!"
        }
    }
}

