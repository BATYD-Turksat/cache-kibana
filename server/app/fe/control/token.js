tokenStore = require("./token-store.js");

$('document').ready(function() {

    // When page loads check for the token and update it at the web store
    var req = new XMLHttpRequest();
    req.open('GET', document.location, false);
    req.send(null);

    //var headers = req.getAllResponseHeaders().toLowerCase();
    var token = req.getResponseHeader('token');
    if (token) {
        console.log("Stored token in web store!");
        tokenStore.setToken(token);
    }
    var user = req.getResponseHeader('user');
    if (user) {
        console.log("Stored user in web store!");
        tokenStore.setUser(user);
    }

    var status = req.getResponseHeader('status');
    if  (status == 'logout') {
        console.log("Removed token and user in web store!");
        tokenStore.remove();
    }
});