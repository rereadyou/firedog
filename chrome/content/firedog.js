
FBL.ns(function() { with (FBL) {
	const panelName = "FiredogPanel";
	
	//extend fb module
	function FiredogModule() {}
	FiredogModule = extend(Firebug.Module, 
	{
			showPanel: function(broswer, panel)
			{
				var isShowFiredogPanel = panel && panel.name == panelName,
					  btnStartSniffer = broswer.chrome.$('fbFiredogStartBtn');

				collapse(btnStartSniffer, !isShowFiredogPanel);
			},

			run: function(context)
			{
				console.info('firedog barking...');
			},
	});

// extend fb panel
    function FiredogPanel() {}
    FiredogPanel.prototype = extend(Firebug.Panel,
	{
			name: panelName,
			title: "Firedog",
			enableAlly: true,

			initialize: function(context, doc)
			{
			  Firebug.Panel.initialize.apply(this, arguments);
			},
    });


	
	Firebug.registerModule(FiredogModule);
    Firebug.registerPanel(FiredogPanel);

}});