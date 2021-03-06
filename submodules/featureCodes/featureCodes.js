define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		chart = require('chart');

	var app = {
		requests: {
		},

		subscribe: {
			'voip.featureCodes.render': 'featureCodesRender'
		},

		categories: {
			qubicle: [
				'qubicle login',
				'qubicle set ready',
				'qubicle set away',
				'qubicle logout'
			],
			call_forward: [
				'call_forward[action=activate]',
				'call_forward[action=deactivate]',
				'call_forward[action=toggle]',
				'call_forward[action=update]',
				'call_forward[action=on_busy_enable]',
				'call_forward[action=on_busy_disable]',
				'call_forward[action=no_answer_enable]',
				'call_forward[action=no_answer_disable]'
			],
			hotdesk: [
				'hotdesk[action=login]',
				'hotdesk[action=logout]',
				'hotdesk[action=toggle]'
			],
			parking: [
				'park_and_retrieve',
				'valet',
				'retrieve'
			],
			do_not_disturb: [
				'donotdisturb[action="enable"]',
				'donotdisturb[action="disable"]',
				'donotdisturb[action="toggle"]'
			],
			misc: [
				'voicemail[action=check]',
				'voicemail[action="direct"]',
				'intercom',
				'privacy[mode=full]',
				'directory',
				'time',
				'call_waiting[action=enable]',
				'call_waiting[action=disable]',
				'sound_test_service',
				'call_recording',
				'move'
			]
		},

		featureCodesRender: function(args) {
			var self = this,
				parent = args.parent || $('.right-content'),
				callback = args.callback;

			self.featureCodesLoadData(function(featureCodesData) {
				var template = $(self.getTemplate({
					name: 'layout',
					data: {
						featureCodes: self.featureCodesFormatData(featureCodesData)
					},
					submodule: 'featureCodes'
				}));

				monster.ui.tooltips(template);

				self.featureCodesBindEvents({
					parent: parent,
					template: template,
					featureCodes: featureCodesData
				});

				parent
					.empty()
					.append(template);

				callback && callback();
			});
		},

		featureCodesLoadData: function(callback) {
			var self = this;

			self.callApi({
				resource: 'callflow.list',
				data: {
					accountId: self.accountId,
					filters: {
						'has_key': 'featurecode'
					}
				},
				success: function(data, status) {
					callback && callback(data.data);
				}
			});
		},

		featureCodesFormatData: function(featureCodeData) {
			var self = this,
				featureCodes = {};

			_.each(featureCodeData, function(callflow) {
				// Some old callflows have been created with the feature code key, so we had the check to make sure they also have a name associated
				if (callflow.featurecode.hasOwnProperty('name')) {
					var category = 'misc',
						i18nFeatureCode = self.i18n.active().featureCodes.labels[callflow.featurecode.name],
						hasStar = (callflow.hasOwnProperty('numbers') && callflow.numbers.length && callflow.numbers[0].substr(0, 1) === '*') || (callflow.hasOwnProperty('patterns') && callflow.patterns.length && callflow.patterns[0].substr(0, 3) === '^\\*');

					_.find(self.categories, function(cat, key) {
						if (cat.indexOf(callflow.featurecode.name) >= 0) {
							category = key;
							return true;
						}
						return false;
					});

					if (!featureCodes.hasOwnProperty(category)) {
						featureCodes[category] = {
							category: self.i18n.active().featureCodes.categories[category],
							codes: []
						};
					}

					featureCodes[category].codes.push({
						key: callflow.featurecode.name,
						name: i18nFeatureCode
							? i18nFeatureCode.label
							: _.capitalize(callflow.featurecode.name),
						tooltip: i18nFeatureCode
							? i18nFeatureCode.tooltip
							: undefined,
						number: callflow.featurecode.number ? callflow.featurecode.number.replace(/\\/g, '') : '',
						hasStar: hasStar
					});
				}
			});

			return _.chain(featureCodes)
				.map(function(category) {
					category.codes = _.sortBy(category.codes, 'number');
					return category;
				})
				.sortBy('category')
				.value();
		},

		featureCodesBindEvents: function(args) {
			var self = this,
				parent = args.parent,
				template = args.template;

			template.find('.main-number-link').on('click', function(e) {
				e.preventDefault();
				var leftMenu = parent.parents('#voip_container').find('.left-menu');

				leftMenu.find('.category')
						.removeClass('active');
				leftMenu.find('.category#strategy')
						.addClass('active');

				parent.empty();
				monster.pub('voip.strategy.render', {
					parent: parent
				});
			});
		}
	};

	return app;
});
