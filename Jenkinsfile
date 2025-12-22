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
            tools {
                nodejs 'NodeJS'
            }
            steps {
                sh 'npm test'
            }
        }
    }
}
