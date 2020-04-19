import H from './web_modules/hammerjs.js'

export default function gestures({ container, stream }){
	const mc = new H(container)
	const out = stream.of()

	const buffer = []
	mc.on("press swipe pan pinchstart pinch pinchend", e => {
		buffer.push({ ...e, time: Date.now() })
	})

	mc.get('pan').set({ direction: H.DIRECTION_ALL })
	mc.get('swipe').set({ direction: H.DIRECTION_ALL })

	mc.get('pinch').set({ enable: true })

	// faster than a tap
	window.addEventListener('click', e => {
		buffer.push({ type: 'click', center: { x: e.x, y: e.y }, ...e, time: Date.now() })
	})

	function loop(){

		buffer.forEach( x => out(x) )
		buffer.length = 0

		requestAnimationFrame( loop )
	}

	loop()
	return out
}