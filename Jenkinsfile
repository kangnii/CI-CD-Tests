pipeline {
    agent any

    tools {
        // Doit correspondre au nom configuré dans 'Global Tool Configuration'
        nodejs 'node20' 
    }

    environment {
        // Récupération des secrets Jenkins pour Render
        RENDER_SERVICE_ID = credentials('RENDER_SERVICE_ID')
        RENDER_API_KEY = credentials('RENDER_API_KEY')
    }

    stages {
        stage('Checkout') {
            steps {
                // Récupère le code depuis GitHub
                checkout scm
            }
        }

        stage('Installation') {
            steps {
                // Utilise le fichier package-lock.json pour une installation propre
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                // Analyse statique du code avec ESLint
                sh 'npm run lint'
            }
        }

        stage('Tests') {
            steps {
                // Exécution des tests unitaires avec Jest
                sh 'npm test'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Déclenchement du déploiement sur Render...'
                // Appel API pour forcer le déploiement sur Render
                sh """
                curl -X POST https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys \
                     -H "Authorization: Bearer ${RENDER_API_KEY}"
                """
            }
        }
    }

    post {
        success {
            echo 'Le pipeline a été exécuté avec succès !'
        }
        failure {
            echo 'Le pipeline a échoué. Consultez la console pour plus de détails.'
        }
    }
}