Pour faire fonctionner le module, il est nécéssaire de créer un type de contenu côté Drupal, pour récupérer et afficher les contenus créés par l'administrateur. 

Le type de contenu à créer se nomme "Alerte Notification", dont le nom système est "alerte_notification". (/admin/structure/types/add)

Pour ce type de contenu, il faut créer deux champs : 

- Un champ texte (brut) appelé 'Body' dont le nom sysème est "body"
- Un champ liste (texte) "Nom de l'applicatif" dont le nom système est "field_nom_de_l_applicatif"