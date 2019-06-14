/**
 * Ce script lit les fichiers `style.css`, `departements.txt` et `metro.svg` et génère le fichier `www/index.html`.
 * Tous ces fichiers sont dans le même répertoire que le présent script.
 */
var FS = require("fs");

var output = FS.openSync("www/index.html", "w");
FS.writeSync(output, "<!DOCTYPE html>\n");
FS.writeSync(output, '<head><title>Les départements français</title><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>');
var departements = chargerLesDepartements("departements.txt");
writeStyle(output, departements);
FS.writeSync(output, "</head><body>");
writeMainSection(output, departements);
writeLists(output, departements);
writeDetails(output, departements);
writeMap(output, departements);

FS.writeSync(output, "</body></html>");
FS.closeSync(output);

/**
 * Ecrire le code <style></style> à  partir du fichier `style.css` et en
 * créant les sélecteurs pour la carte.
 */
function writeStyle(output, departements) {
  var contenu = FS.readFileSync("style.css").toString();
  FS.writeSync(output, "<style>" + contenu);
  departements.forEach(
    function(departement) {
      FS.writeSync(output, "section.d" + departement.numero + ":target~svg,");
    }
  );
  FS.writeSync(output, "svg.show{display:block}");
  departements.forEach(
    function(departement) {
      FS.writeSync(output, "section.d" + departement.numero + ":target~svg path.d" 
                   + departement.numero + ",");
    }
  );
  FS.writeSync(output, "svg.show{fill:orange}");
  FS.writeSync(output, "</style>");
}

function writeMap(output, departements) {
  var contenu = FS.readFileSync("metro.svg").toString();
  var begin = contenu.indexOf('<g id="complete_map">');
  var end = contenu.indexOf('<g class="zoom_box">');
  contenu = contenu.substr(begin, end - begin);
  contenu = compresserCarte(contenu);
  contenu = contenu.replace(/land departement/g, 'd d');
  contenu = '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" width="100%" height="100%" viewBox="0 0 510 560">'
    + contenu + "</svg>";
  FS.writeSync(output, contenu);
}

function writeDetails(output, departements) {
  departements.forEach(
    function(departement) {
      FS.writeSync(output, "<section id='" + departement.numero + "' class='d d" + departement.numero + "'>");
      FS.writeSync(output, "<h1>" + departement.numero + " - " + departement.nom + "</h1>");
      if (departement.prefecture) {
        FS.writeSync(output, "<p>Préfecture : <b>" + departement.prefecture + "</b></p>");
      }
      if (departement.sousPrefectures) {
        FS.writeSync(output, "<p><small>Sous-préfecture : <b>" + departement.sousPrefectures + "</b></small></p>");
      }
      FS.writeSync(output, "<footer><a class='back' href='#main'>Retour</a></section></footer>");
      FS.writeSync(output, "</section>");
    }
  );
}

/**
 * Ecrire les sections qui affichent les sous-listes des départements.
 */
function writeLists(output, departements) {
  var clef, section;
  var sections = {};
  departements.forEach(
    function(departement) {
      clef = departement.numero.substr(0, departement.numero.length - 1);
      section = sections[clef];
      if (!section) {
        section = [];
        sections[clef] = section;
      }
      section.push(departement);
    }
  );

  for (clef in sections) {
    section = sections[clef];
    FS.writeSync(output, "<section id='" + clef + "x'><dl>");
    section.forEach(
      function(departement) {
        FS.writeSync(output, "<a href='#" + departement.numero + "'><dt>" + departement.numero + "</dt>");
        FS.writeSync(output, "<dd>" + departement.nom + "</dd></a>");
      }
    );
    FS.writeSync(output, "</dl><a class='back' href='#main'>Retour</a></section>");
  }
}

/**
 * Ecrire le code HTML pour la section principale.
 */
