
"use strict"

// localStorage getters and setters
var store = function() {
  // local attributes
  var versionNb = localStorage.versionNb || 0;
  var editNb = null;
  var initialInfo = 'Instructions de démarrage rapide :\n\nRemplacez ces instructions par un texte initial puis cliquez sur "Proposer la modification" et renseignez le nom "edit" (vous pourrez modifier le texte principal dans le futur de la même façon).\n\nTout le monde peut faire des propositions de modification qui s\'affichent sur le côté.\n\nPour revenir à l\'état initial, cliquez sur "Proposer la modification" et renseignez "clear".'

  var getEditNb = function() {
    if (editNb === null) {
      editNb = localStorage["editNb(" + versionNb + ")"] || 0;
    };
    return editNb;
  };

  var getEditName = function(i) {
    return localStorage["editName(" + versionNb + "," + i + ")"];
  };

  var getEditText = function(i) {
    return localStorage["editText(" + versionNb + "," + i + ")"];
  };

  var getText = function() {
    return localStorage["text(" + versionNb + ")"] || initialInfo;
  };

  var addEdit = function(name, text) {
    editNb = getEditNb() + 1;
    localStorage["editNb(" + versionNb + ")"] = editNb;
    localStorage["editText(" + versionNb + "," + getEditNb() + ")"] = text;
    localStorage["editName(" + versionNb + "," + getEditNb() + ")"] = name;
  };

  var setText = function(value) {
    // every time the main text changes, the version changes
    versionNb++;
    localStorage.versionNb = versionNb;
    editNb = 0;
    localStorage["text(" + versionNb + ")"] = value;
  };

  var clear = function() {
    localStorage.clear();
  };

  return {
    getEditNb: getEditNb,
    getEditName: getEditName,
    getEditText: getEditText,
    getText: getText,
    addEdit: addEdit,
    setText: setText,
    clear: clear
  };
}();

$(document).ready(function() {

  var text = $("#text");
  var edits = $("#edits");

  // make a diff_match_patch object once and for all
  var dmp = new diff_match_patch();

  var showEdit = function(i) {
    edits.append("<p><button id='edit" + i + "'>" + store.getEditName(i) + "</button></p>");
    $("#edit" + i).click(function() {
      // active -> unactive / unactive -> active

      // if was active
      if ($(this).hasClass("active")) {
        // unactivate button
        $(this).removeClass("active");
        showText();
      }
      else {
        // unactivate other active buttons
        $("button.active").removeClass("active");
        $(this).addClass("active");

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
    var name = prompt("Donne un nom à la proposition de modification :");
    if (name === null || name === "") {
      alert("La modification n'a pas été sauvegardée.")
    }
    else if (name === "clear") {
      store.clear();
      location.reload(true);
    }
    else if (name === "edit") {
      saveText();
      location.reload(true);
    }
    else {
      saveEdit(name);
      showEdit(store.getEditNb());
      showText();
    }
  });

});
