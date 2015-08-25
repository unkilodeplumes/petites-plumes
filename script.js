/* Copyright 2015 Jules and Theo Zimmermann
   All rights reserved
**/

"use strict"

// localStorage getters and setters
var store = function() {
  // local attributes
  var versionNb = localStorage.versionNb || 0;
  var editNb = localStorage["editNb(" + versionNb + ")"] || 0;
  const initialInfo = 'Espace à remplir par un texte initial.\n\nPour sauvegarder un nouveau texte, cliquer sur "Proposer la modification" puis entrer "edit".\nLa première fois, il faudra choisir un mot de passe qui sera demandé les fois suivantes.'

  var getEditNb = function() {
    return editNb;
  };

  var getEditName = function(i) {
    return localStorage["editName(" + versionNb + "," + i + ")"];
  };

  var getEditText = function(i) {
    return localStorage["editText(" + versionNb + "," + i + ")"];
  };

  var getText = function() {
    var inStore = localStorage["text(" + versionNb + ")"];
    return (typeof(inStore) === "undefined") ? initialInfo : inStore;
  };

  var addEdit = function(name, text) {
    editNb++;
    localStorage["editNb(" + versionNb + ")"] = editNb;
    localStorage["editText(" + versionNb + "," + editNb + ")"] = text;
    localStorage["editName(" + versionNb + "," + editNb + ")"] = name;
  };

  var setText = function(value) {
    // every time the main text changes, the version changes
    versionNb++;
    localStorage.versionNb = versionNb;
    editNb = 0;
    localStorage["text(" + versionNb + ")"] = value;
  };

  var setPassword = function(value) {
    localStorage.password = CryptoJS.MD5(value);
  };

  var checkPassword = function(value) {
    // stored value is a string and hashed value is an object
    // thus we need to check equality modulo conversion
    return localStorage.password == CryptoJS.MD5(value);
  };

  var noPassword = function() {
    return typeof(localStorage.password) === "undefined";
  }

  var clear = function() {
    localStorage.clear();
    versionNb = 0;
    editNb = 0;
  };

  return {
    getEditNb: getEditNb,
    getEditName: getEditName,
    getEditText: getEditText,
    getText: getText,
    addEdit: addEdit,
    setText: setText,
    setPassword: setPassword,
    checkPassword: checkPassword,
    noPassword: noPassword,
    clear: clear
  };
}();

var alert = function(message, width) {
  width = width ? width : 300;
  $("<div>" + message + "</div>").dialog({
    resizable: false,
    width: width,
    modal: true,
    buttons: {
      Ok: function() {
        $(this).remove();
      }
    }
  });
};

var confirm = function(message, callback) {
  $("<div>" + message + "</div>").dialog({
    resizable: false,
    modal: true,
    buttons: {
      Continuer: function() {
        $(this).remove();
        callback();
      },
      Annuler: function() {
        $(this).remove();
      }
    }
  });
};

var prompt = function(message, callback, password) {
  var type = password ? "password" : "text";
  var dialog = $('<div><p><label for="prompt">' + message + '</label><p><input id="prompt" type="' + type + '" autocomplete="off"></div>').dialog({
    autoOpen: false,
    resizable: false,
    modal: true,
    buttons: {
      Continuer: function() {
        var value = $("#prompt").val();
        $(this).remove();
        callback(value);
      },
      Annuler: function() {
        $(this).remove();
        callback(null);
      }
    }
  });
  $("#prompt").keypress(function(e) {
    if (e.which === 13) {
      var value = $("#prompt").val();
      dialog.remove();
      callback(value);
    }
  });
  dialog.dialog("open");
};

var passwordOk = function(toSet, callback) {
  if (store.noPassword()) {
    if (toSet) {
      prompt("Choisir un mot de passe :", function(value) {
        if (value === null) {
          alert("<p>Opération annulée !");
        }
        else {
          store.setPassword(value);
          callback();
        }
      }, true);
    }
    else {
      callback();
    }
  }
  else {
    prompt("Mot de passe ?", function(password) {
      if (store.checkPassword(password)) {
        callback();
      }
      else {
        alert("<p>Mot de passe incorrect !");
      }
    }, true);
  }
}

