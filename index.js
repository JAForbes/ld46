import V from './web_modules/attain/lib/view.js'

import gestures from './gestures.js'

import metadataService from './services/metdata.js'
import soundsClickService from './services/sound.js'
import landscapeService from './services/landscape.js'
import actionService from './services/actions.js'
import relativeGestureService from './services/relativeGestures.js'

import * as shipData from './data/ship.js'

const A = V.A
const css = V.css

const isMobile =
	Math.min( window.innerHeight, window.innerWidth ) < 600

css.$animate.out = (time, styles) => ({ dom }) => () => new Promise(res => {
	dom.addEventListener('animationend', res, { once: true })
	dom.classList.add( css.$animate(time, styles) )
})

window.oncontextmenu = e => e.preventDefault()

function App({ v, route: parent, stream }){

	const state = {}

	console.log('mouting app')
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

	metadataService({ v, route, sheet, state })
		.then(
			() => soundsClickService({ v, route, state, sounds })
		)
		.then(
			() => route( route.Click() )
		)

	const screenDimensions = landscapeService({ v, stream })

	const raf = A.stream.raf()

	actionService({
		canvases, sounds, playing, state, route, sheet, raf
	})

	const lastGesture =
		gestures({ container: document.body, stream })

	const relativeGesture = relativeGestureService({
		stream, screenDimensions, gesture: lastGesture
	})

	const cameraEl = A.stream.of()
	const cameraScale = A.stream.of(1)

	function pinchScale(lastGesture){
		const out = A.stream.of()
		let prevPinchScale = 1
		let pinchScaleDelta = 1

		lastGesture.map( x => {

			if( x.type == 'pinch' ) {
				pinchScaleDelta = (prevPinchScale - x.scale) * -1
				prevPinchScale = x.scale
				out(pinchScaleDelta)
			}
			if(x.type.includes('pinchend')){
				prevPinchScale = 1
			}
		})
		return out
	}

	A.stream.merge([
		pinchScale (relativeGesture),
		cameraEl
	])
		.map(
			([scale, el]) => {
				const old = cameraScale()

				const MIN_SCALE = 1
				const MAX_SCALE = 10

				const newScale = Math.max(MIN_SCALE, Math.min( MAX_SCALE, ( old + scale ) ))

				el.style.setProperty('--scale', newScale)
				cameraScale(newScale)
			}
		)

	Object.assign(window, {
		state, sheet, sounds, route, canvases, v, lastGesture,
		screenDimensions, relativeGesture
	})

	state.muted = stream.of(false)
	state.rendering = A.Z({ stream: stream.of({}) })
	playing[1]({})
	state.backgroundParticleSync = A.Z({ stream: stream.of({} )})
	state.frames = A.Z({ stream: stream.of({} )})
	state.framesIndexed = A.Z({ stream: stream.of({} )})
	state.dimensions = A.Z({ stream: stream.of({}) })
	state.actors = A.Z({ stream: stream.of({} )})
	state.gestureControlled = A.Z({ stream: stream.of({}) })
	state.particles = A.Z({ stream: stream.of({}) })
	state.soundJSON = A.Z({ stream: stream.of({} )})
	state.players = A.Z({ stream: stream.of({} )})
	state.rules = A.Z({ stream: stream.of({} )})

	relativeGesture.map( ({ type }) =>
		Object.keys(state.gestureControlled()).forEach( id => {
			if ( type == 'panstart' ) {
				state.actors[id].actions.moving(Date.now())
			} else if ( type == 'panend' ) {
				state.actors[id].actions.moving.$delete()
			}
		})
	)

	const relativePan =
		A.stream.filter( x => x.type == 'pan' ) (relativeGesture)


	const panDistanceFromCenter =
		relativePan.map( ({ x, y }) => {
			return Math.sqrt( x ** 2 + y ** 2 )
		})

	A.stream.filter( x => x.type == 'panend' ) ( relativeGesture )
		.map( () => panDistanceFromCenter(Infinity) )

	A.stream.dropRepeats(panDistanceFromCenter.map( x => x < 100  ))
		.map(
			firing => Object.keys(state.gestureControlled() ).forEach( id => {
				if( firing ) {
					state.actors[id].actions.firing( Date.now() )
				} else {
					state.actors[id].actions.firing.$delete()
				}
			})
		)

	relativePan.map( ({ x, y }) => {

		Object.keys(state.gestureControlled()).map( id => {
			const particle = state.particles[id]

			particle.$mutate( o => {
				o.vx += x / 200
				o.vy += y / 200
			})

		})
	})

	raf.map( () => {
		Object.keys( state.particles() ).map( id => {
			state.particles[id].$mutate( o => {
				o.x += o.vx
				o.y += o.vy

				o.vx *= 0.95
				o.vy *= 0.95

				if( Math.abs(o.vx) < 0.001 ) {
					o.vx = 0
				}
				if( Math.abs(o.vy) < 0.001 ) {
					o.vy = 0
				}
			})
		})
	})

	relativePan.map( ({ theta, type }) =>
		Object.keys(state.gestureControlled()).filter( () => type == 'pan' ).forEach( id => {
			if (id in state.particles()) {

				const deg =
					((theta * 180 / Math.PI) + 720) % 360

				var ordinal =
					['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map( x => x.toLowerCase() )

				var ranges =
					ordinal.map(
						(x, i) => ({ x, deg: -22.5 + (i * 45) })
					)
					.map(
						({ x, deg }) => ({ x, start: deg, end: deg + 45 })
					)

				ranges.push({ x: "n", start: 337.5, end: 360 })

				const action =
					ranges.find(
						({ start, end }) => deg > start && deg <= end
					)
					.x

				const actions = state.actors[id].actions() || {}

				const oldTime = actions[action] || Date.now()
				ordinal.forEach( k => delete actions[k] )
				actions[action] = oldTime

				state.particles[id].$mutate(
					x => {
						x.theta = theta
					}
				)
				state.actors[id].$mutate(
					x => {
						x.actions = actions
					}
				)
				// state.actors[id].actions(actions)
			}
		})
	)

	A.stream.dropRepeats(route.$.$stream.map( x => x.tag )).map(
		tag => {
			console.log( tag, route().tag )
			if( route.isGame(route())) {
				console.log('setup')
				state.players[1](true)
				state.backgroundParticleSync[1](true)
				state.rules[1]( shipData.rules )
				state.gestureControlled[1](true)
				state.rendering[1]({})
				state.particles[1]({
					x: 0, y: 0, vx: 10, vy: 0, ax: 0, ay: 0, theta: 0
				})
				state.actors[1]({
					// these actions current apply to entity 1
					actions: {
						// when that actions was added
						sw: Date.now(),
						// firing: Date.now(),
						// moving: Date.now()
					}
				})
			}
		}
	)

	A.stream.dropRepeats(route.$.tag.$stream)
		.map( () => v.redraw() )

	function Entity({ v, id, state }){
		const dimensions =
			state.dimensions()[id] || { x: 32, y: 32 }

		// transform: translate3d(0,0,0) translate(var(--x, 0), var(--y, 0)) scale(var(--scale, 1), 0) rotate(var(--rotation, 0rad))
		return () =>
			v('entity'
				+ v.css`
					position: absolute;
					top: 0px;
					left: 0px;
					image-rendering: pixelated;
					width: 32px;
					height: 32px;
					transform: translate3d(0,0,0) translate(-50%, -50%) translate3d(var(--x, 0px), var(--y, 0px), var(--z, 0px)) rotate(var(--rotation, 0deg)) scale(var(--scale, 1))
				`
				,
				{ id: id()
				, key: id()
				}
			, v('canvas'
				,
				{ width: dimensions.x
				, height: dimensions.y
				, hook: ({ dom }) => {
					canvases(
						({ [id()]: dom.getContext('2d') })
					)
				}
				}
			)
		)
	}

	const backgroundCoords = stream.of({ x: 0, y: 0 })
	window.backgroundCoords = backgroundCoords
	raf.map(
		() => Object.keys(state.backgroundParticleSync()).forEach(
			id => {
				const particle = state.particles[id]()

				backgroundCoords({ x: particle.x, y: particle.y })
			}
		)
	)

	const InfiniteBackground = ({ background, coords }) => {
		return () => v('.infinite-background'
			+ v.css`
				width: 100%;
				height: 100%;
				overflow: hidden;
				position: relative;
				top: 0px;
				left: 0px;
			`
			, v('.layer'
				+ v.css`
					position: absolute;
					--x: 0px;
					--y: 0px;
					width: 400%;
					height: 400%;
					transform: translate3d(0,0,0) translate(-50%, -50%) translate3d( var(--x, 0px), var(--y, 0px), 0 );
					transition: none;
				`
				+ background()
				,
				{ hook: ({ dom }) => {
					const mathMod = (m,p) => ((m % p) + p) % p
					const tileWidth = 512
					const tileHeight = 512

					const vars =
						coords.map( ({ x, y }) => {
							const vars = {
								x: mathMod( x * -1, tileWidth ) + 'px'
								, y: mathMod( y * -1, tileHeight ) + 'px'
							}

							return vars
						})

					raf.map( () => {
						dom.style.setProperty('--x', vars().x )
						dom.style.setProperty('--y', vars().y )
					})
				}
				}
			)
		)
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
						const newRoute = route.Game()
						route( newRoute )
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
					align-content: center;
				`
				.desktop(`
					background-size: contain;
					background-position: center;
					background-repeat: no-repeat;`
				)
				.$animate('ease-in forwards 2s', {
					to: 'o 100'
				})
				,
				{ key: 'splash'
				, onclick: () => {
					const newRoute = route.Game()
					if( isMobile ) {
						document.documentElement.requestFullscreen()
						.finally(
							() => route( newRoute )
						)
					} else {
						route( newRoute )
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
						margin-top: 5em;
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
					overflow: hidden;
				`
				, { key: 'game' }

				, v(InfiniteBackground, {
					key: 'infinite-background',
					coords: backgroundCoords,
					background: v.css`
						background: url(https://2.bp.blogspot.com/-F8vJLHc7beI/Wtnn9ztqETI/AAAAAAAACQU/rb9PQCSOEuEdsKIrejFGYWjWkSnj1cL7wCLcBGAs/s1600/startile.png);
					`
				})
				, v('.camera'
					+ v.css`
						position: absolute;
						top: 0px;
						left: 0px;
						width: 0px;
						height: 0px;
						transform: translate3d(0,0,0) translate(calc( var(--viewport-width) * 0.5), calc( var(--viewport-height) * 0.5 )) scale(-1,-1) translate3d(var(--x, 0px), var(--y, 0px), var(--z, 0px)) scale(-1,-1) scale(var(--scale, 1));
						transition: 1s;
					`
					,
					{ key: 'camera'
					, hook: ({ dom }) => cameraEl(dom)
					}
					,v('.sprites'
						+ v.css`
							position: absolute;
							top: 0px;
							left: 0px;
						`
						,Object.keys(state.rendering()).map(
							id => v(Entity, { id, state, canvases })
						)
					)
				)
				,v('.hud'
					+ css`
						position: absolute;
						top: 0px;
						left: 0px;
					`
					,
					{ key: 'hud' }
					, v('button', {
						onclick(){
							sounds().test.snd.play()
							route( route.Menu() )
							// v.redraw()
						}
					}, 'Menu v1')
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
