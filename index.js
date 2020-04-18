import V from './web_modules/attain/lib/view.js'
import gestures from './gestures.js'

import metadataService from './services/metdata.js'
import soundsClickService from './services/sound.js'

function App({ v, route: parent, state, stream }){

	const sheet = stream()
	const sounds = stream()
	const route = parent.subroute('Route', x => x.Loading(), {
		Loading: '/',
		Click: '/click',
		Menu: '/menu',
		Game: '/game'
	})

	Object.assign(window, { state, sheet, sounds, route })

	route( route.Loading() )

	soundsClickService({ v, route, state, sounds })
	metadataService({ v, route, sheet, state })
	gestures(document.body, x => {
		state.lastGesture(x)
		x.preventDefault()
		// v.redraw()
	})

	route.map( () => v.redraw() )

	return () => console.log('render') || v('.game'
		, route.isLoading( route() ) && v('p', 'Loading')
		, route.isMenu( route() )
			&& v('.menu'
				, v('button', {
					onclick(){
						route( route.Game() )
					}
				}, 'Play')
			)
		, route.isClick( route() ) && v('p', 'Click')
		, route.isGame( route() )
			&& v('.game'
				,v('.sprites'
					,v('p', 'Game')
				)
				,v('.hud'
					, v('button', {
						onclick(){
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
