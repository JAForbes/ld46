import V from '../web_modules/attain/lib/view.js'
import Loader from '../loader.js'

const A = V.A

export default function soundsClickService({
	route, state, v, sounds
}){

	let soundsEmpty = true

	// function wait(){
	// 	return new Promise( Y => {
	// 		const ours = state.lastGesture.$stream.map( x => x)
	// 		A.run(
	// 			ours
	// 			, A.stream.filter(
	// 				x => x
	// 					&& x.type == 'tap'
	// 					&& soundsEmpty
	// 			)
	// 			, A.stream.dropRepeats
	// 			, A.stream.map(() => {
	// 				ours.end(true)
	// 				Y()
	// 			})
	// 		)
	// 	})
	// }

	async function onAllowed(){
		soundsEmpty = false
		const xs = state.soundJSON().sounds
		const results = await Loader({
			xs: xs.map( x => x.src )
			, v
		})

		const external = {}
		xs.map(
			({ name, path }, i) => {
				external[name] = { name, path, snd: results[i] }
			}
		)
		sounds(external)
	}


	return Promise.resolve() //  wait()
		.then(onAllowed)
}