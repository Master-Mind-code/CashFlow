# 💼 SecureCashFlow - Terminal Bancaire & Gestion des Flux Financiers

[![Docker Image](https://img.shields.io/badge/docker-ready-blue?logo=docker)](https://hub.docker.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Nginx](https://img.shields.io/badge/Nginx-Alpine-009639?logo=nginx)](https://nginx.org/)
[![AWS EC2](https://img.shields.io/badge/AWS-EC2-FF9900?logo=amazon-aws)](https://aws.amazon.com/ec2/)

> **Projet académique** : *De l'application au déploiement dans le cloud*  
> Application web conteneurisée avec Docker et déployée sur une instance AWS EC2.

---

## 📌 1. Présentation du Projet

**SecureCashFlow** est une application web moderne simulant un terminal de caisse et de gestion des transactions financières sécurisées. Conçue pour répondre aux exigences des opérations en agence bancaire, elle garantit traçabilité, rapidité et conformité.

### 🌟 Fonctionnalités Principales

- 📊 **Tableau de bord interactif** : Vue d'ensemble des soldes, répartition des opérations et flux journaliers.
- 💵 **Module de Dépôt** : Alimentation de compte avec calcul dynamique des coupures et validation instantanée.
- 💳 **Module de Retrait Sécurisé** : Vérification des pièces d'identité, contrôle de provision et émission de reçus.
- 📜 **Historique & Audit** : Consultation, filtrage avancé des transactions passées et recherche multi-critères.
- 🔐 **Sécurité & Authentification** : Accès contrôlé par rôles bancaires.

---

## 🛠️ 2. Stack Technique & Architecture

- **Frontend** : React 19, TypeScript, Vite 7
- **UI / Design** : Tailwind CSS, Radix UI, Lucide Icons, Framer Motion
- **Conteneurisation** : Docker (Multi-stage build : Node 20 Alpine -> Nginx Alpine)
- **Serveur Web** : Nginx (gestion du routage React SPA et compression Gzip)
- **Hébergement Cloud** : Amazon Web Services (AWS EC2)

```
securecashflow/
├── public/                 # Assets statiques publics
├── src/
│   ├── components/         # Composants UI réutilisables (Radix / Tailwind)
│   ├── domain/             # Modèles de données & types métier
│   ├── hooks/              # Custom Hooks React
│   ├── pages/              # Pages (Dashboard, Deposit, Withdraw, History)
│   ├── App.tsx             # Composant racine & Routage
│   └── main.tsx            # Point d'entrée React
├── Dockerfile              # Fichier Docker multi-étape commenté
├── nginx.conf              # Configuration Nginx de production (SPA router)
├── .dockerignore           # Fichiers exclus du contexte Docker
└── README.md               # Documentation complète
```

---

## 🚀 3. Guide de Démarrage en Local

### Prérequis
- [Node.js](https://nodejs.org/) (v20+)
- [npm](https://www.npmjs.com/) ou [bun](https://bun.sh/)
- [Docker](https://www.docker.com/) (optionnel pour l'exécution conteneurisée)

### Installation et Exécution

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/<username>/securecashflow.git
   cd securecashflow
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement :**
   ```bash
   npm run dev
   ```
   L'application est accessible sur : `http://localhost:3000`

4. **Compiler pour la production (build local) :**
   ```bash
   npm run build
   ```

---

## 🐳 4. Conteneurisation avec Docker

Le projet utilise un `Dockerfile` multi-stage optimisé pour garantir une image ultra-légère (< 30 Mo) servie par Nginx.

### Construire l'image localement

```bash
docker build -t <username>/securecashflow:v1 .
```

### Tester le conteneur en local

```bash
docker run -d -p 80:80 --name securecashflow-app <username>/securecashflow:v1
```
Accédez ensuite à [http://localhost](http://localhost) depuis votre navigateur.

### Arrêter le conteneur

```bash
docker stop securecashflow-app
docker rm securecashflow-app
```

### Publier l'image sur Docker Hub

1. Connectez-vous à votre compte Docker Hub :
   ```bash
   docker login
   ```
2. Poussez l'image vers votre registre public :
   ```bash
   docker push <username>/securecashflow:v1
   ```

---

## ☁️ 5. Déploiement sur AWS EC2

Conformément aux consignes, **l'image Docker n'est pas construite sur l'instance**, mais téléchargée depuis Docker Hub.

### 1. Préparation de l'instance EC2
- Lancer une instance EC2 (ex: *Amazon Linux 2023* ou *Ubuntu 24.04*, type `t2.micro` éligible Free Tier).
- Configurer le **Groupe de Sécurité (Security Group)** :
  - **SSH (Port 22)** : Accessible depuis votre IP (administration).
  - **HTTP (Port 80)** : Accessible depuis `0.0.0.0/0` (accès public des évaluateurs).

### 2. Connexion à l'instance
```bash
ssh -i "votre-cle.pem" ec2-user@<IP_publique_EC2>
```
*(Remplacez `ec2-user` par `ubuntu` si vous utilisez une AMI Ubuntu)*

### 3. Installation et démarrage de Docker sur EC2
```bash
# Pour Amazon Linux 2023 :
sudo dnf update -y
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# Se reconnecter ou recharger les permissions du groupe :
newgrp docker
```

*(Si Ubuntu : `sudo apt update && sudo apt install -y docker.io && sudo systemctl enable --now docker`)*

### 4. Téléchargement et lancement de l'application
```bash
# Récupérer l'image depuis Docker Hub
docker pull <username>/securecashflow:v1

# Lancer le conteneur en arrière-plan avec redémarrage automatique
docker run -d -p 80:80 --restart always --name securecashflow <username>/securecashflow:v1
```

### 5. Vérification
- Vérifier que le conteneur tourne :
  ```bash
  docker ps
  ```
- Ouvrir dans votre navigateur : `http://<IP_publique_EC2>`

---

## 👥 6. Membres du Groupe & Rôles

| Membre | Rôle principal |
| :--- | :--- |
| **Membre 1** | Conception & Développement Frontend (React/Vite) |
| **Membre 2** | Conteneurisation (Dockerfile, Nginx) & Tests locaux |
| **Membre 3** | Déploiement Cloud AWS EC2 & Sécurité réseau |

---

## 📄 7. Livrables du Projet

1. **Dépôt GitHub public** : `https://github.com/<username>/securecashflow`
2. **Image Docker Hub** : `https://hub.docker.com/r/<username>/securecashflow`
3. **URL publique de l'application** : `http://<IP_publique_EC2>`
4. **Support de présentation** : Disponible dans le dossier `/docs/presentation`