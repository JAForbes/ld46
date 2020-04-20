import H from './web_modules/hammerjs.js'

export default function gestures({ container, stream }){
	const mc = new H(container)
	const out = stream.of()

	mc.on("press swipe pan panstart panend pinchstart pinch pinchend", e => {
		out(e)
	})

	mc.get('pan').set({ direction: H.DIRECTION_ALL })
	mc.get('swipe').set({ direction: H.DIRECTION_ALL })

	mc.get('pinch').set({ enable: true })

	// faster than a tap
	window.addEventListener('click', e => {
		e.center = { x: e.x, y: e.y }
		out(e)
	})
	return out
}