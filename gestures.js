import H from './web_modules/hammerjs.js'

export default function gestures(container, visitor){
	const mc = new H(document.body)

	mc.on("press swipe pan", visitor)

	mc.get('pan').set({ direction: H.DIRECTION_ALL })
	mc.get('swipe').set({ direction: H.DIRECTION_ALL })

	// faster than a tap
	window.addEventListener('click', e => {
		visitor({ type: 'click', center: { x: e.x, y: e.y } })
	})
	return mc
}