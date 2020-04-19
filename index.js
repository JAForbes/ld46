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


	metadataService({ v, route, sheet, state })
		.then(
			() => soundsClickService({ v, route, state, sounds })
		)
		.then(
			() => route( route.Click() )
		)

	actionService({ canvases, sounds, playing, state, route, sheet })
	landscapeService({ v })

	gestures(document.body, x => {
		state.lastGesture(x)
		x.preventDefault()
		// v.redraw()
	})

	state.muted(true)
	state.rendering({})
	playing[1]({})
	state.dimensions({})
	state.actors({})

	A.stream.dropRepeats(route.$stream.map( x => x.tag )).map(
		() => {
			if( route.isGame(route())) {
				state.players[1](true)
				state.rules[1]( shipData.rules )
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
			width: 100vw;
			height: 100vh;
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
					width: 100%;
					height: 100%;
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
					width: 100%;
					height: 100%;
				`
				, { key: 'game' }
				,v('.sprites'
					+ v.css`
						position: absolute;
						top: 0px;
						left: 0px;
						transform: translate(50vw, 50vh) scale(4);
					`
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
