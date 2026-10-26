# Carnet de repas

Un carnet de repas familial, auto-hébergé et libre : planning du mois, recettes pas à pas (avec variantes Thermomix et airfryer), listes de courses, frigo, historique, et un **écran de cuisine plein écran pour une vieille tablette**.

- Aucune dépendance côté serveur : un seul fichier `server.js` (Node.js 18 ou plus).
- Les données tiennent dans un fichier `data/db.json`, sauvegardé automatiquement chaque jour (30 jours gardés).
- L'interface marche sur un téléphone, un ordinateur, et un **vieil iPad** (Safari 8 et plus récent).
- Accès protégé par un mot de passe. Une fois connecté, un appareil reste connecté un an.
- Licence MIT : tu peux l'utiliser, le modifier et le partager librement.

## Ce que fait l'app

| Écran | Rôle |
|---|---|
| **Aujourd'hui** | Le plat du midi et du soir en grand, « Cuisiner », « Fait » / « Pas envie », ce qu'il faut sortir du congélateur pour demain, et les repas passés à cocher. |
| **Planning** | Le mois en cours. Toucher un plat ouvre sa recette. Le bouton « … » échange deux repas de place ou change un plat. |
| **Courses** | Les listes par rayon, à cocher au magasin. |
| **Frigo** | Ce qu'il y a à la maison (frigo, congélateur, placard). « Ranger mes courses » y ajoute ce qui a été coché. |
| **Recettes** | Toutes les fiches, avec recherche, filtres et choix de la méthode (classique, Thermomix, airfryer). |
| **Historique** | Les plats faits et refusés, et la section **Données** (export / import). |
| **Mode cuisine** | Une étape à la fois en gros caractères, minuteurs intégrés, l'écran reste allumé quand l'appareil le permet. |
| **Écran tablette** (`/#tablette`) | La page du jour en plein écran avec l'heure. Revient tout seul à l'écran du jour après 20 minutes sans toucher, et passe au jour suivant à minuit. |

## Installation sur Proxmox

### 1. Créer un conteneur

Dans Proxmox, crée un conteneur LXC **Debian 12** (1 cœur, 512 Mo de RAM et 4 Go de disque suffisent). Coche **Nesting** dans les options : Docker en a besoin.

### 2. Installer Docker dans le conteneur

```bash
apt update && apt install -y curl git
curl -fsSL https://get.docker.com | sh
```

### 3. Récupérer le projet et le lancer

```bash
git clone <adresse-du-dépôt> carnet-repas
cd carnet-repas
nano docker-compose.yml        # remplace "change-moi" par un vrai mot de passe
docker compose up -d --build
```

L'app répond sur le port **8080** du conteneur : `http://<ip-du-conteneur>:8080`.

### 4. Mettre l'app derrière HTTPS (recommandé)

Si le serveur a déjà un reverse proxy (Nginx Proxy Manager, Caddy, Traefik…), il suffit d'y ajouter une entrée vers `http://<ip-du-conteneur>:8080`. Exemple avec Caddy :

```
carnet.mondomaine.fr {
  reverse_proxy <ip-du-conteneur>:8080
}
```

### Sans Docker

```bash
apt install -y nodejs   # version 18 ou plus
PASSWORD="ton-mot-de-passe" DATA_DIR=/srv/carnet node server.js
```

Pour un démarrage automatique, un service systemd d'exemple :

