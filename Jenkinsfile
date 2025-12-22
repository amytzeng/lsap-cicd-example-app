pipeline {
    agent any
    
    // Environment variables for notification
    environment {
        DISCORD_WEBHOOK_URL = credentials('discord-webhook-url')
        // Or use SLACK_WEBHOOK_URL = credentials('slack-webhook-url')
        YOUR_NAME = 'Your Name'
        YOUR_STUDENT_ID = 'Your Student ID'
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
