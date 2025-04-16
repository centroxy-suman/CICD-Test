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
        SONARQUBE_URL = 'http://172.25.183.103:9000'
        SONAR_TOKEN = credentials('sonar-token')
        TRIVY_IMAGE = 'aquasec/trivy'
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
                sh 'npm test -- --detectOpenHandles'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withEnv(["SONAR_TOKEN=${SONAR_TOKEN}"]) {
                    sh '''
                        apt-get update && apt-get install -y unzip curl openjdk-17-jre
                        curl -sSLo sonar-scanner.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
                        unzip -q sonar-scanner.zip
                        mv sonar-scanner-*/ sonar-scanner
                        chmod +x sonar-scanner/bin/sonar-scanner

                        sonar-scanner/bin/sonar-scanner \
                          -Dsonar.projectKey=cicd-test \
                          -Dsonar.sources=. \
                          -Dsonar.host.url=${SONARQUBE_URL} \
                          -Dsonar.login=$SONAR_TOKEN
                    '''
                }
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
                    apt-get update && apt-get install -y curl
                    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
                    trivy image --exit-code 1 --severity HIGH,CRITICAL centroxy-suman/cicd-test
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

        stage('Deploy Application') {
            steps {
                script {
                    sh "docker-compose -f docker-compose.yml up -d"
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    sleep(time: 30, unit: 'SECONDS')
                    def result = sh(script: "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000", returnStdout: true).trim()

                    if (result == "200") {
                        echo 'Application is running successfully!'
                    } else {
                        error 'Application failed to start!'
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

