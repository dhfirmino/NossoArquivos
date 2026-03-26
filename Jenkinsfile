pipeline {
    agent any
    environment {
        REGISTRY = "registry.obtersolucoes.com.br"
        SWARM_LEADER = "10.80.1.230"
    }
    stages {
        stage("Checkout") {
            steps {
                checkout([
                    $class: "GitSCM",
                    branches: [[name: "*/main"]],
                    extensions: [[$class: "CloneOption", depth: 1, shallow: true, noTags: true]],
                    userRemoteConfigs: [[
                        url: "git@github.com:dhfirmino/NossoArquivos.git",
                        credentialsId: "bitbucket-ssh"
                    ]]
                ])
            }
        }
        stage("Build Backend") {
            steps {
                script {
                    def t = "${REGISTRY}/nossoarquivos-backend:${BUILD_NUMBER}"
                    def l = "${REGISTRY}/nossoarquivos-backend:latest"
                    sh "docker build -t ${t} -t ${l} ./backend"
                    sh "docker push ${t}"
                    sh "docker push ${l}"
                    sh "docker rmi ${t} ${l} || true"
                }
            }
        }
        stage("Build Frontend") {
            steps {
                script {
                    def t = "${REGISTRY}/nossoarquivos-frontend:${BUILD_NUMBER}"
                    def l = "${REGISTRY}/nossoarquivos-frontend:latest"
                    sh "docker build -t ${t} -t ${l} ./frontend"
                    sh "docker push ${t}"
                    sh "docker push ${l}"
                    sh "docker rmi ${t} ${l} || true"
                }
            }
        }
        stage("Deploy Swarm") {
            steps {
                sh "ssh -o StrictHostKeyChecking=no -p 2222 debian@${SWARM_LEADER} docker service update --with-registry-auth --image ${REGISTRY}/nossoarquivos-backend:latest nossoarquivos_backend"
                sh "ssh -o StrictHostKeyChecking=no -p 2222 debian@${SWARM_LEADER} docker service update --with-registry-auth --image ${REGISTRY}/nossoarquivos-frontend:latest nossoarquivos_frontend"
            }
        }
    }
    post {
        success { echo "Deploy NossoArquivos #${BUILD_NUMBER} OK!" }
        failure { echo "Falha deploy NossoArquivos #${BUILD_NUMBER}" }
    }
}
