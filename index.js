import v from './web_modules/attain/lib/view.js'
import gestures from './gestures.js'

function App({ v }){

	var lastEvent = []
	gestures(document.body, x => {
		lastEvent.unshift(x.type)
		lastEvent.length = 10
		v.redraw()
	})

	return () => v('.game'
		,v('.hud')
		,v('.sprites'
			+ v.css`
				display: grid;
			`
			, lastEvent.map( x => v('p', x) )
		)
		,v('.menu')
		,v('.loader')
	)
}

v(document.body, {
	render({ v, ...attrs }){
		return v(App, { v, ...attrs })
	}
})
