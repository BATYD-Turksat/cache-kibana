jQuery(document).ready(function() {
    $(document).on("click", ".deleteUser", function () {
        var userId = $(this).data('id');
        console.log(userId);
        $(".modal-body #userId").text( userId );
        $(".modal-footer #userId").attr("href", "/delete/user/" + userId);
    });

    $(document).on("click", ".registerUser", function() {
        $('#registerform')[0].reset();
    });
    $( document ).ready( function() {
            $(".registerUser").attr('title', 'Add user');
        }
    );
});