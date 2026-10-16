# Mise à jour de `main.tex` — évolutions v1.1

Ce fichier liste les modifications à reporter dans la version de `main.tex` que vous m'avez collée. Elle diffère de celle du dépôt (803 lignes, plan plus ancien), donc je n'ai pas modifié le dépôt directement. Chaque bloc donne l'ancre à chercher, puis le texte à insérer ou à remplacer.

**Principe retenu : ne rien réécrire des résultats.** La collecte du 24 juin 2026 (chapitre 3) a été faite avec la méthode v1.0. Aucune collecte n'a encore été faite avec la v1.1. Les chiffres du chapitre 3 restent donc valides, mais ils sont signalés comme « version 1.0 ». Les évolutions sont décrites comme réalisées et testées, sans résultat chiffré.

Blocs à appliquer : 1 sigles, 2 nouvelle sous-section (méthode), 3 collecteur, 4 base de données, 5 API, 6 séquence de collecte, 7 tableau des absences, 8 discussion, 9 conclusion générale, 10 annexe D.

---

## Bloc 1 — Sigles et abréviations

**Chercher** la ligne `REST      & Representational State Transfer \\` et **insérer avant** :

```latex
RADB     & Routing Assets Database \\
```

---

## Bloc 2 — Nouvelle sous-section (chapitre 2, méthode d'évaluation)

**Insérer** juste après le tableau `tab:absences` (après `\end{table}`) et avant `% ---...` / `\section{Réalisation}` :

