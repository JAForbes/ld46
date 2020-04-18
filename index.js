import v from './web_modules/attain/lib/view.js'

function App({ v }){
	console.log('hello ld46', v)

	return () => v('h1', 'ld46')
}

v(document.body, {
	render({ v, ...attrs }){
		return v(App, { v, ...attrs })
	}
})
