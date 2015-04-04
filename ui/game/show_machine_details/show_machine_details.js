$(document).ready(function(){
	App.stonehearth.showMachineDetailsView = null;

	$(top).on("mechanicalmod_show_machine_details", function (_, e) {
		if (App.stonehearth.showMachineDetailsView) {
			App.stonehearth.showMachineDetailsView.hide();
		} else {
			App.stonehearth.showMachineDetailsView = App.gameView.addView(App.MechanicalModMachineDetailsView, { uri: e.entity });
		}
	});
});

App.MechanicalModMachineDetailsView = App.View.extend({
	templateName: 'machineDetails',
	classNames: ['fullScreen', 'gui'],
	closeOnEsc: true,
	modal: true,

	components: {
		'unit_info' : {},
		'mechanicalmod:gear_box' : {}
	},

	init: function() {
		this._super();
		
		this._setupEntityTrace();
	},

	didInsertElement: function() {
		var self = this;

		if (self.$('#modalOverlay').length > 0) {
			self.$('#machineDetails').position({
				my: 'center center',
				at: 'center center',
				of: '#modalOverlay'
			});
		}

		self.$('.tab').click(function() {
			radiant.call('radiant:play_sound', {'track' : 'stonehearth:sounds:ui:start_menu:page_up' });
			var tabPage = $(this).attr('tabPage');

			self.$('.tabPage').hide();
			self.$('.tab').removeClass('active');
			$(this).addClass('active');

			self.$('#' + tabPage).show();
		});

		self.$('#opt_machineName').keypress(function(e) {
			if (e.which == 13) {
				self.updateName();
			}
		});
		
		$('#gearRatioSlider').slider({
			min: 0.1,
			max: 10,
			step: 0.1,
			slide: function( event, ui ) {
				radiant.call('radiant:play_sound', {'track' : 'stonehearth:sounds:ui:action_hover'});
				var delay = function() {
					$("#gearRatioValue").html(ui.value).position({
						my: 'center top',
						at: 'center bottom',
						of: ui.handle,
						offset: "0, 10"
					});
				};

				// Wait for the ui.handle to set its position
				setTimeout(delay, 5);
			}
		});
		
		self._setupEntityTrace();
	},
	
	actions: {
		hide: function() {
			radiant.call('radiant:play_sound', {'track' : 'stonehearth:sounds:ui:start_menu:small_click' });
			this.destroy();
		},
		
		save: function() {
			radiant.call('radiant:play_sound', {'track' : 'stonehearth:sounds:ui:start_menu:small_click' });
			this.applySettings();
		},
		
		toggleviewmode: function() {
			radiant.call('radiant:play_sound', {'track' : 'stonehearth:sounds:ui:start_menu:small_click' });
			this.toggleViewMode();
		},
		
		updatename: function() {
			radiant.call('radiant:play_sound', {'track' : 'stonehearth:sounds:ui:start_menu:small_click' });
			this.updateName();
		},
	},

	getMachine: function() {
		var self = this;
		var machine_entity = self.get('machine');
		if (machine_entity == null) {
			this._updateSelection()
		}
		
		return self.get('machine');
	},
	
	getConfig: function(persistConfig) {
		var newConfig = {
			"gear_ratio" : $("#gearRatioSlider").slider("value")
		};
		return newConfig;
	},
	
	toggleViewMode: function() {
		var self = this;
		var machine_entity = self.getMachine();
		radiant.call('mechanicalmod:toggle_power_level_view', machine_entity.__self);
	},
	
	updateName: function() {
		var self = this;
		
		var name = $('#opt_machineName').val();
		if (name == null || name == "")
		{
			return;
		}
		
		var machine_entity = self.getMachine();
		machine_entity.unit_info.name = name;
		radiant.call('mechanicalmod:set_machine_name', machine_entity.__self, name)
	},
	
	applyConfig: function(persistConfig) {
		var self = this;
		var machine_entity = self.getMachine();
		
		var newConfig = this.getConfig(persistConfig);
		radiant.call('mechanicalmod:save_machine_config', machine_entity.__self, newConfig);
	},
	
	applySettings: function() {
		this.applyConfig(true);
	},
	
	destroy: function() {
		if (this.selectedEntityTrace) {
			this.selectedEntityTrace.destroy();
			this.selectedEntityTrace = null;
		}
		
		this._super();
		
		App.stonehearth.showMachineDetailsView = null;
	},
	
	_loadConfig: function() {
		var self = this;
		var machine_entity = self.getMachine();
		if (machine_entity) {
			self.set('context.machine_name', machine_entity.unit_info.name)
			
			if ((typeof machine_entity['mechanicalmod:gear_box']) == 'undefined' || machine_entity['mechanicalmod:gear_box'] == null || machine_entity['mechanicalmod:gear_box'].ratio == 0) {
				$('#gearRatioSlider').slider("value", 1);
				$('#gearRatioSlider').slider("disable");
			} else {
				$('#gearRatioSlider').slider("value", machine_entity['mechanicalmod:gear_box'].ratio);
				$('#gearRatioSlider').slider("enable");
			}

			$('#gearRatioValue').html($('#gearRatioSlider').slider('values', 0)).position({
				my: 'center top',
				at: 'center bottom',
				of: $('#gearRatioSlider a:eq(0)'),
				offset: "0, 10"
			});
			
			radiant.call('mechanicalmod:get_machine_config', machine_entity.__self).done(function(o) {
			});
		}
	},
	
	_setupEntityTrace: function() {
		var self = this;
		var machine_uri = this.get('uri');
		
		if (!machine_uri) {
			return;
		}

		if (self.selectedEntityTrace) {
			self.selectedEntityTrace.destroy();
		}
	
		self.selectedEntityTrace = new RadiantTrace(machine_uri, self.components)
		.progress(function(result) {
			self.set('machine', result);
			self._loadConfig();
		});
		
		self.selectedEntityTrace.traceUri(machine_uri, self.components);
	}
});