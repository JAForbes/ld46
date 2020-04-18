import v from './web_modules/attain/lib/view.js'
import gestures from './gestures.js'
import Loader from './loader.js'

function App({ v, state }){

	const loader = Loader()
	loader.add([
		'./frames.json',
		'./sheet.png',
		'./test.wav'
	])
	gestures(document.body, x => {
		console.log(x.type)
		// v.redraw()
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
