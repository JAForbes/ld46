import V from '../web_modules/attain/lib/view.js'

const css = V.css

// todo-james generate this later
export const rules = [
	{
		actions: ['firing'],
		sounds: {
			// play again when sound is 50% complete
			// do not cut out existing sound?
			repeat: true,
			repeatRate: 0.2,
			sample: ['shot']
		}
	},
	{
		actions: ['moving'],
		sounds: {
			repeat: true,
			repeatRate: 0.8,
			sample: ['engine3'],
			volume: 0.2
		}
	},
	{
		actions: ['n', 'firing'],
		layers: [{
			name: 'Firing',
			title: 'character',
			tag: 'North',
			css: {},
			repeat: true
		}]
	},
	{
		actions: ['ne', 'firing'],
		layers: [{
			name: 'Firing',
			title: 'character',
			tag: 'NorthEast',
			css: {},
			repeat: true
		}]
	},
	{
		actions: ['e', 'firing'],
		layers: [{
			name: 'Firing',
			title: 'character',
			tag: 'East',
			css: {},
			repeat: true
		}]
	},
	{
		actions: ['se', 'firing'],
		layers: [{
			name: 'Firing',
			title: 'character',
			tag: 'SouthEast',
			css: {},
			repeat: true
		}]
	},
	{
		actions: ['s', 'firing'],
		layers: [{
			name: 'Firing',
			title: 'character',
			tag: 'South',
			css: {},
			repeat: true
		}]
	},
	{
		actions: ['sw', 'firing'],
		layers: [{
			name: 'Firing',
			title: 'character',
			tag: 'SouthEast',
			css: css.transform(`scaleX(-1)`).style,
			repeat: true
		}]
	},
	{
		actions: ['w', 'firing'],
		layers: [{
			name: 'Firing',
			title: 'character',
			tag: 'East',
			css: css.transform(`scaleX(-1)`).style,
			repeat: true
		}]
	},
	{
		actions: ['nw', 'firing'],
		layers: [{
			name: 'Firing',
			title: 'character',
			tag: 'NorthEast',
			css: css.transform(`scaleX(-1)`).style,
			repeat: true
		}]
	},
	{
		actions: ['n', 'moving'],
		layers: [{
			name: 'Engines',
			title: 'character',
			tag: 'North',
			css: {},
			repeat: true
		}]
	},
	{
		actions: ['ne', 'moving'],
		layers: [{
			name: 'Engines',
			title: 'character',
			tag: 'NorthEast',
			css: {},
			repeat: true
		}]
	},
	{
		actions: ['e', 'moving'],
		layers: [{
			name: 'Engines',
			title: 'character',
			tag: 'East',
			css: {},
			repeat: true
		}]
	},
	{
		actions: ['se', 'moving'],
		layers: [{
			name: 'Engines',
			title: 'character',
			tag: 'SouthEast',
			css: {},
			repeat: true
		}]
	},
	{
		actions: ['s', 'moving'],
		layers: [{
			name: 'Engines',
			title: 'character',
			tag: 'South',
			css: {},
			repeat: true
		}]
	},
	{
		actions: ['sw', 'moving'],
		layers: [{
			name: 'Engines',
			title: 'character',
			tag: 'SouthEast',
			css: css.transform(`scaleX(-1)`).style,
			repeat: true
		}]
	},
	{
		actions: ['w', 'moving'],
		layers: [{
			name: 'Engines',
			title: 'character',
			tag: 'East',
			css: css.transform(`scaleX(-1)`).style,
			repeat: true
		}]
	},
	{
		actions: ['nw', 'moving'],
		layers: [{
			name: 'Engines',
			title: 'character',
			tag: 'NorthEast',
			css: css.transform(`scaleX(-1)`).style,
			repeat: true
		}]
	},
	{
		actions: ['n'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'North',
			css: {},
			repeat: true
		}]
	},
	{
		actions: ['ne'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'NorthEast',
			css: {},
			repeat: true
		}]
	},
	{
		actions: ['e'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'East',
			css: {},
			repeat: true
		}]
	},
	{
		actions: ['se'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'SouthEast',
			css: {},
			repeat: true
		}]
	},
	{
		actions: ['s'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'South',
			css: {},
			repeat: true
		}]
	},
	{
		actions: ['sw'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'SouthEast',
			css: css.transform(`scaleX(-1)`),
			repeat: true
		}]
	},
	{
		actions: ['w'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'East',
			css: css.transform(`scaleX(-1)`),
			repeat: true
		}]
	},
	{
		actions: ['nw'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'NorthEast',
			css: css.transform(`scaleX(-1)`),
			repeat: true
		}]
	},
]