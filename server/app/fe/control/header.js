
$( document ).ready( function() {
    $("#cookie-user-name").text($.cookie("user-name"));

    if ($.cookie("user-role")==='admin') {
    $("#admin-link").show();
    $("#developer-link").show();
    }

    if ($.cookie("user-role")==='developer') {
    $("#developer-link").show();
    }
});