/* ===================================================================
   REDIMENSIONNEMENT AUTOMATIQUE DES IFRAMES D'ANIMATION (MathsIORI)
   -------------------------------------------------------------------
   Fichier PARTAGÉ, chargé par chaque cours.html qui contient au moins
   une iframe d'animation (animations/*.html). Ne jamais dupliquer
   cette logique dans un cours.html : ajouter uniquement, en fin de
   <body>, une seule ligne :
       <script src="../../iframe-autoresize.js"></script>
   (adapter le nombre de "../" selon la profondeur du chapitre, comme
   pour styles.css)

   Rôle : chaque fichier animations/*.html mesure sa propre hauteur de
   contenu et la transmet ici via postMessage. Ce script ajuste alors
   la hauteur de l'iframe correspondante pile à la bonne valeur — on
   n'a plus jamais besoin de deviner une hauteur à l'avance dans le
   HTML du cours (fini les animations coupées en bas faute de place).

   Protocole postMessage (contrat avec animations/*.html) :
     Animation → cours.html : { type: 'iframe-resize', height: <px> }
   =================================================================== */
window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'iframe-resize') return;
    var frames = document.querySelectorAll('iframe');
    for (var i = 0; i < frames.length; i++) {
        if (frames[i].contentWindow === e.source) {
            var h = parseInt(e.data.height, 10);
            if (h && h > 0) {
                frames[i].style.height = (h + 4) + 'px';
            }
            break;
        }
    }
});
