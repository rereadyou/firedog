
//need to be wrapped as AMD module, and panel and moudle extend statements should be seperated.
//define([], function() {

FBL.ns(function() { with (FBL) {

	const Co		= Components;
	const Cc		= Co.classes;
	const Ci		= Co.interfaces;
	const AM		= AddonManager;
	const hook		= Ci.jsdICallHook;
	const funcCALL	= hook.TYPE_FUNCTION_CALL; //2
	const funcRTN	= hook.TYPE_FUNCTION_RETURN; //3
	const console	= Application.Console;

	const XUL_NS 	= "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
	//open new ff tab
	const wm	= Cc["@mozilla.org/appshell/window-mediator;1"]
                .getService(Ci.nsIWindowMediator);

	const panelName = "FiredogPanel";
	const PREFS_DOMAIN = "extensions.firedog";
	const URLS = {
		home: 'http://www.cnblogs.com/rereadyou/',
	};

	var panel = {};


	//register string bundle for Firebug's $STR module(src firebug/extension/modules/locale.js)
	Firebug.registerStringBundle("chrome://firedog/locale/firedog.properties");

	//extend fb module
	function FiredogModule() {}
	Firebug.FiredogModule = extend(Firebug.Module, 
	{		
		tracing: false,
		jsChain: {name: 'jsDog', fn: {file: 'jsDog', line: 0, args: ''}, parentNode: null, subfuncs: []},
		callStack: [],//push and pop functions
		jsChainCallFlow: '',
		panel: {},
		jsFiles: [],

		initialize: function(broswer, panel)
		{
			this.panel = panel;

			var isShowFiredogPanel = panel && panel.name == panelName,
			    btnStartSniffer = broswer.chrome.$('fbFiredogStartBtn');

			Firebug.Module.initialize.apply(this, arguments);

			collapse(btnStartSniffer, !isShowFiredogPanel);
		},

		run: function(context)
		{
			var panel = context.getPanel('FiredogPanel',  true);
			//$('fdStartBtn').label = $STR("firedog.startLabel"); // $STR: firebug string bundle object
			panel.clear();
			panel.echo('Tracing... press stop to see result.');
			$('fdStartBtn').label = $('fdStartBtn').label == $STR("firedog.startLabel")
								? $STR("firedog.stopLabel")
								: $STR("firedog.startLabel");
			this.tracing = !this.tracing;

			// javascript debugger service
			this.jsd = Cc["@mozilla.org/js/jsd/debugger-service;1"]
					   .getService(Ci.jsdIDebuggerService);

			//check to stop
			if(!this.tracing)
			{
				this.stop(panel);
				return;
			}
			
			var self = this;	
				if(self.jsd.asyncOn)
				{
					self.jsd.asyncOn({onDebuggerActivated: function(){
							//console.log('Debugging working');
							//panel.echo('Tracing...');
						}
					});
				}
				else
				{
					self.jsd.on();
				}//enable debugger service
				
				this.jsd.clearFilters();
				//ignore the sys functions
				this.jsd.appendFilter(this.create_filter("*/firefox/components/*"));
				this.jsd.appendFilter(this.create_filter("*/firefox/modules/*"));
				this.jsd.appendFilter(this.create_filter("XStringBundle"));
				this.jsd.appendFilter(this.create_filter("chrome://*"));
				this.jsd.appendFilter(this.create_filter("x-jsd:ppbuffer*"));
				this.jsd.appendFilter(this.create_filter("XPCSafeJSObjectWrapper.cpp"));
				this.jsd.appendFilter(this.create_filter("file://*"));
				this.jsd.appendFilter(this.create_filter("resource://*"));
				this.jsd.appendFilter(this.create_filter("jar:file//*"));
				this.jsd.appendFilter(this.create_filter("file:/*"));
				


				self.jsd.debugHook = {
					onExecute: function(frame, type, rv){
							
							stackTrace = "";
							for(var f = frame; f; f = f.callingFrame){
								//stackTrace = 'Exe::: '+f.script.fileName + "@" + f.line + "@" + f.functionName + "\n";
							}
							//dump(stackTrace);
							//console.log(stackTrace);
							panel.echo(stackTrace);
							return Ci.jsdIExecutionHook.RETURN_CONTINUE;
							
						}
					};
				
				//get running functions
				
				var _jsChainHook = {
					onCall: function(frame, type){
						var stackTrace = "";
						//for(var f = frame; f; f = f.callingFrame){
								if(frame && frame.functionName && frame.script)
								{
									var f = frame;
									var scriptName  = f.script.fileName;
									var funcName	= f.functionName;
									var line		= f.line;
									var exeTime		= f.script.maxExecutionTime;
									var funcSrc		= f.script.functionSource
									var args		= self.get_func_args(funcSrc);

									if(funcName && funcName === 'anonymous')
									{
										return;
									}
								
									//console.log(funcSrc);
									//console.log(args);

									if(funcName[0] != '$' && !f.isDebugger)
									{
										if(type === funcCALL)
										{														
											var node = new self.jsChainNode(funcName, {file:scriptName, line: line, args: args}, []);
											if(!node)
											{
												panel.echo('Create function call node failed!');
												//console.log('Create function call node failed!');
												return;
											}
											self.callStack.push(node);

											//console.log('stack '+self.callStack.length+' :'+node.name);

											if(self.callStack.length === 1)
											{
												self.jsChain.subfuncs.push(node);
												node.parentNode = self.jsChain;
											}
											else
											{
												var pNode= self.callStack[self.callStack.length-2];
												self.add_subfunc(pNode, node);
												//console.log(pNode.name+' is p of '+node.name);
											}
											//console.log('funcCALL');

										}

										if(type === funcRTN)
										{
											
											var root = self.callStack.pop();
											if(self.callStack.length === 0)
											{
												//self.jsChain.subfuncs.push(root);
											}
											//console.log('funcRTN');
										}
										//console.log("name: "+f.script.fileName+", funcName@ "+frame.functionName+', type@'+type);
									}
								}
												
							}
				};
			self.jsd.functionHook = _jsChainHook;
			//self.jsd.topLevelHook = _jsChainHook;

			/*
			if(!this.jsChainDiv){
				this.create_div('jsChainPanel');
			}

			_that = this;
			content.onmousemove = function(event){
					var m = _that.get_mouse(event);
					_that.pop_div(m);
				};
			content.onclick = function(event){
					//content.onmousemove = null;
					//console.log(this.callee);
					var o = event.target;
					//console.log("script: "+o.scriptName+" , @line: "+o.lineNumber);
				};
			*/
		},
		
		stop: function(panel)
		{
			//clear the panel
			panel.clear();
			if(!this.tracing)
			{
				//content.onmousemove = null;
				
				this.jsd.off();
				this.jsd = null;
				//this.jsChainCallFlow = '';

				var str = this.travel_chain(this.jsChain, panel, this.jsFiles);
				
				//Application.console.log('str=== '+str);
				//panel.echo(str);
				this.jsChainCallFlow = str;

				//reset js chain to be root only
				this.jsChain = {name: 'jsDog', fn: {file: 'jsDog', line: 0, args: ''}, parentNode: null, subfuncs: []};
				this.callStack = [];
				this.jsFiles = []; //set to empty

				return;
			}
		},

		// a func node
		jsChainNode: function(name, fn, subfuncs)
		{
			this.name	= name;
			this.fn		= fn;
			this.parentNode	= null;
			this.subfuncs	= subfuncs;	
			//Application.console.log('new node: '+name);
			//Application.console.log(fn.funcSrc);
		},
		//add node to some func call's subfunc;
		add_subfunc: function(pNode, cNode)
		{

			pNode.subfuncs.push(cNode);
			cNode.parentNode = pNode;
		},

		create_filter: function(pattern, pass)
		{
			var jsdIFilter = Components.interfaces.jsdIFilter;
			var filter = {
							globalObject: null,
							flags: pass ? (jsdIFilter.FLAG_ENABLED | jsdIFilter.FLAG_PASS) : jsdIFilter.FLAG_ENABLED,
							urlPattern: pattern,
							startLine: 0,
							endLine: 0
						};
			return filter;
		},

		//note that this function is called recursively, so jsFiles should
		//be passed as an argument for 'this' keyword is uncertain during runtime
		travel_chain: function(root, panel, files)
		{
			var funcDeclaration = root.name;
			var funcScriptName = root.fn.file;
			var file_in_array = false;
			
			//add file name to the exclude popup menu
			for(var i =0; i < files.length; i++)
			{
				if(files[i] === funcScriptName)
					file_in_array = true;
			}
			if(!file_in_array)
			{
				if(funcScriptName !== 'jsDog')
				{
					files.push(funcScriptName);
					panel.add_menuitem("fdExcludeFilesMenu", funcScriptName); 
				}
			}
			
			var str = FiredogTemplate.FuncCallLineTag.append({root: root}, panel.panelNode, FiredogTemplate);
			

			var subfuncs = root.subfuncs;
			for(var e in subfuncs)
			{
				//str += '<br> '+arguments.callee(subfuncs[e]);
				//function self runs recursively
				arguments.callee(subfuncs[e], panel, files);
			}
			return str;
		},
		//cause no api function to get function arguments
		get_func_args: function(funcSrc)
		{
			var argExp = /function\s([\w\s\d_\$]*)\(([\w\s\d_\$,]*)\)/i;
			var matchs = argExp.test(funcSrc);
			//Application.console.log(funcSrc);
			//Application.console.log(matchs[1]);
			return RegExp.$2;
		},

		get_mouse: function(event)
		{
			this.mouse = mouse = {	x: event.pageX,
									y: event.pageY
								};
			return mouse;
		},
		
		create_div: function(id)
		{
			var div = content.document.createElement('div');
			div.id = id;
			div.style.zIndex	= '9999';
			div.style.width		= '200px';
			div.style.height	= 'auto';
			//font
			//div.style.color		= '#ffff00';
			div.style.display	= 'none';
			div.style.backgroundColor = 'rgba(255,255,255,0.4)';
			div.style.border	= '1px solid rgb(77, 144, 254)';
			div.style.boxShadow = '2px -1px 4px rgba(0, 0, 0, 0.2)';
			div.style.padding	= '5px';
			div.style.position	= 'absolute';
			this.jsChainDiv = div;
			content.document.body.appendChild(div);
		},

		pop_div: function(pos)
		{
			var div = this.jsChainDiv;
			div.style.top		= pos.y+5+'px';
			div.style.left		= pos.x+5+'px';
			div.style.display	= 'block';

			var str = '';
			for(var e in content.console)
			{
				str += (typeof content.console[e]);
				str += e;
				str += '<br>';
			}

			content.document.getElementById('jsChainPanel').innerHTML = 'jsChain tracing... x '+pos.x+', y'+pos.y+' <br>'+this.jsChainCallFlow;
				
		},

		//exclude function calls in file fileName
		exclude_file: function(context, event, obj)
		{
			var panel = context.getPanel('FiredogPanel',  true);
			panel.echo(event.target);

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
			 //FirebugChrome.window.open(URLS[url], "_blank");
			 wm.getMostRecentWindow("navigator:browser").delayedOpenTab(URLS[url], null, null, null, null);
			return;
		},

		clear: function(context)
		{
			context.getPanel('FiredogPanel',  true).clear();
			return;
		},

	});

	/* 
	 *	 extend fb panel
	*/
    function FiredogPanel() {}
    FiredogPanel.prototype = extend(Firebug.ActivablePanel, //Firebug.Panel
	{
			name: panelName,
			title: "Firedog",
			enableAlly: true,

			initialize: function(context, doc)
			{
			  Firebug.Panel.initialize.apply(this, arguments);
			},
			
					//set options menu
			getOptionsMenuItems: function(context)
			{
				return [	 
						this.optionItem("Option1", "option1"),
						'-',
						this.optionItem("Option2", "option2")
						
					];
			},
			
			optionItem: function(label, option)
			{
				var val = Firebug.getPref(PREFS_DOMAIN, option);

				return {
					label:		label,
					nol10n:		true,
					type:			"checkbox",
					checked:	val,
					command: bindFixed(Firebug.setPref, this, PREFS_DOMAIN, option, !val)
				};
			},


			create_menuitem: function(itemName)
			{
				var item  = document.createElementNS(XUL_NS, "menuitem");
				item.setAttribute("label", itemName);
				item.setAttribute("tooltiptext", "exclude function calls in "+itemName);
				item.setAttribute("oncommand", "Firebug.FiredogModule.exclude_file(Firebug.currentContext, event, this)");
				item.setAttribute("type", "checkbox");
				item.setAttribute("autocheck", "true");

				return item;
			},

			add_menuitem: function(menuId, itemName)
			{
				var parent = document.getElementById(menuId);
				var menuitem = this.create_menuitem(itemName);
				parent.appendChild(menuitem);

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
			
			clear: function()
			{
				this.panelNode.innerHTML = "";
				return true;
			},

    });
	
	//all panel dom are from domplate
	var FiredogTemplate = domplate(
		{
			FuncCallLineTag:
				DIV({"class": 'funcCallLine'}, 
					SPAN({"class": 'funcName'}, ' $root.name '),
					A({"class":'scriptName scriptLink', _scriptName: '$root.fn.file', _lineNumber: '$root.fn.line' }, '$root.fn.file'),
					SPAN({'class': 'scriptLine'}, " @line: $root.fn.line")
				),
		
			
		});


	//registe to firebug
	Firebug.registerModule(FiredogModule);
    Firebug.registerPanel(FiredogPanel);

//	return FiredogPanel;

}});
//});