```latex
\subsection{Évolutions de la méthode (version 1.1)}
\label{sec:v11}

Trois évolutions ont été apportées à l'outil après la collecte du 24 juin 2026. Elles répondent à des limites relevées dans la discussion du chapitre~3. Les résultats de ce chapitre ont été obtenus avec la version~1.0 décrite plus haut ; la version~1.1 est implémentée et testée, mais elle n'a pas encore été appliquée à une collecte complète.

\subsubsection{Anti-usurpation à trois valeurs}

Dans la version~1.0, un ASN absent des données Spoofer recevait $A=0$ : il était compté comme non conforme alors qu'il n'avait jamais été testé. L'indicateur prend désormais trois valeurs (tableau~\ref{tab:ternaire}).

\begin{table}[H]
\caption{Indicateur d'anti-usurpation à trois valeurs}
\label{tab:ternaire}
\centering
\begin{tabularx}{\textwidth}{|c|X|X|}
\hline
\textbf{$A(a)$} & \textbf{Situation} & \textbf{Traitement dans le score} \\
\hline
1 & $a$ est testé par Spoofer et bloque (taux de blocage supérieur à 50\,\%) & Compte pour un point \\
\hline
0 & $a$ est testé par Spoofer et ne bloque pas & Compte pour zéro point, sur quatre actions évaluées \\
\hline
$\varnothing$ & $a$ n'a jamais été testé (ou les données Spoofer sont injoignables) & Action « non évaluée » : exclue du calcul \\
\hline
\end{tabularx}
\end{table}

Une action non évaluée ne pénalise pas l'ASN. Soit $E(a)$ l'ensemble des indicateurs de $a$ qui ne valent pas $\varnothing$ et $n(a)=|E(a)|$. Comme seul $A$ peut valoir $\varnothing$, on a $n(a)\in\{3,4\}$. Le score en points reste la somme des indicateurs évalués, et un score normalisé le ramène sur quatre pour rester comparable d'un ASN à l'autre :
\[
S(a)=\sum_{i\in E(a)} i(a), \qquad \tilde S(a)=\frac{4\,S(a)}{n(a)}.
\]
Par exemple, un ASN avec $F=1$, $C=1$, $V=0$ et $A=\varnothing$ a $S=2$ sur $n=3$ actions évaluées, donc $\tilde S=2{,}67$. Avec $A=0$ (testé, ne bloque pas), il aurait $S=2$ sur $n=4$ et $\tilde S=2{,}00$. Les moyennes par pays et la moyenne globale utilisent $\tilde S$. La base conserve $S(a)$, $n(a)$ et $\tilde S(a)$, et l'interface affiche « Non évalué » à la place de l'icône d'échec.

\subsubsection{Filtrage : vérification des objets IRR}

Dans la version~1.0, $F(a)$ reposait sur le seul champ \texttt{irr\_as\_set} de PeeringDB, et les ASN absents de PeeringDB avaient $F=0$. La version~1.1 interroge directement les registres IRR du RIPE, de RADB et d'AFRINIC, par le protocole WHOIS (port~43), avec la requête \texttt{-i origin AS<numéro>}. Elle compte les objets \texttt{route} et \texttt{route6} dont l'origine est l'ASN. Soit $I(a)$ le nombre d'objets trouvés, tous registres confondus :
\[
F(a)=1 \iff \texttt{irr\_as\_set}(a)\neq\emptyset \ \text{ ou } \ I(a)>0.
\]
Un registre injoignable n'est pas interprété comme une absence d'objets : si aucun registre ne répond, l'indicateur retombe sur le champ PeeringDB. La base conserve le nombre d'objets et la liste des registres où ils existent. Cet indicateur mesure plus directement la documentation des filtres, car un objet \texttt{route} est la matière avec laquelle un opérateur construit ses filtres \cite{RFC2622}. Il garde la limite déjà signalée : l'application réelle des filtres sur les routeurs reste invisible. Comme les registres se recopient en partie (RADB reprend des objets d'autres registres), $I(a)$ peut compter deux fois un même préfixe ; seul le test $I(a)>0$ intervient dans le calcul de $F$. La collecte envoie en plus trois requêtes WHOIS par ASN, avec une pause de 0,3 seconde entre deux requêtes.

\subsubsection{Historique des collectes}

La version~1.0 écrasait les résultats à chaque passage (paragraphe sur la base de données). La version~1.1 conserve un instantané de chaque collecte dans trois tables (tableau~\ref{tab:historique}).

\begin{table}[H]
\caption{Tables de l'historique des collectes}
\label{tab:historique}
\centering
\begin{tabularx}{\textwidth}{|l|X|}
\hline
\textbf{Table} & \textbf{Contenu} \\
\hline
\texttt{collections} & Une ligne par collecte : identifiant, dates de début et de fin, statut, pays en échec, totaux \\
\hline
\texttt{collection\_country\_stats} & Pour chaque collecte et chaque pays : nombre d'ASN, de membres, score moyen normalisé, couverture ROA et nombre d'ASN conformes par action (dont ASN testés par Spoofer) \\
\hline
\texttt{collection\_asn\_results} & Pour chaque collecte et chaque ASN : les quatre actions (avec \texttt{NULL} pour une action non évaluée), les scores $S$, $n$ et $\tilde S$, la couverture ROA \\
\hline
\end{tabularx}
\end{table}

L'instantané est pris à la fin de la collecte, à partir des tables \texttt{asn} et \texttt{prefixes}. Le statut d'une collecte vaut \texttt{completed}, \texttt{partial} si au moins un pays n'a pas pu être collecté (ses codes sont conservés), ou \texttt{failed}. Les tables \texttt{asn} et \texttt{prefixes} gardent leur rôle d'état courant. L'historique permet de comparer deux collectes, de suivre l'évolution d'un pays ou d'un opérateur, et d'évaluer l'effet d'une campagne de sensibilisation en comparant des collectes avant et après. Le schéma est appliqué de façon idempotente au démarrage du collecteur, ce qui migre une base existante sans intervention. Les ASN déjà enregistrés par la version~1.0 gardent $A=0$ jusqu'à leur prochaine collecte, car rien ne permet de savoir s'ils avaient été testés.

\subsubsection{Vérification}

Le calcul du score (y compris les cas d'action non évaluée) et l'extraction des objets IRR (contre un serveur WHOIS simulé, avec un registre injoignable) sont couverts par sept tests unitaires. La migration d'une base v1.0, l'écriture de l'instantané et les points d'accès de l'historique ont été vérifiés sur une base PostgreSQL de test. Les requêtes WHOIS réelles vers les trois registres n'ont pas encore été exécutées en conditions réelles : l'effet de ces évolutions sur les résultats reste à mesurer par une nouvelle collecte.
```

---

## Bloc 3 — Collecteur (chapitre 2, réalisation)

**Chercher** : `Le collecteur a quatre modules : \texttt{config.py} (liste des seize pays, adresses des sources, clé MANRS lue dans l'environnement), \texttt{apis.py} (appels aux sources, avec gestion des erreurs et pauses), \texttt{db.py} (enregistrement en base) et \texttt{main.py} (déroulement de la collecte et planification).`

**Remplacer par** :

```latex
Le collecteur a cinq modules : \texttt{config.py} (liste des seize pays, adresses des sources, registres IRR, clé MANRS lue dans l'environnement), \texttt{apis.py} (appels aux sources, avec gestion des erreurs et pauses), \texttt{scoring.py} (calcul du score à partir des quatre actions, introduit par la version~1.1), \texttt{db.py} (enregistrement en base et historique) et \texttt{main.py} (déroulement de la collecte et planification). Les évolutions de la version~1.1 sont décrites à la section~\ref{sec:v11}.
```

