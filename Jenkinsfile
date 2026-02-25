pipeline {
  agent any

  options {
    timestamps()
    ansiColor('xterm')
  }

  environment {
    NODE_VERSION = '18'
    // Credentials Jenkins à créer (Manage Jenkins > Credentials)
    // - discord-webhook-ci : "Secret text" = URL webhook Discord
    // - render-api-key     : "Secret text" = Render API Key
    // - render-service-id  : "Secret text" = Render Service ID
    DISCORD_WEBHOOK_URL_CI = credentials('discord-webhook-ci')
    RENDER_API_KEY         = credentials('render-api-key')
    RENDER_SERVICE_ID      = credentials('render-service-id')
  }

  triggers {
    // Si tu utilises un webhook GitHub/GitLab, garde ça côté Jenkins UI plutôt.
    // pollSCM('H/2 * * * *') // optionnel: poll toutes les 2 minutes
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
        // Important: récupérer les tags (utile pour la condition de deploy)
        sh 'git fetch --tags --force'
        sh 'git --no-pager log -1 --oneline'
      }
    }

    stage('Node.js setup') {
      steps {
        // Recommandé: plugin "NodeJS" + config Node 18 dans Jenkins (Global Tool Configuration)
        // Si tu n’as pas le plugin, Jenkins utilisera le node installé sur la machine/agent.
        sh '''
          node -v || true
          npm -v || true
        '''
      }
    }

    stage('Install dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    stage('SAST - Semgrep') {
      steps {
        // Option 1: si semgrep est dispo via pip (sur agent Jenkins)
        // Option 2: utiliser docker pour semgrep si docker est dispo
        // Ici: version Docker (plus fiable si ton Jenkins a Docker)
        sh '''
          docker run --rm \
            -v "$PWD:/src" -w /src \
            semgrep/semgrep semgrep --config p/javascript
        '''
      }
    }

    stage('Check syntax (lint)') {
      steps {
        sh 'npm run lint'
      }
    }

    stage('Verification tests') {
      steps {
        sh 'npm run test'
      }
    }

    stage('SCA - npm audit') {
      steps {
        sh 'npm audit --audit-level=high'
      }
    }

    stage('Deploy to Render') {
      when {
        expression {
          // Jenkins expose souvent GIT_BRANCH, BRANCH_NAME selon le job type.
          // Pour les tags, on cherche:
          // - BRANCH_NAME qui commence par "refs/tags/"
          // - ou GIT_BRANCH du style "tags/v1.0.0" selon plugins
          def bn = env.BRANCH_NAME ?: ''
          def gb = env.GIT_BRANCH ?: ''
          return bn.startsWith('refs/tags/') || gb.contains('tags/') || gb.startsWith('refs/tags/')
        }
      }
      steps {
        sh '''
          echo "Deploy Render - service: $RENDER_SERVICE_ID"
          curl -sS -f -X POST \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            -H "Content-Type: application/json" \
            https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys \
            -d '{}'
        '''
      }
    }
  }

  post {
    failure {
      // Equivalent de ton "Notify Discord (build failure)" sur job build
      sh '''
        PAYLOAD='{
          "embeds": [{
            "title": "Build echoue (SCA/CI)",
            "description": "Le job build a echoué avant le deploiement.",
            "author": { "name": "Wisdom Follygan" },
            "color": 15158332
          }]
        }'
        curl -sS -f -H "Content-Type: application/json" -d "$PAYLOAD" "$DISCORD_WEBHOOK_URL_CI"
      '''
    }

    success {
      // Notif uniquement si on était sur un tag (donc deploy attendu)
      script {
        def bn = env.BRANCH_NAME ?: ''
        def gb = env.GIT_BRANCH ?: ''
        def isTag = bn.startsWith('refs/tags/') || gb.contains('tags/') || gb.startsWith('refs/tags/')
        if (isTag) {
          sh '''
            PAYLOAD='{
              "embeds": [{
                "title": "Deploiement reussi",
                "description": "Le service a ete deploye sur Render",
                "color": 3066993
              }]
            }'
            curl -sS -f -H "Content-Type: application/json" -d "$PAYLOAD" "$DISCORD_WEBHOOK_URL_CI"
          '''
        }
      }
    }

    unsuccessful {
      // Si le deploy échoue (ou autre) et qu’on est sur tag, notif “Deploiement echoue”
      script {
        def bn = env.BRANCH_NAME ?: ''
        def gb = env.GIT_BRANCH ?: ''
        def isTag = bn.startsWith('refs/tags/') || gb.contains('tags/') || gb.startsWith('refs/tags/')
        if (isTag) {
          sh '''
            PAYLOAD='{
              "embeds": [{
                "title": "Deploiement echoue",
                "description": "Le pipeline Jenkins a echoue",
                "color": 15158332
              }]
            }'
            curl -sS -f -H "Content-Type: application/json" -d "$PAYLOAD" "$DISCORD_WEBHOOK_URL_CI"
          '''
        }
      }
    }

    always {
      echo "Pipeline terminé: ${currentBuild.currentResult}"
    }
  }
}