import H from './web_modules/hammerjs.js'

export default function gestures({ container, stream }){
	const mc = new H(container)
	const out = stream.of()

	const buffer = new Array(100).fill(null)
	let bufferLength = 0
	mc.on("press swipe pan panstart panend pinchstart pinch pinchend", e => {
		buffer[bufferLength] = e
		bufferLength += 1
	})

	mc.get('pan').set({ direction: H.DIRECTION_ALL })
	mc.get('swipe').set({ direction: H.DIRECTION_ALL })

	mc.get('pinch').set({ enable: true })

	// faster than a tap
	window.addEventListener('click', e => {
		e.center = { x: e.x, y: e.y }
		buffer[bufferLength] = e
		bufferLength += 1
	})

	function loop(){

		for( let i = 0; i < bufferLength; i++){
			out( buffer[i] )
		}
		bufferLength = 0

		requestAnimationFrame( loop )
	}

	loop()
	return out
}