import H from './web_modules/hammerjs.js'

export default function gestures(container, visitor){
	const mc = new H(document.body)

	mc.on("press swipe pan pinchstart pinch pinchend", visitor)

	mc.get('pan').set({ direction: H.DIRECTION_ALL })
	mc.get('swipe').set({ direction: H.DIRECTION_ALL })

	mc.get('pinch').set({ enable: true })

	// faster than a tap
	window.addEventListener('click', e => {
		visitor({ type: 'click', center: { x: e.x, y: e.y }, ...e })
	})
	return mc
}