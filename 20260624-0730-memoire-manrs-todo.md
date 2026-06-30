---
id: "20260624-0730"
title: "Mémoire MANRS — TODO restant"
aliases: [todo-manrs, reste-a-faire-manrs]
type: projet
status: active
domaines: [cybersécurité, réseau, développement-web]
tags: [mémoire, eneam, manrs, todo]
debut: "2026-06-24"
echeance: ""
stack: []
repo: "~/projects/mémoire 2026"
liens: []
created: "2026-06-24"
updated: "2026-06-24"
---

# Mémoire MANRS — Ce qui reste à faire

> État au 24 juin 2026, après la première session de développement complète.

---

## 1. Projet technique

### Priorité haute

- [ ] **Dockerfile frontend** — `manrs-observatory/frontend/Dockerfile` n'existe pas. Le docker-compose ne peut pas lancer le frontend en conteneur. Créer un Dockerfile multi-stage (build Vite + serve nginx).
- [ ] **README.md racine** — `manrs-observatory/README.md` manquant. Le CDC exige qu'un tiers puisse lancer le projet en 10 minutes. Doit contenir : prérequis, clone, variables d'environnement (`DATABASE_URL`, `MANRS_API_KEY`), `docker compose up`, URLs des services.
- [ ] **Repo GitHub public** — Le code n'est pas encore sur GitHub. Créer le repo, push, ajouter le lien dans le mémoire et le README.
- [ ] **Clé API MANRS — renouvellement** — La clé `78a05093-...` expire le 27 juin 2026 (3 jours). Il faut soit automatiser le renouvellement, soit créer une clé sans expiration si possible.

### Priorité moyenne

- [ ] **Démo en ligne** — Le CDC demande une URL accessible. Options : Render.com (free tier) pour backend+DB, Vercel/Netlify pour frontend. Nécessite le Dockerfile frontend.
- [ ] **docker-compose — test complet** — Le docker-compose.yml existe mais n'a pas été testé en mode `docker compose up` complet (API + collecteur + frontend + DB ensemble). Tester et corriger.
- [ ] **Nettoyage frontend** — Supprimer les fichiers Vite par défaut inutilisés (`src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`, `frontend/@/` dossier orphelin shadcn).

### Priorité basse

- [ ] **Module IA (optionnel)** — Exclu par décision. Si réintégré plus tard : endpoint `/api/asn/{number}/recommendation`, cache en table `ai_recommendations`, appel API Claude avec prompt BGP. Le schéma SQL est déjà prêt (table existe).
- [ ] **Code splitting frontend** — Le bundle JS fait 847 KB (warning Vite). Lazy-load des pages avec `React.lazy()` pour passer sous 500 KB.

---

## 2. Mémoire LaTeX

### Page de garde (5 champs)

- [ ] `\maitrememoire{[NOM DU DIRECTEUR DE MÉMOIRE]}`
- [ ] `\titremaitrememoire{[Titre du directeur]}`
- [ ] `\maitrestage{[NOM DU MAÎTRE DE STAGE]}`
- [ ] `\titremaitrestage{[Titre du maître de stage]}`
- [ ] `\jury{...}` — Président et Vice-président
- [ ] `\datesoutenance{[Date de soutenance]}`

### Dédicace (1 section)

- [ ] Ligne 99 : `[À compléter par l'auteur]`

### Chapitre 1 — Déroulement du stage (7 sections)

- [ ] **Section 2.1** — Identité de la structure : nom, mission, secteur, localisation
- [ ] **Section 2.2** — Organisation : organigramme, équipe, rôle dans l'équipe
- [ ] **Section 3** — Travaux effectués : description des tâches réalisées
- [ ] **Section 3.1** — Participation technique : détails des contributions
- [ ] **Section 4** — Apports professionnels : compétences acquises
- [ ] **Section 5.1** — Difficultés rencontrées
- [ ] **Section 5.2** — Suggestions d'amélioration

### Améliorations optionnelles

- [ ] Ajouter un diagramme d'architecture (type draw.io) dans le chapitre 3, en plus des captures d'écran
- [ ] Ajouter un schéma du flux de collecte (APIs → collecteur → DB → API → frontend)
- [ ] Vérifier la numérotation des figures (warnings `duplicate destination` dans le log LaTeX — conflit entre la classe eneam.cls et les `\renewcommand` manuels)

---

## 3. Soutenance

- [ ] **Présentation 10 slides** — Exigé par le CDC. Plan suggéré :
  1. Page de titre
  2. Contexte : BGP vulnérable, Afrique de l'Ouest exposée
  3. Problématique + objectifs
  4. Architecture de l'observatoire (schéma)
  5. Sources de données (5 APIs, tableau)
  6. Démo : capture dashboard + carte
  7. Résultats clés (477 ASN, 2.3% MANRS, 0% anti-spoofing)
  8. Résultats par pays (tableau top/bottom)
  9. Recommandations + limites
  10. Conclusion + perspectives

---

## 4. Ce qui est FAIT (ne pas refaire)

- ✅ Schéma SQL (4 tables + index + seed)
- ✅ Collecteur Python (5 sources, 4 actions MANRS, scheduling 6h)
- ✅ API FastAPI (5 endpoints, CORS, JSON conforme au CDC)
- ✅ Frontend React (5 pages, Atomic Design, shadcn/ui, Phosphor Icons, Recharts, Leaflet)
- ✅ Docker Compose (PostgreSQL 15 avec healthcheck, API, collecteur)
- ✅ Collecte complète (477 ASN, 6810 préfixes, 16 pays, 111 min)
- ✅ Clé API MANRS obtenue (compte franckzinsou06@gmail.com, mdp ManrsObs2026!)
- ✅ Mémoire LaTeX (36 pages, 4 chapitres, 4 figures, bibliographie biblatex)
- ✅ Journal de développement (JOURNAL_DEV.md)
- ✅ Notes Brain (4 notes : projet, concepts, technique, sources)

---

## Fichiers clés

| Fichier | Chemin |
|---------|--------|
| Mémoire LaTeX | `~/projects/mémoire 2026/main.tex` |
| Bibliographie | `~/projects/mémoire 2026/biblio.bib` |
| CDC source | `~/projects/mémoire 2026/CDC_Technique_MANRS_Observatory_Etudiant.docx` |
| Code projet | `~/projects/mémoire 2026/manrs-observatory/` |
| Journal dev | `~/projects/mémoire 2026/manrs-observatory/JOURNAL_DEV.md` |
| Notes Brain | `~/Brain/projets/20260623-2355-memoire-manrs-observatory.md` |
