pipeline {
    agent any

    environment {
        REGISTRY = 'registry.obtersolucoes.com.br'
        APP_NAME = 'nossoarquivos'
        REPO_URL = 'https://github.com/dhfirmino/NossoArquivos.git'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: "${REPO_URL}"
            }
        }

        stage('Build Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        sh "docker build -t ${REGISTRY}/${APP_NAME}-backend:latest ./backend"
                    }
                }
                stage('Build Frontend') {
                    steps {
                        sh "docker build -t ${REGISTRY}/${APP_NAME}-frontend:latest ./frontend"
                    }
                }
            }
        }

        stage('Push Images') {
            parallel {
                stage('Push Backend') {
                    steps {
                        sh "docker push ${REGISTRY}/${APP_NAME}-backend:latest"
                    }
                }
                stage('Push Frontend') {
                    steps {
                        sh "docker push ${REGISTRY}/${APP_NAME}-frontend:latest"
                    }
                }
            }
        }

        stage('Deploy to Swarm') {
            steps {
                sh """
                    docker service update \
                        --image ${REGISTRY}/${APP_NAME}-backend:latest \
                        --with-registry-auth \
                        ${APP_NAME}_backend || true

                    docker service update \
                        --image ${REGISTRY}/${APP_NAME}-frontend:latest \
                        --with-registry-auth \
                        ${APP_NAME}_frontend || true
                """
            }
        }
    }

    post {
        success {
            echo "Deploy do ${APP_NAME} concluido com sucesso!"
        }
        failure {
            echo "Falha no deploy do ${APP_NAME}!"
        }
    }
}
