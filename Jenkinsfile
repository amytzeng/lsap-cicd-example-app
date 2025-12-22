pipeline {
    agent any
    
    stages {
        stage('Install Dependencies') {
            tools {
                nodejs 'NodeJS'
            }
            steps {
                sh 'npm install'
            }
        }
        
        stage('Run Tests') {
            steps {
                sh 'npm test'
            }
        }
    }
}
