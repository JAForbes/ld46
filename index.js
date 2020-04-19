import V from './web_modules/attain/lib/view.js'

import gestures from './gestures.js'

import metadataService from './services/metdata.js'
import soundsClickService from './services/sound.js'
import landscapeService from './services/landscape.js'
import actionService from './services/actions.js'

import * as shipData from './data/ship.js'

const A = V.A
const css = V.css

const isMobile =
	window.matchMedia('(max-width: 600px)').matches


css.$animate.out = (time, styles) => ({ dom }) => () => new Promise(res => {
	dom.addEventListener('animationend', res, { once: true })
	dom.classList.add( css.$animate(time, styles) )
})

window.oncontextmenu = e => e.preventDefault()

function App({ v, route: parent, state, stream }){

	const sheet = stream()
	const sounds = stream()
	const canvases = stream({})
	const playing = A.Z({ stream: stream() })

	const lastGesture = stream()

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

	metadataService({ v, route, sheet, state })
		.then(
			() => soundsClickService({ v, route, state, sounds })
		)
		.then(
			() => route( route.Click() )
		)

	const dimensions = landscapeService({ v, stream })

	const raf = A.stream.raf()

	actionService({
		canvases, sounds, playing, state, route, sheet, raf
	})

	gestures(document.body, x => {
		lastGesture(x)
	})

	const relativeGesture = stream()
	const halfDimensions = dimensions.actual.map(
		({ width, height }) => ({ width: width / 2, height: height / 2 })
	)

	lastGesture.map( x =>
		(dimensions.actual().orientation == 'landscape' || true)
		? {
			type: x.type,
			x: x.center.x - halfDimensions().width
			, y: x.center.y - halfDimensions().height,

		}
		: {
			type: x.type,
			x: x.center.y - halfDimensions().height,
			y: x.center.x - halfDimensions().width
		}
	)
	.map(
		({ type, x, y }) => ({ type, x, y, theta: Math.atan2(y,x) + Math.PI / 2 })
	)
	.map( relativeGesture )

	Object.assign(window, {
		state, sheet, sounds, route, canvases, v, lastGesture,
		dimensions, relativeGesture
	})

	state.muted(true)
	state.rendering({})
	playing[1]({})
	state.dimensions({})
	state.actors({})
	state.gestureControlled({})


	relativeGesture.map( ({ theta, x, y }) =>
		Object.keys(state.gestureControlled()).filter( id => {
			return canvases()[id]
		})
		.forEach( id => {
			const context = canvases()[id]
			const canvas = context.canvas

			canvas.style.setProperty('--rotation', theta+'rad')
		})
	)

	A.stream.dropRepeats(route.$stream.map( x => x.tag )).map(
		() => {
			if( route.isGame(route())) {
				state.players[1](true)
				state.rules[1]( shipData.rules )
				state.gestureControlled[1](true)
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
					image-rendering: pixelated;
					transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) scale(var(--scale, 1)) rotate(var(--rotation, 0rad))
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
		+ v.css`
			height: 100%;
			position: absolute;
			top: 0px;
			width: var(--viewport-width);
    		height: var(--viewport-height);
		`
		,
		[ route.isMenu( route() )
			&& v('.menu'
				,
				{ key: 'menu' }
				, v('button', {
					onclick(){
						sounds().test.snd.play()
						route( route.Game() )
					}
				}, 'Play')
			)
		, route.isClick( route() ) &&
			v('.splash'
				+ v.css`
					width: var(--viewport-width);
					height: var(--viewport-height);
					background:  url('/assets/splash3.jpg');
					background-size: cover;
					opacity: 0;
					position: absolute;
					top: 0px;
					display: grid;
					justify-content: center;
					align-content: end;
					padding-bottom: 2em;
				`
				.$animate('ease-in forwards 2s', {
					to: 'o 100'
				})
				,
				{ key: 'splash'
				, onclick: () => {
					if( isMobile ) {
						document.documentElement.requestFullscreen()
						.finally(
							() => route( route.Game() )
						)
					} else {
						route(route.Game())
					}
				}
				, hook: v.css.$animate.out('0.5s', {
					from: 'o 100',
					to: 'o 0'
				})
				}
				, v('div'
					+ v.css`
						display: grid;
						justify-content: center;

						font-size: 2em;
						letter-spacing: 10px;
						padding: 0.5em 10px;
						padding-left: 20px;

						box-shadow: inset 0px 3px 4px 1px rgba(245, 73, 73, 0.5), inset -3px -9px 10px 1px rgba(0,0,0,0.5), inset 0px 0px 0px 1px rgba(0,0,0,0.5);
						border-radius: 0.25em;
						background-color: #ffffff;
						color: #d0423c;
						border: solid 1px #ffc300;
					`
					.$active(
						'opacity: 0.8;'
					)
					.$hover(`
						opacity: 0.9;
					`)
					, 'START'
				)
			)
		, route.isGame( route() )
			&& v('.game'
				+ v.css`
					position: absolute;
					top: 0px;
					left: 0px;
					width: var(--viewport-width);
					height: var(--viewport-height);
					transform-style: preserve-3d;
					perspective: 1000px;
				`
				, { key: 'game' }
				, v('.camera'
					+ v.css`
						bc purple
						transform: scale(-1,-1) translate3d(var(--x, 0px), var(--y, 0px), var(--z, 0px)) scale(-1,-1) scale(var(--scale, 1));
    					transition: 1s;
					`
					,v('.sprites'
						+ v.css`
							position: absolute;
							top: 0px;
							left: 0px;
							transform: translate( calc( 0.5 * var(--viewport-width, 100vw) ), calc(0.5 * var(--viewport-height, 100vh)) );
						`
						,Object.keys(state().rendering).map(
							id => v(Entity, { id, state, canvases })
						)
					)
				)
				,v('.hud'
					, v('button', {
						onclick(){
							sounds().test.snd.play()
							route( route.Menu() )
							// v.redraw()
						}
					}, 'Menu')
				)
			)
		]
		// why...
		.filter(Boolean)
	)
}

V(document.body, {
	render({ v, ...attrs }){
		return v(App, { v, ...attrs })
	}
})