$(document).ready(function() {

  var text = $("#text");
  var edits = $("#edits");

  // make a diff_match_patch object once and for all
  var dmp = new diff_match_patch();

  var textUnchanged = function() {
    var textarea = $("#text textarea");
    return textarea.length === 0 || textarea.val() === store.getText();
  };

  var showEdit = function(i) {
    edits.append('<p><button class="edit" id="edit' + i + '">' + store.getEditName(i) + '</button></p>');
    $("#edit" + i).click(function() {
      // active -> unactive / unactive -> active

      // if was active
      if ($(this).hasClass("active")) {
        // unactivate button
        $(this).removeClass("active");
        showText();
        return;
      }
      var that = $(this);

      var activate = function() {
        // unactivate other active buttons
        $("button.active").removeClass("active");
        that.addClass("active");

        var texti = store.getEditText(i);
        if (typeof(texti) !== "undefined") {
          var diffs = dmp.diff_main(store.getText(), texti);
          dmp.diff_cleanupSemantic(diffs);
          var html = dmp.diff_prettyHtml(diffs);
          text.html("<p>" + html  + "</p>");
        }
        else {
          text.html("<p>Erreur !</p>");
        }
      };
      if (textUnchanged()) {
        activate();
      }
      else {
        confirm("<p>Attention : afficher la proposition de modification annulera la modification en cours.", activate);
      }
    });
  };

  var saveEdit = function(name) {
    // add date and hour to edit name
    var date = new Date();
    // French date
    var localeDate = date.toLocaleString();
    localeDate = localeDate.substring(0, localeDate.length - 3);
    localeDate = localeDate.replace(" ", " à ").replace(":", "h");
    store.addEdit(name + " (le " + localeDate + ")", $("#text textarea").val());
  };

  // Show initial text
  var showText = function() {
    text.html("<textarea>" + store.getText() + "</textarea>");
  };
  showText();

  var saveText = function() {
    store.setText($("#text textarea").val());
  }

  // Show initial edits
  for (var i = 1; i <= store.getEditNb(); i++) {
    showEdit(i);
  }

  // New edits are made possible
  $("#propose").click(function() {
    if (textUnchanged()) {
      alert("<p>Pas de modification en cours !");
      return;
    }
    prompt("Description de la proposition de modification :", function(name) {
      if (name === null || name === "" || name === "reset" && $("textarea").val() !== "" || name === "edit" && $("textarea").val() === "") {
        alert("<p>La modification n'a pas été sauvegardée.")
      }
      else if (name === "reset") {
        passwordOk(false, function() {
          store.clear();
          showText();
          $(".edit").remove();
        });
      }
      else if (name === "edit") {
        passwordOk(true, function() {
          saveText();
          showText();
          $(".edit").remove();
        });
      }
      else {
        saveEdit(name);
        showEdit(store.getEditNb());
        showText();
      }
    });
  });

  // Menu
  $("#help").click(function(e) {
    e.preventDefault();
    alert("<h2>Pour les élèves :</h2><p>Le texte principal est modifiable. On sauvegarde les changements en cliquant sur \"Proposer la modification\" et en lui donnant un nom.<p>Toutes les propositions de modification sont listées dans la colonne de droite. Un clic permet de les afficher, un autre clic de revenir au texte non modifié. Le texte n'est pas modifiable lors de l'affichage d'une proposition modification.<h2>Pour les profs :</h2><p>Les opérations suivantes sont protégées par un mot de passe.<p>Pour sauvegarder une nouvelle version du texte, il faut cliquer sur \"Proposer la modification\" puis entrer \"edit\".<p>Pour remettre l'outil à zéro (attention danger !), il faut supprimer le texte, cliquer sur \"Proposer la modification\" puis entrer \"reset\".", 500);
  });

  $("#about").click(function(e) {
    e.preventDefault();
    alert("<p>Les Petites Plumes est un site réalisé pour les élèves du Vallon de l'Oriol par Jules et Théo Zimmermann.<p>C'est un outil simplifié, issu d'<a target=\"_blank\" href=\"http://unkilodeplumes.fr\">unkilodeplumes</a>, le roman collaboratif.");
  });

  $("#contact").click(function(e) {
    e.preventDefault();
    alert("<p>Nous sommes ouverts à toutes les remarques, questions, etc. Notre adresse e-mail:<p><a href=\"mailto:contact@unkilodeplumes.fr\">contact@unkilodeplumes.fr</a>.");
  });

});