function writeMainSection(output, departements) {
  FS.writeSync(output, "<section id='main'><h1>Choisissez votre département</h1>");
  var clef;
  var derniereClef = "";
  departements.forEach(
    function(departement) {
      clef = departement.numero.substr(0, departement.numero.length - 1);
      if (clef != derniereClef) {
        derniereClef = clef;
        FS.writeSync(output, "<a href='#" + clef + "x'>" + clef + "-</a>");
      }
    }
  );

  FS.writeSync(output, "</section>");
}

/**
 * Le fichier des départements est une copie brute depuis l'URL suivante :
 * https://fr.wikipedia.org/wiki/Liste_des_d%C3%A9partements_fran%C3%A7ais
 */
function chargerLesDepartements(nomDeFichier) {
  var contenu = FS.readFileSync(nomDeFichier).toString();
  var lignes = contenu.split("\n");
  var departement;
  var departements = [];
  var definition = null;
  lignes.forEach(
    function(ligne) {
      // On retire les espace en début et en fin de ligne.
      ligne = ligne.trim();
      //
      var premierCaractere = ligne.charAt(0);
      if (premierCaractere >= "0" && premierCaractere <= "9") {
        if (definition !== null) {
          departements.push(creerDepartement(definition));
        }
        definition = ligne;
      } else {
        // Les sous-préfectures forcent des sauts de ligne.
        if (definition != "75") {
          definition += ", " + ligne;
        }
      }
    }
  );
  if (definition !== null) {
    departements.push(creerDepartement(definition));
  }
  return departements;
}

/**
 * Une ligne  de définition  de département commence  par son  numéro et
 * possède ensuite des champs séparés par des tabulations.
 * Il existe des exceptions :
 * * __75__ : Paris n'a ni préfecture, ni sous-préfecture.
 */
function creerDepartement(ligne) {
  // Découper la ligne suivant les tabulations.
  var parties = ligne.split("\t");
  var numero = parties[0].trim();
  if (numero == "75") {
    return { numero: "75", nom: "Paris" };
  }
  return {
    numero: numero,
    nom: parties[1].trim(),
    prefecture: parties[2].trim(),
    sousPrefectures: parties[3].trim()
  };
}

/**
 * Les chemins SVG (`path`) sont trop précis pour nos besoins. Cela mène
 * à un fichier trop gros. Nous nous limitons à des coordonnées entières
 * pour éviter de gaspiller des octets.
 */
function compresserCarte(contenu) {
  var output = "";
  var index, cursor = 0;
  var path;
  for(;;) {
    index = contenu.indexOf("<path d=", cursor);
    if (index < 0) break;
    output += contenu.substr(cursor, index - cursor) + "<path d=";
    cursor = index + 9;
    index = contenu.indexOf('"', cursor);
    path = contenu.substr(cursor, index - cursor);
    cursor = index + 1;
    output += '"' + simplifierChemin(path) + '"';
  }

  output += contenu.substr(cursor);
  return output;
}

function simplifierChemin(chemin) {
  var commandes = [];
  var c, index, nombre, mode = 0;
  for (index = 0 ; index < chemin.length ; index++) {
    c = chemin.charAt(index);
    if (mode == 0) {
      if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
        commandes.push(c);
      }
      else if (c == '-' || c == '.' || (c >= '0' && c <= '9')) {
        mode = 1;
        nombre = c;
      }
    }
    else if (mode == 1) {
      if (c == '-' || c == '.' || (c >= '0' && c <= '9')) {
        nombre += c;
      } else {
        mode = 0;
        commandes.push(parseFloat(nombre));
      }
    }
  }
  if (mode == 1) {
    commandes.push(parseFloat(nombre));
  }
  // Recoller les morceaux en évitant les espace superflus.
  var laDerniereCommandeEtaitUnNombre = false;
  var output = "";
  commandes.forEach(
    function(cmd) {
      var cetteCommandeEstUnNombre = (typeof cmd === 'number');
      if (laDerniereCommandeEtaitUnNombre && cetteCommandeEstUnNombre) {
        output += ",";
      }
      laDerniereCommandeEtaitUnNombre = cetteCommandeEstUnNombre;
      output += cetteCommandeEstUnNombre ? Math.floor(.5 + cmd) : cmd;
    }
  );

  return output;
}
