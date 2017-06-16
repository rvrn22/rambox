
Ext.define('Webapps.view.main.MainModel', {
	 extend: 'Ext.app.ViewModel'

	,alias: 'viewmodel.main'

	,data: {
		 name: 'Webapps'
		,username: localStorage.getItem('profile') ? JSON.parse(localStorage.getItem('profile')).name : ''
		,avatar: localStorage.getItem('profile') ? JSON.parse(localStorage.getItem('profile')).picture : ''
		,last_sync: localStorage.getItem('profile') && JSON.parse(localStorage.getItem('profile')).user_metadata && JSON.parse(localStorage.getItem('profile')).user_metadata.services_lastupdate ? new Date(JSON.parse(localStorage.getItem('profile')).user_metadata.services_lastupdate).toUTCString() : ''
	}
});
