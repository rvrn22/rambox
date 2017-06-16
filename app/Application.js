Ext.define('Webapps.Application', {
	 extend: 'Ext.app.Application'

	,name: 'Webapps'

	,requires: [
		,'Webapps.util.MD5'
		,'Ext.window.Toast'
		,'Ext.util.Cookies'
	]

	,stores: [
		 'ServicesList'
		,'Services'
	]

	,profiles: [
		 'Offline'
		,'Online'
	]

	,config: {
		 totalServicesLoaded: 0
		,totalNotifications: 0
	}

	,launch: function () {

		// Load language for Ext JS library
		Ext.Loader.loadScript({url: Ext.util.Format.format("ext/packages/ext-locale/build/ext-locale-{0}.js", 'en')});

		// Check for updates
		if ( require('electron').remote.process.argv.indexOf('--without-update') === -1 && process.platform !== 'win32' ) Webapps.app.checkUpdate(true);

		// Add shortcuts to switch services using CTRL + Number
		var map = new Ext.util.KeyMap({
			 target: document
			,binding: [
				{
					 key: "\t"
					,ctrl: true
					,alt: false
					,shift: false
					,handler: function(key) {
						var tabPanel = Ext.cq1('app-main');
						var activeIndex = tabPanel.items.indexOf(tabPanel.getActiveTab());
						var i = activeIndex + 1;

						// "cycle" (go to the start) when the end is reached or the end is the spacer "tbfill"
						if (i === tabPanel.items.items.length || i === tabPanel.items.items.length - 1 && tabPanel.items.items[i].id === 'tbfill') i = 0;

						// skip spacer
						while (tabPanel.items.items[i].id === 'tbfill') i++;

						tabPanel.setActiveTab(i);
					}
				}
				,{
					 key: "\t"
					,ctrl: true
					,alt: false
					,shift: true
					,handler: function(key) {
						var tabPanel = Ext.cq1('app-main');
						var activeIndex = tabPanel.items.indexOf(tabPanel.getActiveTab());
						var i = activeIndex - 1;
						if ( i < 0 ) i = tabPanel.items.items.length - 1;
						while ( tabPanel.items.items[i].id === 'tbfill' || i < 0 ) i--;
						tabPanel.setActiveTab( i );
					}
				}
				,{
					 key: Ext.event.Event.PAGE_DOWN
					,ctrl: true
					,alt: false
					,shift: false
					,handler: function(key) {
						var tabPanel = Ext.cq1('app-main');
						var activeIndex = tabPanel.items.indexOf(tabPanel.getActiveTab());
						var i = activeIndex + 1;

						// "cycle" (go to the start) when the end is reached or the end is the spacer "tbfill"
						if (i === tabPanel.items.items.length || i === tabPanel.items.items.length - 1 && tabPanel.items.items[i].id === 'tbfill') i = 0;

						// skip spacer
						while (tabPanel.items.items[i].id === 'tbfill') i++;

						tabPanel.setActiveTab(i);
					}
				}
				,{
					 key: Ext.event.Event.PAGE_UP
					,ctrl: true
					,alt: false
					,shift: false
					,handler: function(key) {
						var tabPanel = Ext.cq1('app-main');
						var activeIndex = tabPanel.items.indexOf(tabPanel.getActiveTab());
						var i = activeIndex - 1;
						if ( i < 0 ) i = tabPanel.items.items.length - 1;
						while ( tabPanel.items.items[i].id === 'tbfill' || i < 0 ) i--;
						tabPanel.setActiveTab( i );
					}
				}
				,{
					 key: [Ext.event.Event.NUM_PLUS, Ext.event.Event.NUM_MINUS, 187, 189]
					,ctrl: true
					,alt: false
					,shift: false
					,handler: function(key) {
						var tabPanel = Ext.cq1('app-main');
						if ( tabPanel.items.indexOf(tabPanel.getActiveTab()) === 0 ) return false;

						key === Ext.event.Event.NUM_PLUS || key === 187 ? tabPanel.getActiveTab().zoomIn() : tabPanel.getActiveTab().zoomOut();
					}
				}
				,{
					 key: [Ext.event.Event.NUM_ZERO, '0']
					,ctrl: true
					,alt: false
					,shift: false
					,handler: function(key) {
						var tabPanel = Ext.cq1('app-main');
						if ( tabPanel.items.indexOf(tabPanel.getActiveTab()) === 0 ) return false;

						tabPanel.getActiveTab().resetZoom();
					}
				}
				,{
					 key: "123456789"
					,ctrl: true
					,alt: false
					,handler: function(key) {
						key = key - 48;
						if ( key >= Ext.cq1('app-main').items.indexOf(Ext.getCmp('tbfill')) ) key++;
						Ext.cq1('app-main').setActiveTab(key);
					}
				}
				,{
					 key: 188 // comma
					,ctrl: true
					,alt: false
					,handler: function(key) {
						Ext.cq1('app-main').setActiveTab(0);
					}
				}
				,{
					 key: Ext.event.Event.F1
					,ctrl: false
					,alt: false
					,shift: false
					,handler: function(key) {
						var btn = Ext.getCmp('disturbBtn');
						btn.toggle();
						Ext.cq1('app-main').getController().dontDisturb(btn, true);
					}
				}
				,{
					 key: Ext.event.Event.F2
					,ctrl: false
					,alt: false
					,shift: false
					,handler: function(key) {
						var btn = Ext.getCmp('lockWebappsBtn');
						Ext.cq1('app-main').getController().lockWebapps(btn);
					}
				}
			]
		});

		// Mouse Wheel zooming
		document.addEventListener('mousewheel', function(e) {
			if( e.ctrlKey ) {
				var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

				var tabPanel = Ext.cq1('app-main');
				if ( tabPanel.items.indexOf(tabPanel.getActiveTab()) === 0 ) return false;

				if ( delta === 1 ) { // Zoom In
					tabPanel.getActiveTab().zoomIn();
				} else { // Zoom Out
					tabPanel.getActiveTab().zoomOut();
				}
			}
		});

		// Define default value
		if ( localStorage.getItem('dontDisturb') === null ) localStorage.setItem('dontDisturb', false);

		if ( localStorage.getItem('locked') ) {
			console.info('Lock Webapps:', 'Enabled');
			Ext.cq1('app-main').getController().showLockWindow();
		}

		// Synchronization problem in version 0.5.3 steps to fix it
		if ( localStorage.getItem('id_token') && localStorage.getItem('refresh_token') === null ) {
			var win = Ext.create('Ext.window.Window', {
				 title: 'Backup your services'
				,autoShow: true
				,modal: true
				,closable: false
				,resizable: false
				,bodyPadding: '0 15 15 15'
				,width: 500
				,layout: 'card'
				,items: [
					{
						 xtype: 'container'
						,html: '<h1>Synchronization problem fixed!</h1>In previous version, we had a bug that backing up your services throw an error. Now is fixed, but you will need to follow two simple steps to make it work.<br><br>If you decide not to do it now, you can cancel but it will ask you again next time you open Webapps until you do it.'
					}
					,{
						 xtype: 'container'
						,html: '<h1>Login again</h1>Just click the "Sign in" button at the bottom-right of this window to sign in again with the same account you used before.'
					}
					,{
						 xtype: 'container'
						,html: '<h1>Backup</h1>To finish, click the "Sync!" button to backup your current services and that\'s all!'
					}
				]
				,buttons: [
					{
						 text: locale['button[1]']
						,ui: 'decline'
						,handler: function() {
							win.close();
						}
					}
					,'->'
					,{
						 text: 'Start'
						,handler: function(btn) {
							btn.hide();
							btn.nextSibling('#signin').show();
							win.getLayout().setActiveItem(1);
						}
					}
					,{
						 text: 'Sign in'
						,itemId: 'signin'
 						,hidden: true
						,handler: function(btn) {
							btn.hide();
							btn.nextSibling('#sync').show();
							win.getLayout().setActiveItem(2);
						}
					}
					,{
						 text: 'Sync!'
						,itemId: 'sync'
						,hidden: true
						,handler: function() {
						}
					}
				]
			});
		}
	}

	,updateTotalNotifications: function( newValue, oldValue ) {
		newValue = parseInt(newValue);
		if ( newValue > 0 )	{
			document.title = 'Webapps (' + Webapps.util.Format.formatNumber(newValue) + ')';
		} else {
			document.title = 'Webapps';
		}
	}

	,checkUpdate: function(silence) {
		console.info('Checking for updates...');
		Ext.Ajax.request({
			 url: 'http://webapps.pro/api/latestversion.json'
			,method: 'GET'
			,success: function(response) {
				var json = Ext.decode(response.responseText);
				var appVersion = new Ext.Version(require('electron').remote.app.getVersion());
				if ( appVersion.isLessThan(json.version) ) {
					console.info('New version is available', json.version);
					Ext.cq1('app-main').addDocked({
						 xtype: 'toolbar'
						,dock: 'top'
						,ui: 'newversion'
						,items: [
							'->'
							,{
								 xtype: 'label'
								,html: '<b>'+locale['app.update[0]']+'</b> ('+json.version+')' + ( process.platform === 'win32' ? ' Is downloading in the background and you will notify when is ready to install it.' : '' )
							}
							,{
								 xtype: 'button'
								,text: locale['app.update[1]']
								,href: process.platform === 'darwin' ? 'https://getwebapps.herokuapp.com/download/'+process.platform+'_'+process.arch : 'https://github.com/placeholder/webapps/releases/latest'
								,hidden: process.platform === 'win32'
							}
							,{
								 xtype: 'button'
								,text: locale['app.update[2]']
								,ui: 'decline'
								,tooltip: 'Click here to see more information about the new version.'
								,href: 'https://github.com/placeholder/webapps/releases/tag/'+json.version
							}
							,'->'
							,{
								 glyph: 'xf00d@FontAwesome'
								,baseCls: ''
								,style: 'cursor:pointer;'
								,handler: function(btn) { Ext.cq1('app-main').removeDocked(btn.up('toolbar'), true); }
							}
						]
					});
					if ( process.platform === 'win32' ) ipc.send('autoUpdater:check-for-updates');
					return;
				} else if ( !silence ) {
					Ext.Msg.show({
						 title: locale['app.update[3]']
						,message: locale['app.update[4]']
						,icon: Ext.Msg.INFO
						,buttons: Ext.Msg.OK
					});
				}

				console.info('Your version is the latest. No need to update.');
			}
		});
	}
});
