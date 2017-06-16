Ext.define('Webapps.profile.Online', {
	 extend: 'Ext.app.Profile'
	,isActive: function() {
		return localStorage.getItem('id_token');
	}

	,launch: function() {
		console.info('USER LOGGED IN');
	}
});
