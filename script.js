/* TODO :
    - handle versions
*/

var initialInfo = 'Instructions de démarrage rapide :\n\nRemplacez ces instructions par un texte initial puis cliquez sur "Proposer la modification" et renseignez le nom "edit" (vous pourrez modifier le texte principal dans le futur de la même façon).\n\nTout le monde peut faire des propositions de modification qui s\'affichent sur le côté.\n\nPour revenir à l\'état initial, cliquez sur "Proposer la modification" et renseignez "clear".'

$(document).ready(function() {

  var editNb = localStorage.editNb || 0;
  var text = $("#text");
  var edits = $("#edits");

  // make a diff_match_patch object once and for all
  var dmp = new diff_match_patch();

  var showEdit = function(i) {
    edits.append("<p><button id='edit" + i + "'>" + localStorage["editName" + i] + "</button></p>");
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

        var texti = localStorage["text" + i];
        if (typeof(texti) !== "undefined") {
          var diffs = dmp.diff_main(localStorage.text, texti);
          dmp.diff_cleanupSemantic(diffs);
          var html = dmp.diff_prettyHtml(diffs);
          text.html("<p>" + html  + "</p>");
        }
        else {
          text.html("Erreur !");
        }
      }
    });
  };

  var saveEdit = function(name) {
    editNb++;
    localStorage.editNb = editNb;
    localStorage["text" + editNb] = $("#text textarea").val();
    // add date and hour to name of edit
    var date = new Date();
    // French date
    var localeDate = date.toLocaleString();
    localeDate = localeDate.substring(0, localeDate.length - 3);
    localeDate = localeDate.replace(" ", " à ").replace(":", "h");
    localStorage["editName" + editNb] = name + " (le " + localeDate + ")";
  };

  // Show initial text
  var showText = function() {
    text.html("<textarea>" + (localStorage.text || initialInfo) + "</textarea>");
  };
  showText();

  var saveText = function() {
    localStorage.text = $("#text textarea").val();
  }

  // Show initial edits
  for (var i = 1; i <= editNb; i++) {
    showEdit(i);
  }

  // New edits are made possible
  $("#propose").click(function() {
    var name = prompt("Donne un nom à la proposition de modification :");
    if (name === "clear") {
      localStorage.clear();
      location.reload(true);
    }
    else if (name === "edit") {
      saveText();
    }
    else {
      saveEdit(name);
      showEdit(editNb);
      showText();
    }
  });

});
