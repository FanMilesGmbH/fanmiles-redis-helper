node {
    def repoName = 'fanmiles-redis-helper';
    def mesosUrl = 'http://marathon.mesos:8080'
    def dockerRegistry = '984376831886.dkr.ecr.us-east-1.amazonaws.com'
    def sshKeyId = 'e9983de3-099a-4a94-bdb5-e4db6651a673';

    def marathonURIs = [
        "file:///home/core/docker.tar.gz"
    ]

    def githubCloneUrl = "git@github.com:FanMilesGmbH/${repoName}.git"
    def githubWebUrl = "https://github.com/fanmilesgmbh/${repoName}"

    def nodeImage = 'node:4.3.2';

    stage 'Checking out latest change'
    checkout scm

    docker.image(nodeImage).inside {
        sh 'mkdir -p /root/.ssh ; ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts'

        sshagent([sshKeyId]) {
            stage 'Installing yarn'
            sh 'npm install -g yarn'

            stage 'Installing node modules'
            sh 'yarn'

            stage 'Running eslint'
            sh 'yarnpkg eslint'
        }
    }

}
