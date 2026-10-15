

# Utilisation de l'image officielle Node.js 20 basée sur Alpine Linux pour sa légèreté et sa sécurité
FROM node:20-alpine AS builder

# Définition du répertoire de travail dans le conteneur
WORKDIR /app

# Déclaration des arguments de build pour les clés d'environnement Vite avec valeurs par défaut
ARG VITE_BLINK_PROJECT_ID=secure-cashflow-app-dm5j1jb0
ARG VITE_BLINK_PUBLISHABLE_KEY=blnk_pk_5unMdTharraMym0vppBVeM9BIXJ-ni1m

# Injection des arguments en tant que variables d'environnement accessibles pendant le build Vite
ENV VITE_BLINK_PROJECT_ID=$VITE_BLINK_PROJECT_ID
ENV VITE_BLINK_PUBLISHABLE_KEY=$VITE_BLINK_PUBLISHABLE_KEY

# Copie des fichiers de gestion des dépendances pour optimiser le cache des couches Docker
COPY package*.json ./

# Installation propre et reproductible des dépendances du projet
RUN npm ci

# Copie de l'intégralité du code source de l'application dans le conteneur
COPY . .

# Compilation et construction des fichiers statiques de production avec Vite (génération du dossier dist)
RUN npm run build



# Utilisation de l'image officielle Nginx Alpine pour un serveur web ultra-léger et performant (< 30 Mo)
FROM nginx:alpine AS runner

# Suppression de la configuration par défaut de Nginx pour éviter tout conflit
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copie de notre fichier de configuration personnalisé Nginx (support du routage React SPA et compression Gzip)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers statiques optimisés générés lors de l'étape de build vers le dossier servi par Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Indication que le conteneur écoute sur le port 80 en protocole HTTP
EXPOSE 80

# Déclaration de la commande par défaut pour exécuter Nginx au premier plan (évite que le conteneur ne se termine)
CMD ["nginx", "-g", "daemon off;"]