---

## Bloc 4 — Base de données (chapitre 2, réalisation et conception)

**4a. Chercher** : `Conséquence : la base ne garde pas d'historique. Pour comparer deux collectes, il faut sauvegarder leurs résultats à part.`

**Remplacer par** :

```latex
Dans la version~1.0, la base ne gardait donc pas d'historique : pour comparer deux collectes, il fallait sauvegarder leurs résultats à part. La version~1.1 corrige ce point par trois tables d'historique (section~\ref{sec:v11}), tandis que \texttt{asn} et \texttt{prefixes} continuent de porter l'état courant.
```

**4b. Chercher** : `Le diagramme ne compte que trois classes parce que la base n'a que trois tables.`

**Remplacer par** :

```latex
Le diagramme ne compte que trois classes parce que la base de la version~1.0, utilisée pour la collecte du 24 juin 2026, n'a que trois tables. La version~1.1 ajoute des colonnes à \texttt{asn} (\texttt{actions\_evaluated}, \texttt{manrs\_score\_normalized}, \texttt{irr\_route\_objects}, \texttt{irr\_sources}), rend \texttt{action\_antispoofing} nullable, et ajoute les trois tables du tableau~\ref{tab:historique} (annexe~D).
```

**4c. Chercher** (liste des règles de gestion) : `\item[--] le score d'un ASN reste entre 0 et 4 ;` et **ajouter après** :

```latex
    \item[--] (version~1.1) l'action anti-usurpation d'un ASN vaut vrai, faux ou \texttt{NULL} (non évaluée), et le nombre d'actions évaluées reste entre 1 et 4 ;
```

---

## Bloc 5 — API REST (chapitre 2)

**5a. Chercher** : `L'API a cinq points d'accès en lecture, résumés dans le tableau~\ref{tab:endpoints}.`

**Remplacer par** : `L'API a cinq points d'accès en lecture dans la version~1.0, auxquels la version~1.1 en ajoute cinq pour l'historique ; tous sont résumés dans le tableau~\ref{tab:endpoints}.`

**5b. Dans le tableau `tab:endpoints`, insérer avant `\end{tabularx}`** (donc après la ligne `search`) :

```latex
\texttt{GET /api/collections} & (v1.1) Liste des collectes : dates, statut, totaux \\
\hline
\texttt{GET /api/collections/\{id\}} & (v1.1) Une collecte et ses agrégats par pays ; erreur 404 si elle est inconnue \\
\hline
\texttt{GET /api/collections/\{id\}/asn} & (v1.1) Résultats par ASN d'une collecte, filtrables par pays \\
\hline
\texttt{GET /api/countries/\{code\}/history} & (v1.1) Évolution d'un pays d'une collecte à l'autre \\
\hline
\texttt{GET /api/asn/\{numéro\}/history} & (v1.1) Évolution d'un ASN d'une collecte à l'autre \\
\hline
```

**5c.** À la suite du tableau, dans la phrase « L'API ne permet aucune écriture. », rien à changer. Dans la fiche `GET /api/asn/{numéro}`, les actions peuvent désormais valoir `null` et la réponse contient `actions_evaluated`, `manrs_score_normalized` et `irr`. Pour l'indiquer, **chercher** `Fiche d'un ASN : score, état des quatre actions, préfixes et statuts ; erreur 404 si l'ASN est inconnu` et **remplacer par** :

```latex
Fiche d'un ASN : score, état des quatre actions (une action peut valoir \texttt{null}, non évaluée, depuis la version~1.1), score normalisé, objets IRR, préfixes et statuts ; erreur 404 si l'ASN est inconnu
```

---

## Bloc 6 — Séquence de collecte (chapitre 2, conception)

**6a. Tableau `tab:scenario-collecte`.** Chercher les lignes 7 à 9 et les **remplacer par** :

```latex
7 & Collecteur & Demande la fiche PeeringDB de l'ASN \\
\hline
8 & Collecteur & (v1.1) Interroge les registres IRR (RIPE, RADB, AFRINIC) pour les objets \texttt{route} de l'ASN \\
\hline
9 & Collecteur & Calcule le score de l'ASN (actions non évaluées exclues) et enregistre le résultat \\
\hline
10 & Collecteur & Recalcule les agrégats du pays \\
\hline
11 & Collecteur & (v1.1) À la fin de la collecte de tous les pays, enregistre l'instantané dans l'historique \\
\hline
```

