// Create jQuery UI widgets based on custom markup.
// Thanks to:
// http://www.shesek.info/jquery/create-jquery-ui-widgets-from-html-markup

$(function() 
{
    $('[data-widget]').each(function()
    {
		$(this)[$(this).data('widget')]()
	})
})
