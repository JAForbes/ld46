import v from './web_modules/attain/lib/view.js'
import gestures from './gestures.js'

function App({ v }){

	gestures(document.body, x => {
		console.log(x.type)
	})

	return () => v('.game'
		,v('.hud')
		,v('.sprites')
		,v('.menu')
		,v('.loader')
	)
}

v(document.body, {
	render({ v, ...attrs }){
		return v(App, { v, ...attrs })
	}
})
