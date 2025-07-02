
jQuery(document).ready(function ($) {


        // quand on charge des fichiers
        $('#edit-file').on("change", function () {

                //on recupere le sous type et autre champ
                var sousType = document.getElementById("edit-soustype").value;
                //on cible la div de previsu qui va recevoir les donnees
                var previsu = document.getElementById("previsu");
                HTML = '<h2>Les documents suivants seront envoyés au circuit :<br /><span>' + sousType + '</span></h2>'
                //HTML += ' <table id="previsutable"><thead><tr><th>N°</th><th>Sous-type</th><th>Libellé (auto)</th><th>Fichiers</th><th>Date limite</th><th>GED</th></tr></thead>';
                HTML += ' <table id="previsutable"><thead><tr><th>N°</th><th>Fichiers</th></tr></thead>';
                // LES FICHIERS
                var docsFiles = document.getElementById("edit-file");
                // on loope dans les fichiers
                filesLength = docsFiles.files.length;
                i == 0;
                for (var i = 0; i < filesLength; i++) {
                        var num = i + 1;
                        HTML += '<tr><td>' + num + ' : </td>';
                        // HTML += '<td>'+sousType+'</td>';
                        var objet = docsFiles.files[i].name;
                        objet = (objet.split(".").slice(0, -1).join(".") || objet + "");
                        // HTML += '<td>'+objet+'</td>';
                        HTML += '<td>' + docsFiles.files[i].name + '</td>';
                        // HTML += '<td>'+dateLimiteDay+'/'+dateLimiteMonth+'/'+dateLimiteYear+'</td>';
                        // HTML += '<td>'+ged+'</td>';
                        HTML += '</tr>';
                        //  alert(docsFiles.files[i].name);
                };

                HTML += '</table>';
                HTML += '<div id="ficinfo"><i class="visu_warning fa-solid fa-triangle-exclamation"></i><p>Si vous avez fait une erreur ou oublié des fichiers, il suffit de retourner à l\'étape 2 pour recharger l\'ensemble de vos fichiers.</p></div>';
                previsu.innerHTML = HTML;
                //alert('fichiers !!!!'); 





        }); //fin onchange files



}); //fin jquery