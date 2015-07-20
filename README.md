# departements

Voici une étude de cas pour la création d'une application pour Firefox OS donnant le nom des départements d'après leur numéro.

Les consignes sont les suivantes :

* L'application n'utilisera pas de Javascript.
* Elle sera orientée petits écrans.
* Pas de saisie au clavier virtuel.
* Accès au détail d'un départenemt avec carte en fond d'écran et surimpression des détails.

Ce document décrit une façon de concevoir ce genre d'application. Ce n'est pas forcément la meilleure. Ce qui importe, c'est le côté pédagogique.

## Structure générale de l'application

On aura une section principale qui permettra d'accéder aux départements d'après leur dixaine. Par exemple, le bouton "3-" donnera accès à une section donnant une liste des départements 30 à 39. En cliquant sur l'un de ces départements, on verra apparaître en superposition la carte des départements avec le bon dans une couleur différente, et une section donnant les détails de ce département.

## Comment mettre en évidence un département de la carte avec un seul SVG et sans Javascript ?

Tout sera fait en CSS grace au sélecteurs [:target](https://developer.mozilla.org/en-US/docs/Web/CSS/:target) et [X~Y](http://www.w3.org/TR/selectors/#general-sibling-combinators).

### La navigation générale

Le __target__ se base sur ce qui, dans l'URL, suit le symbole `#`. Dans notre application, nous aurons une `<section>` avec un ID __main__ qui aura des liens vers les différentes sous-listes de départements :
```
<section id="main">
  <a href="#0x">0-</a>
  <a href="#1x">1-</a>
  <a href="#2x">2-</a>
  <a href="#3x">3-</a>
  ...
</section>
```

Chacune de ces sous-liste sera représentée par une `<section>` :
```
<section id="1x">
  <ul>
    <li><a href="#10">10 - Aube</a></li>
    <li><a href="#11">11 - Aude</a></li>
    <li><a href="#12">12 - Aveyron</a></li>
    ...
  </ul>
</section>
```

Chaque section doit remplir l'écran entier, pour cela, nous ajouterons les règles CSS suivantes :
```
section {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: auto;
  height: auto;
  overflow: auto;
  display: none;
}
```

La propriété `overflow: auto` permet d'ajouter une barre de défilement si le contenu de la section est trop grand pour être affiché dans la section.

La propriété `display: none` rend invisible toute `<section>`.

Puisqu'on veut tout de même voir au moins la page principale, il faut ajouter :
```
section#main { display: block }
```

Et pour que les liens affichent la bonne page, il faut utiliser le sélecteur `:target` qui se base sur l'attribut `id` des `<section>` :
```
section:target { display: block }
```

### Le détail d'un département

Pour chaque département, on aura une `<section>` avec le numéro du département comme `id`.
```
<section id="12" class="d12">
  <dl>
    <dt>Département</dt><dl>Aveyron</dl>
    <dt>Préfecture</dt><dl>Rodez</dl>
    <dt>Sous-préfectures</dt><dl>Millau, Villefranche-de-Rouergue</dl>
  </dl>
</section>
```

Et en dernier, nous ajoutons la carte sous forme de tag `<svg>`. Pour que la carte apparaisse derrière les détails de département, il faut utiliser la propriété CSS `z-index` comme ceci :
```
#01, #02, #03, ... { z-index: 2 }
#carte { z-index: 1 }
```

Pour que la carte ne s'affiche que si un détail de département est visible, il faut faire :
```
#carte { display: none }
section.d01:target ~ svg,
section.d02:target ~ svg,
section.d03:target ~ svg,
section.d04:target ~ svg,
...
{ display: block }
```

On voit ici que la règle CSS est un peu longue puisqu'elle va comporter autant de sélecteurs que de départements. Heureusement, comme nous le verront plus tard, ce CSS ne sera pas généré à la main.

Et voici comment est représenté un département (ici l'aveyron) dans la carte SVG :
```
<path class="d d12" d="M 294.6875,353.375 L 289.15625,358.09375 L 289.15625,362.78125 L 287.78125,362.78125 L 287.21875,367.1875 L 285.84375,367.75 L 284.75,370.21875 L 278.65625,370.21875 L 278.125,369.40625 L 275.34375,... L 294.6875,353.375 z "/>

```

Le code CSS qui permet de mettre en bon département en orange est du même style que celui qui affiche la carte seulement pour les détails :
```
section.d01:target ~ svg path.d01,
section.d02:target ~ svg path.d02,
section.d03:target ~ svg path.d03,
section.d04:target ~ svg path.d04,
...
{ fill: orange }
```

## Écrire un générateur de code pour notre application

Taper à la main la liste des départements français ainsi que les règles CSS est fastidieux. Nous allons donc écrire un script Javascript que nous exécuterons avec [node.js](http://nodejs.org) pour créer la page `index.html` à notre place.

Ce script d'appelera `build.js`.

### Récupérer la liste des départements et la carte

Récupérons cette liste depuis [wikipedia](https://fr.wikipedia.org/wiki/Liste_des_d%C3%A9partements_fran%C3%A7ais). Copions le tableau (sans les en-têtes) dans un fichier nommé `departements.txt`.

Toujours sur [wikipedia](https://commons.wikimedia.org/wiki/File:D%C3%A9partements_de_France-simple.svg), téléchargeons une carte des départements de France au format SVG et sauvons la dans le fichier `metro.svg`.


