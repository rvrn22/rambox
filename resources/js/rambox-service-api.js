/**
 * This file is loaded in the service web views to provide a Webapps API.
 */

const { ipcRenderer } = require('electron');

/**
 * Make the Webapps API available via a global "webapps" variable.
 *
 * @type {{}}
 */
window.webapps = {};

/**
 * Sets the unraed count of the tab.
 *
 * @param {*} count	The unread count
 */
window.webapps.setUnreadCount = function(count) {
	ipcRenderer.sendToHost('webapps.setUnreadCount', count);
};

/**
 * Clears the unread count.
 */
window.webapps.clearUnreadCount = function() {
	ipcRenderer.sendToHost('webapps.clearUnreadCount');
}

/**
 * Override to add notification click event to display Webapps window and activate service tab
 */
var NativeNotification = Notification;
Notification = function(title, options) {
	var notification = new NativeNotification(title, options);

	notification.addEventListener('click', function() {
		ipcRenderer.sendToHost('webapps.showWindowAndActivateTab');
	});

	return notification;
}

Notification.prototype = NativeNotification.prototype;
Notification.permission = NativeNotification.permission;
Notification.requestPermission = NativeNotification.requestPermission.bind(Notification);
