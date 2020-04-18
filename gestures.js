import H from './web_modules/hammerjs.js'

export default function gestures(container, visitor){
	const mc = new H(document.body)

	mc.on("tap press swipe pan", visitor)

	mc.get('pan').set({ direction: H.DIRECTION_ALL })
	mc.get('swipe').set({ direction: H.DIRECTION_ALL })

	return mc
}