# Plateforme CIRT-ANTIC — Guide des rôles et démarrage

## 🔑 Les 6 rôles (conformes au CDC)

| Rôle backend        | Label interface       | Créé par          | Peut créer               |
|---------------------|-----------------------|-------------------|--------------------------|
| `super_admin`       | Directeur CIRT        | DataInitializer   | `admin_cirt`             |
| `admin_cirt`        | Sous-directeur CIRT   | super_admin       | `chef_service`, `agent_cirt`, `directeur_antenne` |
| `chef_service`      | Chef de Service       | admin_cirt        | —                        |
| `directeur_antenne` | Directeur d'Antenne   | admin_cirt        | `agent_antenne`          |
| `agent_cirt`        | Agent CIRT            | admin_cirt        | —                        |
| `agent_antenne`     | Agent Antenne         | directeur_antenne | **Dossiers**             |

---

## 👁️ Visibilité des dossiers (CDC §4.4)

| Rôle                | Voit                                          |
|---------------------|-----------------------------------------------|
| `super_admin`       | Tous les dossiers                             |
| `admin_cirt`        | Tous les dossiers                             |
| `chef_service`      | Dossiers assignés à **son service**           |
| `agent_cirt`        | Dossiers de **son service** (+ filtre catégorie) |
| `directeur_antenne` | Tous les dossiers de **son antenne**          |
| `agent_antenne`     | **Uniquement ses propres dossiers**           |

---

## 📊 Accès aux statistiques (CDC §9.3)

| Rôle                | Statistiques accessibles                      |
|---------------------|-----------------------------------------------|
| `super_admin`       | Globales + toutes antennes + toutes catégories |
| `admin_cirt`        | Globales + toutes antennes + toutes catégories |
| `chef_service`      | Par catégorie de son service                  |
| `directeur_antenne` | Son antenne uniquement                        |
| `agent_*`           | ❌ Aucun accès                               |

---

## 🏗️ Structure organisationnelle CIRT

```
Directeur CIRT (super_admin)
├── Sous-direction Sécurité des SI (admin_cirt)
│   ├── Service Scans de Vulnérabilité
│   │   ├── Chef de service (chef_service)
│   │   └── Agents CIRT (agent_cirt)
│   ├── Service Fermeture de Comptes
│   └── Service Preuves Numériques
├── Sous-direction Juridique
│   └── Service Réquisitions
└── Sous-direction Veille
    ├── Service Veille Informationnelle
    ├── Service Collecte d'Actifs
    └── Service Points Focaux

Antennes régionales (6)
├── Antenne Yaoundé → Directeur → Agents
├── Antenne Douala  → Directeur → Agents
├── Antenne Garoua
├── Antenne Bafoussam
├── Antenne Bertoua
└── Antenne Ngaoundéré
```

---

## 🚀 Démarrage

### Prérequis
- Java 17, Maven, MySQL 8
- Node.js 18+, npm

### Backend
```bash
cd backend/Antic
# Configurer MySQL dans application.properties si besoin
# (par défaut: root sans mot de passe, base cirt_db)
mvn spring-boot:run
```

**Compte initial créé automatiquement :**
- Email : `admin@antic.cm`
- Mot de passe : `Admin@1234!`
- Rôle : `super_admin` (Directeur CIRT)

### Frontend
```bash
cd frontend/app
npm install
cp .env.example .env
# .env : VITE_API_URL=http://localhost:8080
npm run dev
# → http://localhost:5173
```

---

## 🔗 API — Endpoints principaux

| Méthode | Endpoint                         | Accès                          |
|---------|----------------------------------|--------------------------------|
| POST    | `/auth/login`                    | Public                         |
| GET     | `/users/me`                      | Tous                           |
| GET     | `/users`                         | super_admin, admin_cirt, directeur_antenne |
| POST    | `/users`                         | super_admin, admin_cirt, directeur_antenne |
| DELETE  | `/users/{id}`                    | Selon rôle                     |
| GET     | `/dossiers`                      | Tous (filtré par rôle)         |
| POST    | `/dossiers`                      | agent_antenne uniquement       |
| PUT     | `/dossiers/{id}/validate`        | super_admin, admin_cirt, chef_service |
| PUT     | `/dossiers/{id}/archive`         | super_admin, admin_cirt, chef_service |
| GET     | `/categories`                    | Tous                           |
| POST    | `/categories/grant`              | super_admin, admin_cirt        |
| GET     | `/antennes`                      | Tous                           |
| GET     | `/organisation/services`         | Tous                           |
| GET     | `/stats/global`                  | Selon rôle                     |
| GET     | `/stats/antennes`                | Selon rôle                     |

---

## ⚠️ Changements majeurs vs version précédente

1. **4 → 6 rôles** : `chef_service` et `agent_cirt` sont nouveaux
2. **Nouvelles tables** : `sous_directions`, `services_cirt`
3. **Colonne `service_id`** ajoutée sur `users` et `dossiers`
4. **`/auth/login`** retourne maintenant `{token, user}` au lieu de juste `{token}`
5. **Rôle `agent`** renommé en `agent_antenne` — à migrer en base si existant
6. **`isActive`** sur User — comptes désactivés rejetés par JwtFilter
