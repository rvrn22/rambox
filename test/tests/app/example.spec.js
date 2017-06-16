/**
 * This is an example test.
 */

var chai = require('chai');
var expect = chai.expect;
var WebappsTestHelper = require('../../helpers/WebappsTestHelper');

describe('Webapps window', function() {

	/**
	 * The Webapps test helper does common stuff.
	 *
	 * @type {module.exports}
	 */
	var webappsTestHelper = new WebappsTestHelper();

	it('should have "Webapps" in the title', function () {
		return webappsTestHelper.app.client.browserWindow.getTitle().then(function(title) {
			expect(title).to.contain('Webapps');
			return Promise.resolve();
		});
	})
});
