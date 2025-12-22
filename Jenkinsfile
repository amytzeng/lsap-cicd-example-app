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
            tools {
                nodejs 'NodeJS'
            }
            steps {
                script {
                    // Read version from package.json dynamically
                    def appVersion = sh(
                        script: "node -p \"require('./package.json').version\"",
                        returnStdout: true
                    ).trim()
                    
                    echo "Application version from package.json: ${appVersion}"
                    
                    // Build number tag for tracking individual builds
                    def buildNumberTag = "dev-${env.BUILD_NUMBER}"
                    def buildNumberImageName = "${env.DOCKER_HUB_USER}/${env.DOCKER_IMAGE_NAME}:${buildNumberTag}"
                    
                    // Semantic version tag (e.g., v1.1.0)
                    def semanticVersionTag = "v${appVersion}"
                    def semanticVersionImageName = "${env.DOCKER_HUB_USER}/${env.DOCKER_IMAGE_NAME}:${semanticVersionTag}"
                    
                    // Build Docker image with build number tag
                    sh "docker build -t ${buildNumberImageName} ."
                    
                    // Create semantic version tag from the same image
                    sh "docker tag ${buildNumberImageName} ${semanticVersionImageName}"
                    
                    // Login to Docker Hub
                    sh "echo ${env.DOCKER_HUB_CREDENTIALS_PSW} | docker login -u ${env.DOCKER_HUB_CREDENTIALS_USR} --password-stdin"
                    
                    // Push both tags to Docker Hub
                    echo "Pushing build number tag: ${buildNumberTag}"
                    sh "docker push ${buildNumberImageName}"
                    
                    echo "Pushing semantic version tag: ${semanticVersionTag}"
                    sh "docker push ${semanticVersionImageName}"
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
                    def containerId = sh(
                        script: """
                            docker run -d \\
                            --name dev-app \\
                            -p 8081:3000 \\
                            ${fullImageName}
                        """,
                        returnStdout: true
                    ).trim()
                    
                    echo "Container started with ID: ${containerId}"
                    
                    // Wait a moment for container to initialize
                    sleep(time: 3, unit: 'SECONDS')
                    
                    // Check container status
                    def containerStatus = sh(
                        script: "docker ps -a --filter name=dev-app --format '{{.Status}}'",
                        returnStdout: true
                    ).trim()
                    echo "Container status: ${containerStatus}"
                    
                    // Show container logs for debugging
                    echo "Container logs:"
                    sh "docker logs dev-app || true"
                    
                    // Wait for container to start and verify health endpoint with retry
                    def maxRetries = 10
                    def retryCount = 0
                    def healthCheckPassed = false
                    
                    while (retryCount < maxRetries && !healthCheckPassed) {
                        sleep(time: 2, unit: 'SECONDS')
                        
                        // Check if container is still running
                        def isRunning = sh(
                            script: "docker ps --filter name=dev-app --format '{{.Names}}' | grep -q dev-app",
                            returnStatus: true
                        )
                        
                        if (isRunning != 0) {
                            echo "Container is not running. Showing logs:"
                            sh "docker logs dev-app || true"
                            error("Container dev-app stopped unexpectedly")
                        }
                        
                        // Try to check health from container itself first, then from host
                        def exitCode = sh(
                            script: "docker exec dev-app curl -f http://localhost:3000/health 2>/dev/null || curl -f http://localhost:8081/health 2>/dev/null || exit 1",
                            returnStatus: true
                        )
                        if (exitCode == 0) {
                            healthCheckPassed = true
                            echo "Health check passed after ${retryCount + 1} attempt(s)"
                        } else {
                            retryCount++
                            echo "Health check failed, retrying... (${retryCount}/${maxRetries})"
                            if (retryCount == 3) {
                                // Show logs after a few failed attempts
                                echo "Container logs after failed attempts:"
                                sh "docker logs dev-app || true"
                            }
                        }
                    }
                    
                    if (!healthCheckPassed) {
                        echo "Final container logs:"
                        sh "docker logs dev-app || true"
                        echo "Container status:"
                        sh "docker ps -a --filter name=dev-app || true"
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
                    def containerId = sh(
                        script: """
                            docker run -d \\
                            --name prod-app \\
                            -p 8082:3000 \\
                            ${prodImageName}
                        """,
                        returnStdout: true
                    ).trim()
                    
                    echo "Container started with ID: ${containerId}"
                    
                    // Wait a moment for container to initialize
                    sleep(time: 3, unit: 'SECONDS')
                    
                    // Check container status
                    def containerStatus = sh(
                        script: "docker ps -a --filter name=prod-app --format '{{.Status}}'",
                        returnStdout: true
                    ).trim()
                    echo "Container status: ${containerStatus}"
                    
                    // Show container logs for debugging
                    echo "Container logs:"
                    sh "docker logs prod-app || true"
                    
                    // Wait for container to start and verify health endpoint with retry
                    def maxRetries = 10
                    def retryCount = 0
                    def healthCheckPassed = false
                    
                    while (retryCount < maxRetries && !healthCheckPassed) {
                        sleep(time: 2, unit: 'SECONDS')
                        
                        // Check if container is still running
                        def isRunning = sh(
                            script: "docker ps --filter name=prod-app --format '{{.Names}}' | grep -q prod-app",
                            returnStatus: true
                        )
                        
                        if (isRunning != 0) {
                            echo "Container is not running. Showing logs:"
                            sh "docker logs prod-app || true"
                            error("Container prod-app stopped unexpectedly")
                        }
                        
                        // Try to check health from container itself first, then from host
                        def exitCode = sh(
                            script: "docker exec prod-app curl -f http://localhost:3000/health 2>/dev/null || curl -f http://localhost:8082/health 2>/dev/null || exit 1",
                            returnStatus: true
                        )
                        if (exitCode == 0) {
                            healthCheckPassed = true
                            echo "Health check passed after ${retryCount + 1} attempt(s)"
                        } else {
                            retryCount++
                            echo "Health check failed, retrying... (${retryCount}/${maxRetries})"
                            if (retryCount == 3) {
                                // Show logs after a few failed attempts
                                echo "Container logs after failed attempts:"
                                sh "docker logs prod-app || true"
                            }
                        }
                    }
                    
                    if (!healthCheckPassed) {
                        echo "Final container logs:"
                        sh "docker logs prod-app || true"
                        echo "Container status:"
                        sh "docker ps -a --filter name=prod-app || true"
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
