import V from './web_modules/attain/lib/view.js'
import * as R from './web_modules/ramda.js'

import gestures from './gestures.js'

import metadataService from './services/metdata.js'
import soundsClickService from './services/sound.js'

const A = V.A
const css = V.css

const actions = [
	// directions
	'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw',
	// other
	'firing',
	'accelerating'
]

// todo-james generate this later
const shipRules = [
	{
		actions: ['n', 'firing'],
		layers: [{
			name: 'Firing',
			title: 'character',
			tag: 'North',
			css: '',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['ne', 'firing'],
		layers: [{
			name: 'Firing',
			title: 'character',
			tag: 'NorthEast',
			css: '',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['e', 'firing'],
		layers: [{
			name: 'Firing',
			title: 'character',
			tag: 'East',
			css: '',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['se', 'firing'],
		layers: [{
			name: 'Firing',
			title: 'character',
			tag: 'SouthEast',
			css: '',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['s', 'firing'],
		layers: [{
			name: 'Firing',
			title: 'character',
			tag: 'South',
			css: '',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['sw', 'firing'],
		layers: [{
			name: 'Firing',
			title: 'character',
			tag: 'SouthEast',
			css: css.transform(`scaleX(-1)`)+'',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['w', 'firing'],
		layers: [{
			name: 'Firing',
			title: 'character',
			tag: 'East',
			css: css.transform(`scaleX(-1)`)+'',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['nw', 'firing'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'Firing',
			css: css.transform(`scaleX(-1)`)+'',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['n', 'moving'],
		layers: [{
			name: 'Engines',
			title: 'character',
			tag: 'North',
			css: '',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['ne', 'moving'],
		layers: [{
			name: 'Engines',
			title: 'character',
			tag: 'NorthEast',
			css: '',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['e', 'moving'],
		layers: [{
			name: 'Engines',
			title: 'character',
			tag: 'East',
			css: '',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['se', 'moving'],
		layers: [{
			name: 'Engines',
			title: 'character',
			tag: 'SouthEast',
			css: '',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['s', 'moving'],
		layers: [{
			name: 'Engines',
			title: 'character',
			tag: 'South',
			css: '',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['sw', 'moving'],
		layers: [{
			name: 'Engines',
			title: 'character',
			tag: 'SouthEast',
			css: css.transform(`scaleX(-1)`),
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['w', 'moving'],
		layers: [{
			name: 'Engines',
			title: 'character',
			tag: 'East',
			css: css.transform(`scaleX(-1)`),
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['nw', 'moving'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'Engines',
			css: css.transform(`scaleX(-1)`),
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['n'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'North',
			css: '',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['ne'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'NorthEast',
			css: '',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['e'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'East',
			css: '',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['se'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'SouthEast',
			css: '',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['s'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'South',
			css: '',
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['sw'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'SouthEast',
			css: css.transform(`scaleX(-1)`),
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['w'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'East',
			css: css.transform(`scaleX(-1)`),
			repeat: true
		}],
		sounds: []
	},
	{
		actions: ['nw'],
		layers: [{
			name: 'Base',
			title: 'character',
			tag: 'NorthEast',
			css: css.transform(`scaleX(-1)`),
			repeat: true
		}],
		sounds: []
	},
]

function renderCanvasService({ canvases, state, route, sheet }){

	function renderCanvas(id){
		/**
		 * @type {CanvasRenderingContext2D}
		 */
		const context = canvases()[id]
		const actor = state.actors()[id]
		const actions = actor ? actor.actions : {}
		const rendering = { ...state.rendering()[id] }
		const indexedFrames = state.framesIndexed()

		context.canvas.width = context.canvas.width
		const applicableRules =
			shipRules.filter(
				rule => rule.actions.every( k => k in actions )
			)

		const applicableKeys =
			applicableRules.flatMap(
				rule => rule.layers.map(
					x => `${x.title}${x.tag}${x.name}`
				)
			)

		const removed = R.difference(Object.keys(rendering), applicableKeys)

		R.uniqBy( x => x, applicableKeys)
		.forEach( key => {
			const time = rendering[key] || Date.now()

			const dt = Date.now() - time
			const rate = 100 // 100ms per frame (for now)
			const frames = indexedFrames[key]
			const i = Math.ceil((dt / rate)) % frames.length

			// "frame": { "x": 192, "y": 64, "w": 32, "h": 32 },
			const source = frames[i].frame
			context.drawImage( sheet(), source.x, source.y, source.w, source.h, 0, 0,  source.w, source.h)
			rendering[key] = time
		})

		removed.forEach(
			k => delete rendering[k]
		)

		state.rendering[id]( rendering )
	}

	A.stream.raf().map(
		() => {
			if( route.isGame(route()) ) {
				Object.keys(canvases()).map(renderCanvas)
			}
		}
	)
}

function App({ v, route: parent, state, stream }){

	const sheet = stream()
	const sounds = stream()
	const canvases = stream({})

	if( window.location.pathname != "/" ) {
		window.location.pathname = "/"
	}

	const route = parent.subroute('Route', x => x.Loading(), {
		Loading: '/',
		Click: '/click',
		Menu: '/menu',
		Game: '/game'
	}, {
		replace: true
	})

	Object.assign(window, { state, sheet, sounds, route, canvases, v })

	soundsClickService({ v, route, state, sounds })
	metadataService({ v, route, sheet, state })
	renderCanvasService({ canvases, state, route, sheet })

	gestures(document.body, x => {
		state.lastGesture(x)
		x.preventDefault()
		// v.redraw()
	})

	state.rendering({})
	state.dimensions({})
	state.actors({})

	A.stream.dropRepeats(route.$stream.map( x => x.tag )).map(
		() => {
			if( route.isGame(route())) {
				state.players(
					x => ({ ...x, 1: true })
				)
				state.rendering(
					x => ({
						...x,
						1: {}
					})
				)
				state.actors(
					x => ({
						...x,
						1: {
							// these actions current apply to entity 1
							actions: {
								// when that actions was added
								n: Date.now(),
								firing: Date.now(),
								moving: Date.now()
							}
						}
					})
				)
			}
		}
	)

	A.stream.dropRepeats(route.tag.$stream)
		.map( () => v.redraw() )

function Entity({ v, id, state }){
	const dimensions =
		state.dimensions()[id] || { x: 32, y: 32 }

	return () =>
		v('canvas.entity'
			+ v.css`
				position: absolute;
				top: 0px;
				left: 0px;
			`
			,
			{ id: id()
			, key: id()
			, width: dimensions.x
			, height: dimensions.y
			, hook: ({ dom }) => {
				canvases(
					({ [id()]: dom.getContext('2d') })
				)
			}

	})
}

	return () => console.log('render') || v('.app'
		, route.isLoading( route() ) && v('p', 'Loading')
		, route.isMenu( route() )
			&& v('.menu'
				, v('button', {
					onclick(){
						sounds().test.snd.play()
						route( route.Game() )
					}
				}, 'Play')
			)
		, route.isClick( route() ) && v('p', 'Click')
		, route.isGame( route() )
			&& v('.game'
				,v('.sprites'
					,v('p', 'Game')
					,Object.keys(state().rendering).map(
						id => v(Entity, { id, state, canvases })
					)
				)
				,v('.hud'
					, v('button', {
						onclick(){
							sounds().test.snd.play()
							route( route.Menu() )
						}
					}, 'Menu')
				)
			)
	)
}

V(document.body, {
	render({ v, ...attrs }){
		return v(App, { v, ...attrs })
	}
})
