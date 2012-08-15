
FBL.ns(function() { with (FBL) {

	const Co	= Components;
	const Cc	= Co.classes;
	const Ci	= Co.interfaces;
	const AM = AddonManager;
	const panelName = "FiredogPanel";
	const URLS = {
		home: 'http://www.rereadyou.cnblogs.cn',
	};
	var panel = {};
	//extend fb module
	function FiredogModule() {}
	Firebug.FiredogModule = extend(Firebug.Module, 
	{
			this.panel = panel;
			initialize: function(broswer, panel)
			{
				var isShowFiredogPanel = panel && panel.name == panelName,
					  btnStartSniffer = broswer.chrome.$('fbFiredogStartBtn');

				Firebug.Module.initialize.apply(this, arguments);

				collapse(btnStartSniffer, !isShowFiredogPanel);
			},

			run: function(context)
			{
				var panel = context.getPanel('FiredogPanel',  true);
				$('fdStartBtn').label = 'Stop';
				panel.echo('barking');
			},

			//exclude function calls in file fileName
			exclude: function(fileName)
			{
				$('fdExcludeBtn').label = "Exclude";

			},

			onExcludeShowing: function(obj)
			{
				//this.panel.echo('menu clicked');
			},


			// about dialog
			about: function()
			{
				Co.utils["import"]("resource://gre/modules/AddonManager.jsm");

				AM.getAddonByID("rereadyou@gmail.com", function(addon) 
				{
					openDialog("chrome://mozapps/content/extensions/about.xul", "", "chrome,centerscreen,modal", addon);
				});
			},
			//open url on a new tab
			visitWebsite: function(url)
			{
				content.openNewTab(URLS[url]);
			},
	});

	/* 
	 *	 extend fb panel
	*/
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
			
			//show and hide function is the switcher for firedog toolbar defined by firebug
			show: function(state)
			{
				Firebug.Panel.show.apply(this, arguments);

				this.showToolbarButtons("fbFiredogBtns", true);
			},
			
			hide: function()
			{
				Firebug.Panel.show.apply(this, arguments);

				this.showToolbarButtons("fbFiredogBtns", false);
			},
			//echo a string line on firedog panel
			echo: function(msg)
			{
				var p = this.document.createElement('p');
				p.innerHTML = msg;
				this.panelNode.appendChild(p);
			},

    });


	//registe to firebug
	Firebug.registerModule(FiredogModule);
    Firebug.registerPanel(FiredogPanel);

}});