**6b. Puces d'exception.** Chercher `à l'étape 5, 6 ou 7, si la requête vers la source échoue` et remplacer par `à l'étape 5, 6, 7 ou 8, si la requête vers la source échoue`. À la fin de la phrase, ajouter : `Un registre IRR injoignable n'est pas compté comme une absence d'objets.`

**6c. Diagramme `fig:seq-collecte`.** Quatre insertions :

```latex
% après  \newinst[0.5]{pdb}{:PeeringDB}{}
\newinst[0.5]{irr}{:Registres IRR}{}

% après le bloc  \begin{call}{col}{fiche}{pdb}{IRR, présence} ... \end{call}
\begin{call}{col}{objets route}{irr}{nombre}
\end{call}

% dans la boucle des lignes pointillées, remplacer
%   \foreach \p in {col,man,rip,val,pdb,bdd} {
% par
\foreach \p in {col,man,rip,val,pdb,irr,bdd} {

% après la ligne  \node[inststyle,anchor=center] at (pdb |- seqend) {:PeeringDB};
\node[inststyle,anchor=center] at (irr |- seqend) {:Registres IRR};
```

Je n'ai pas pu compiler le document (pas de LaTeX ni de `eneam.cls` ici) : vérifiez le rendu de ce diagramme. Si la figure devient trop large, réduisez les espacements `\newinst[0.5]`.

---

## Bloc 7 — Tableau des absences (`tab:absences`)

**7a. Chercher** : `ASN absent des données Spoofer & $A=0$ & Un ASN non testé est compté comme non conforme : l'anti-usurpation est sous-estimée \\`

**Remplacer par** :

```latex
ASN absent des données Spoofer & $A=0$ (version~1.0) ; $A=\varnothing$, action non évaluée (version~1.1) & Version~1.0 : un ASN non testé est compté comme non conforme, l'anti-usurpation est sous-estimée. Version~1.1 : il est exclu du calcul (section~\ref{sec:v11}) \\
```

**7b. Chercher** : `ASN sans fiche PeeringDB & $F=0$ et $C=0$ & Pas de fiche ne prouve pas l'absence de pratique : sous-estimation possible \\`

**Remplacer par** :

```latex
ASN sans fiche PeeringDB & $C=0$ ; $F=0$ en version~1.0, $F$ complété par les objets IRR en version~1.1 & Pas de fiche ne prouve pas l'absence de pratique : sous-estimation possible \\
```

---

## Bloc 8 — Chapitre 3 : signaler la version et nuancer la discussion

**8a. Dans « Déroulement de la collecte » (résultats),** **chercher** la phrase : `La collecte a eu lieu le 24 juin 2026 pour les seize pays.` et **la remplacer par** :

```latex
La collecte a eu lieu le 24 juin 2026 pour les seize pays, avec la version~1.0 de l'outil : toutes les valeurs de ce chapitre sont celles de cette version (anti-usurpation binaire, filtrage mesuré par PeeringDB seul, sans historique). Les évolutions de la version~1.1 sont décrites à la section~\ref{sec:v11}.
```

**8b. Discussion, « Résultats par action MANRS ».** **Chercher** la fin du paragraphe sur $F$ : `$F$ mesure donc la documentation des filtres, pas la sécurité effective : il ne doit pas être lu comme une preuve de filtrage.` et **ajouter à la suite** :

```latex
La version~1.1 complète cet indicateur par une vérification directe des objets \texttt{route} dans les registres IRR, ce qui le rapproche de la documentation réelle des filtres, sans lever cette limite.
```

**8c. Chercher** : `C'est le point le plus faible des indicateurs, et nous ne pouvons pas dire en quelle proportion les deux cas se répartissent.` et **remplacer par** :

```latex
C'était le point le plus faible des indicateurs de la version~1.0, et nous ne pouvons pas dire, pour cette collecte, en quelle proportion les deux cas se répartissent. La version~1.1 les distingue (section~\ref{sec:v11}) : une nouvelle collecte permettra de chiffrer la part des ASN réellement testés.
```

**8d. Limites des indicateurs.** **Chercher** : `$A$ ne peut pas distinguer un ASN testé qui ne bloque pas d'un ASN jamais testé.` et **remplacer par** :

```latex
$A$, dans la version~1.0 utilisée pour ces résultats, ne peut pas distinguer un ASN testé qui ne bloque pas d'un ASN jamais testé (limite levée dans la version~1.1).
```

**8e. Limites de généralisation.** **Chercher** : `Elle ne permet pas de conclure sur l'évolution de la sécurité du routage, ni sur les autres régions d'Afrique.` et **remplacer par** :

```latex
Elle ne permet pas de conclure sur l'évolution de la sécurité du routage, ni sur les autres régions d'Afrique. L'historique des collectes introduit dans la version~1.1 permettra d'étudier cette évolution à mesure que les collectes s'accumulent.
```