```ini
# /etc/systemd/system/carnet.service
[Unit]
Description=Carnet de repas
After=network.target

[Service]
WorkingDirectory=/opt/carnet-repas
Environment=PASSWORD=ton-mot-de-passe DATA_DIR=/srv/carnet PORT=8080 TZ=Europe/Paris
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

## Importer ses données

Au premier lancement, l'app contient une semaine d'exemple. Pour mettre tes propres données :

1. Ouvre l'app et connecte-toi.
2. Onglet **Historique**, section **Données**, puis **Importer un fichier**.
3. Choisis ton fichier `carnet-export.json`.

Le premier import **remplace la semaine d'exemple**. Les imports suivants **ajoutent ou remplacent** les éléments du fichier sans effacer le reste. Une copie de sécurité est faite avant chaque import (`data/backups/`).

**Export** : même endroit, bouton **Exporter**. Tu obtiens un fichier JSON avec tout le carnet.

## Configurer l'iPad comme écran de cuisine

1. Sur l'iPad, ouvre **Safari** à l'adresse `https://carnet.mondomaine.fr/#tablette` et connecte-toi.
2. Bouton **Partager**, puis **Sur l'écran d'accueil** : l'app s'ouvre en plein écran, sans barre d'adresse.
3. **Réglages > Luminosité et affichage > Verrouillage automatique : Jamais**. Laisse l'iPad branché.
4. **Réglages > Accessibilité > Accès guidé** : active-le et choisis un code.
5. Ouvre l'app depuis l'écran d'accueil, puis **triple-clic sur le bouton principal**, puis **Démarrer** : l'iPad reste bloqué sur l'app. Triple-clic et code pour en sortir.

Selon l'âge de l'iPad, les menus peuvent s'appeler un peu différemment (« Général > Accessibilité » sur les très anciens).

## Faire évoluer l'app

```
server.js           le serveur (API + fichiers)
src/app.js          l'interface (code moderne)
src/api.js          la synchronisation avec le serveur
src/style.css       les styles principaux
src/extra.css       connexion, écran tablette, compatibilité vieux Safari
src/polyfills.js    compléments pour les vieux navigateurs
tools/build.js      compile src/ vers public/ pour les vieux Safari
public/             ce que le serveur envoie (généré, à ne pas modifier à la main)
exemple/            données d'exemple chargées au premier lancement
```

Après une modification dans `src/` :

```bash
npm run build                  # recompile public/
docker compose up -d --build   # redéploie
```

### Format des données

Un export (et un fichier à importer) ressemble à ça :

```json
{
  "format": "carnet-repas/1",
  "collections": {
    "recipes":  { "tajine-poulet": { "title": "…", "servings": 4, "ingredients": [], "steps": [] } },
    "months":   { "2026-11": { "label": "Novembre 2026", "start": "2026-11-02", "end": "2026-11-29", "weeks": [] } },
    "courses":  { "2026-11-1": { "monthId": "2026-11", "label": "…", "sections": [] } },
    "settings": { "stock": { "fresh": [], "freezer": [], "pantry": [] }, "prefs": {} }
  }
}
```

Mettre un document à `null` le supprime à l'import. C'est le format à demander à une IA pour préparer le planning du mois suivant.

### API

Toutes les routes demandent d'être connecté (cookie de session, ou en-tête `Authorization: Bearer <jeton>` renvoyé par `/api/login`).

| Méthode | Route | Rôle |
|---|---|---|
| `POST` | `/api/login` | `{"password": "…"}` → ouvre une session |
| `GET` | `/api/state?since=<rev>` | Tout ce qui a changé depuis la révision donnée |
| `GET` / `PUT` / `PATCH` / `DELETE` | `/api/doc/<collection>/<id>` | Lire, remplacer, fusionner ou supprimer un document |
| `POST` | `/api/import?mode=merge` | Importer un fichier (`mode=replace` remplace tout) |
| `GET` | `/api/export` | Télécharger tout le carnet |
| `GET` | `/api/health` | Vérifier que le serveur tourne |

## Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `PASSWORD` | (vide) | Mot de passe d'accès. **Vide = aucun mot de passe** : à éviter si l'app est sur internet. |
| `PORT` | `8080` | Port d'écoute |
| `DATA_DIR` | `./data` | Dossier des données et des sauvegardes |
| `TZ` | heure du système | Fuseau horaire (`Europe/Paris`) |
