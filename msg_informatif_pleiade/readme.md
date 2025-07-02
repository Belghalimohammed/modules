Pour fonctionner, il est nécéssaire de créer un type de contenu côté Drupal, pour récupérer et afficher les contenus créés par l'administrateur. 

Le type de contenu à créer se nomme "Message Informatif", dont le nom système est "message_informatif". (/admin/structure/types/add)

Pour ce type de contenu, il faut créer deux champs : 

- Un champ texte (brut) appelé 'Body' dont le nom sysème est "body"
- Un champ liste (texte) "Importance du message" dont le nom système est "field_importance_du_message"