---

## Bloc 9 — Conclusion générale (perspectives)

**9a. Chercher** les trois puces `un historique des collectes : une table \texttt{collections} ...`, `un indicateur d'anti-usurpation à trois valeurs ...` et `l'ajout des objets \texttt{route} de l'IRR à l'indicateur $V$ ...` et **les remplacer par** :

```latex
    \item[--] une nouvelle collecte complète avec la version~1.1, qui permettra de mesurer l'effet des évolutions décrites à la section~\ref{sec:v11} (part des ASN réellement testés par Spoofer, ASN passant à $F=1$ grâce aux objets IRR) et d'amorcer l'historique ;
    \item[--] l'extension de la prise en compte des objets \texttt{route} de l'IRR à l'indicateur $V$, pour couvrir toute l'action~4 (la version~1.1 les utilise pour $F$) ;
    \item[--] des collectes répétées, comparées entre elles grâce aux tables \texttt{collections}, \texttt{collection\_country\_stats} et \texttt{collection\_asn\_results}, pour évaluer l'effet de campagnes de sensibilisation sur un pays ou un opérateur et pour proposer une page d'évolution dans l'interface ;
```

**9b. Avant ces puces, ajouter un paragraphe** (juste avant `Ce travail ouvre aussi plusieurs suites`) :

```latex
Trois de ces pistes ont été réalisées après la collecte : l'anti-usurpation à trois valeurs, la vérification des objets IRR pour le filtrage et l'historique des collectes (section~\ref{sec:v11}). Elles sont implémentées et testées, mais pas encore appliquées à une collecte complète.
```

---

## Bloc 10 — Annexe D : schéma de la version 1.1

**Insérer** après la figure `lst:ddl` (Annexe C) et avant `\clearpage\phantomsection...tableofcontents` :

```latex
\section*{Annexe D : évolutions du schéma (version 1.1)}

Les instructions suivantes, extraites de \texttt{backend/db/schema.sql} \cite{Zinsou2026}, sont idempotentes : elles sont appliquées au démarrage du collecteur et migrent une base de la version~1.0.

\begin{figure}[H]
\begin{lstlisting}[language=SQL]
-- Anti-usurpation ternaire : NULL = non teste
ALTER TABLE asn ALTER COLUMN action_antispoofing DROP DEFAULT;
ALTER TABLE asn ADD COLUMN IF NOT EXISTS actions_evaluated
    SMALLINT DEFAULT 4 CHECK (actions_evaluated BETWEEN 1 AND 4);
ALTER TABLE asn ADD COLUMN IF NOT EXISTS manrs_score_normalized
    DECIMAL(3,2) DEFAULT 0;
-- Objets IRR (RIPE, RADB, AFRINIC)
ALTER TABLE asn ADD COLUMN IF NOT EXISTS irr_route_objects
    INTEGER DEFAULT 0;
ALTER TABLE asn ADD COLUMN IF NOT EXISTS irr_sources VARCHAR(100);

-- Historique des collectes
CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'running'
        CHECK (status IN ('running','completed','partial','failed')),
    countries_failed TEXT,
    total_asn INTEGER,
    manrs_members INTEGER,
    avg_manrs_score DECIMAL(3,2)
);
-- collection_country_stats : cle (collection_id, country_code)
-- collection_asn_results   : cle (collection_id, asn_number)
\end{lstlisting}
\caption{Évolutions du schéma de la version~1.1 (extrait).}
\label{lst:ddl11}
\end{figure}
```

Remarque : dans cette annexe, `\thefigure` est de la forme `A.n` ; les figures de l'annexe D suivent donc la même numérotation.

---

## Éléments volontairement laissés inchangés

- **Résumé / Abstract, introduction, plan** : ils décrivent les résultats du 24 juin, toujours vrais. Aucun chiffre n'a changé.
- **Tableaux de résultats (chapitre 3)** : ils proviennent de la version 1.0 ; seule la mention de version est ajoutée (bloc 8a).
- **Tableau `tab:sources` et formalisation `tab:formalisation`** : ils décrivent la version 1.0. La section v1.1 les complète sans les contredire.
- **Citations** : aucune nouvelle entrée de `biblio.bib` n'est nécessaire. La section v1.1 cite uniquement `RFC2622`, déjà présent.
- **Cohérence à vérifier** : le texte dit « cinq sources » partout. La version 1.1 ajoute les registres IRR comme sources d'objets `route`, mais le chapitre garde « cinq sources » pour la collecte du 24 juin.
