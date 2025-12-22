pipeline {
    agent any
    
    // Environment variables for notification
    environment {
        DISCORD_WEBHOOK_URL = credentials('discord-webhook')
        // Or use SLACK_WEBHOOK_URL = credentials('slack-webhook-url')
        YOUR_NAME = '曾文儀'
        YOUR_STUDENT_ID = 'B12705017'
        DOCKER_HUB_USER = 'amytzeng'
        DOCKER_IMAGE_NAME = 'jenkins-amy'
        DOCKER_HUB_CREDENTIALS = credentials('dockerhub-creds')
    }
    
    stages {
        stage('Install Dependencies') {
            tools {
                nodejs 'NodeJS'
            }
            steps {
                sh 'npm install'
            }
        }
        stage('Static Analysis') {
            tools {
                nodejs 'NodeJS'
            }
            steps {
                sh 'npm run lint'
            }
        }
        stage('Run Tests') {
            tools {
                nodejs 'NodeJS'
            }
            steps {
                sh 'npm test'
            }
        }

        // Staging deployment - only runs on dev branch
        stage('Build and Push Docker Image (Staging)') {
            when {
                branch 'dev'
            }
            steps {
                script {
                    def imageTag = "dev-${env.BUILD_NUMBER}"
                    def fullImageName = "${env.DOCKER_HUB_USER}/${env.DOCKER_IMAGE_NAME}:${imageTag}"
                    
                    // Build Docker image
                    sh "docker build -t ${fullImageName} ."
                    
                    // Login to Docker Hub
                    sh "echo ${env.DOCKER_HUB_CREDENTIALS_PSW} | docker login -u ${env.DOCKER_HUB_CREDENTIALS_USR} --password-stdin"
                    
                    // Push to Docker Hub
                    sh "docker push ${fullImageName}"
                }
            }
        }
        stage('Deploy to Staging') {
            when {
                branch 'dev'
            }
            steps {
                script {
                    def imageTag = "dev-${env.BUILD_NUMBER}"
                    def fullImageName = "${env.DOCKER_HUB_USER}/${env.DOCKER_IMAGE_NAME}:${imageTag}"
                    
                    // Force remove existing container
                    sh "docker rm -f dev-app || true"
                    
                    // Run new container on port 8081
                    sh """
                        docker run -d \\
                        --name dev-app \\
                        -p 8081:3000 \\
                        ${fullImageName}
                    """
                    
                    // Wait for container to start and verify health endpoint with retry
                    def maxRetries = 10
                    def retryCount = 0
                    def healthCheckPassed = false
                    
                    while (retryCount < maxRetries && !healthCheckPassed) {
                        sleep(time: 2, unit: 'SECONDS')
                        def exitCode = sh(
                            script: "curl -f http://localhost:8081/health || exit 1",
                            returnStatus: true
                        )
                        if (exitCode == 0) {
                            healthCheckPassed = true
                            echo "Health check passed after ${retryCount + 1} attempt(s)"
                        } else {
                            retryCount++
                            echo "Health check failed, retrying... (${retryCount}/${maxRetries})"
                        }
                    }
                    
                    if (!healthCheckPassed) {
                        error("Health check failed after ${maxRetries} attempts")
                    }
                }
            }
        }
        // Production deployment - only runs on main branch
        stage('Read Deployment Config') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Read deploy.config file
                    def configContent = readFile('deploy.config').trim()
                    env.TARGET_TAG = configContent
                    echo "Target tag for production: ${env.TARGET_TAG}"
                }
            }
        }
        
        stage('Promote Artifact to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    def sourceImage = "${env.DOCKER_HUB_USER}/${env.DOCKER_IMAGE_NAME}:${env.TARGET_TAG}"
                    def prodImageTag = "prod-${env.BUILD_NUMBER}"
                    def prodImageName = "${env.DOCKER_HUB_USER}/${env.DOCKER_IMAGE_NAME}:${prodImageTag}"
                    
                    // Login to Docker Hub
                    sh "echo ${env.DOCKER_HUB_CREDENTIALS_PSW} | docker login -u ${env.DOCKER_HUB_CREDENTIALS_USR} --password-stdin"
                    
                    // Pull the source image
                    sh "docker pull ${sourceImage}"
                    
                    // Retag as production
                    sh "docker tag ${sourceImage} ${prodImageName}"
                    
                    // Push the production tag
                    sh "docker push ${prodImageName}"
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    def prodImageTag = "prod-${env.BUILD_NUMBER}"
                    def prodImageName = "${env.DOCKER_HUB_USER}/${env.DOCKER_IMAGE_NAME}:${prodImageTag}"
                    
                    // Force remove existing container
                    sh "docker rm -f prod-app || true"
                    
                    // Run new container on port 8082
                    sh """
                        docker run -d \\
                        --name prod-app \\
                        -p 8082:3000 \\
                        ${prodImageName}
                    """
                    
                    // Wait for container to start and verify health endpoint with retry
                    def maxRetries = 10
                    def retryCount = 0
                    def healthCheckPassed = false
                    
                    while (retryCount < maxRetries && !healthCheckPassed) {
                        sleep(time: 2, unit: 'SECONDS')
                        def exitCode = sh(
                            script: "curl -f http://localhost:8082/health || exit 1",
                            returnStatus: true
                        )
                        if (exitCode == 0) {
                            healthCheckPassed = true
                            echo "Health check passed after ${retryCount + 1} attempt(s)"
                        } else {
                            retryCount++
                            echo "Health check failed, retrying... (${retryCount}/${maxRetries})"
                        }
                    }
                    
                    if (!healthCheckPassed) {
                        error("Health check failed after ${maxRetries} attempts")
                    }
                }
            }
        }
    }
    
    post {
        failure {
            script {
                def message = """
                **Build Failed!**
                Name: ${env.YOUR_NAME}
                Student ID: ${env.YOUR_STUDENT_ID}
                Job Name: ${env.JOB_NAME}
                Build Number: ${env.BUILD_NUMBER}
                GitHub Repo URL: ${env.GIT_URL}
                Branch: ${env.BRANCH_NAME}
                Status: ${currentBuild.currentResult}
                """
                
                // Send to Discord
                sh """
                    curl -H "Content-Type: application/json" \\
                    -X POST \\
                    -d '{"content": "${message.replace('"', '\\"').replace('\n', '\\n')}"}' \\
                    ${env.DISCORD_WEBHOOK_URL}
                """
            }
        }
    }
}
