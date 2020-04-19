import V from './web_modules/attain/lib/view.js'
import * as R from './web_modules/ramda.js'

import gestures from './gestures.js'

import metadataService from './services/metdata.js'
import soundsClickService from './services/sound.js'

const A = V.A
const css = V.css

// todo-james generate this later
const shipRules = [
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
			name: 'Base',
			title: 'character',
			tag: 'Firing',
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
			name: 'Base',
			title: 'character',
			tag: 'Engines',
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

function actionService({ canvases, playing: Playing, sounds, state, route, sheet }){

	function renderCanvas(id){
		/**
		 * @type {CanvasRenderingContext2D}
		 */
		const context = canvases()[id]
		const actor = state.actors()[id]
		const actions = actor ? actor.actions : {}
		const rendering = { ...state.rendering()[id] }
		const playing = { ...Playing()[id] }
		const indexedFrames = state.framesIndexed()
		const rules = state.rules[id]() || []

		context.canvas.width = context.canvas.width
		const applicableRules =
			rules.filter(
				rule => rule.actions.every( k => k in actions )
			)

		const applicableRenderKeys =
			applicableRules.flatMap(
				rule =>
					rule.layers
					? rule.layers.map(
						x => `${x.title}${x.tag}${x.name}`
					)
					: []
			)

		// 1. get the sound objects that are applicable to the current actions
		const applicableSounds =
			applicableRules
				.flatMap( x => x.sounds ? [x.sounds] : [] )
				// guarantee non empty sample list
				.flatMap( x => x.sample.length ? [x] : [])

		// 2. for each applicable sound, find if we are playing any of those sounds already for this entity
		applicableSounds.forEach(
			({ sample=['test'], repeatRate=1, repeat=false, volume=1 }) => {

				const existingI = sample.findIndex( k => k in playing )
				const existing = existingI > -1 && sample[existingI]

				if( existing ) {
					const sound = playing[existing]
					const duration = sound.duration
					const elapsed = sound.currentTime

					// cleanup expired sounds
					if( elapsed >= duration ){
						sound.pause()
						delete playing[existing]
					}
					if( repeat ) {
						const rate = elapsed / duration

						if ( rate >= repeatRate ) {
							const next = sample[(existingI+1) % sample.length]
							const snd = new Audio()
							snd.src = sounds()[next].snd.src
							playing[next] = snd
							snd.volume = volume
							snd.play()
						}
					}
				} else if (!existing) {
					const key = sample[0]
					const snd = new Audio()
					snd.src = sounds()[key].snd.src
					snd.volume = volume
					playing[key] = snd
					snd.play()
				}
			}
		)
		// 3. If we aren't, start playing the first sample
		// 4. If we are, figure out if we should start playing the next sample, if so, do so, and store it in state.playing


		const removed =
			R.difference(Object.keys(rendering), applicableRenderKeys)

		R.uniqBy( x => x, applicableRenderKeys)
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

		Playing[id](playing)
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
	const playing = A.Z({ stream: stream() })

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
	actionService({ canvases, sounds, playing, state, route, sheet })

	gestures(document.body, x => {
		state.lastGesture(x)
		x.preventDefault()
		// v.redraw()
	})

	state.rendering({})
	playing[1]({})
	state.dimensions({})
	state.actors({})

	A.stream.dropRepeats(route.$stream.map( x => x.tag )).map(
		() => {
			if( route.isGame(route())) {
				state.players[1](true)
				state.rules[1]( shipRules )
				state.rendering[1]({})
				state.actors[1]({
					// these actions current apply to entity 1
					actions: {
						// when that actions was added
						n: Date.now(),
						firing: Date.now(),
						moving: Date.now()
					}
				})
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
