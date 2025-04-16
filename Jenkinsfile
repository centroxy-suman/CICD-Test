pipeline {
    agent {
        docker {
            image 'node:18'
            args '-u root'
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
                        rm -rf sonar-scanner sonar-scanner.zip sonar-scanner-5.0.1.3006-linux*
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
            agent {
                docker {
                    image 'docker:24.0.7'
                    args '-u root -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                script {
                    dockerImage = docker.build("centroxy-suman/cicd-test")
                }
            }
        }

        stage('Scan with Trivy') {
            agent {
                docker {
                    image 'docker:24.0.7'
                    args '-u root -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                sh '''
                    apk add --no-cache curl
                    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
                    trivy image --exit-code 1 --severity HIGH,CRITICAL centroxy-suman/cicd-test
                '''
            }
        }

        stage('Push to DockerHub') {
            agent {
                docker {
                    image 'docker:24.0.7'
                    args '-u root -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
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
            agent {
                docker {
                    image 'docker/compose:1.29.2'
                    args '-u root -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
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

