import V from '../web_modules/attain/lib/view.js'
import * as R from '../web_modules/ramda.js'

export default function actions({ canvases, playing: Playing, sounds, state, route, sheet, raf }){

	const prevClassNames = new WeakMap()
	const now = Date.now()

	function renderCanvas(id){
		/**
		 * @type {CanvasRenderingContext2D}
		 */
		const context = canvases()[id]
		const actor = state.actors()[id]
		const actions = actor ? actor.actions : {}
		const rendering = { ...state.rendering()[id] }
		const playing = { ...Playing()[id] }
		const indexedFrames = state.framesIndexed()
		const rules = state.rules[id]() || []

		context.canvas.width = context.canvas.width
		const applicableRules =
			rules.filter(
				rule => rule.actions.every( k => k in actions )
			)

		const applicableClassNames =
			applicableRules
				.flatMap( x => x.layers || [] )
				.flatMap( x => x.css ? [x.css] : [] )
				.map(
					x => V.css(x).class
				)

		{

			const prev = prevClassNames.get(context) || []
			const removed =
				R.difference(prev, applicableClassNames)

			const added =
				R.difference(applicableClassNames, prev)

			context.canvas.classList.add(...added)
			context.canvas.classList.remove(...removed)

			prevClassNames.set(context, applicableClassNames )
		}


		const applicableRenderKeys =
			applicableRules.flatMap(
				rule =>
					rule.layers
					? rule.layers.map(
						x => `${x.title}${x.tag}${x.name}`
					)
					: []
			)

		// 1. get the sound objects that are applicable to the current actions
		const applicableSounds =
			applicableRules
				.flatMap( x => x.sounds ? [x.sounds] : [] )
				// guarantee non empty sample list
				.flatMap( x => x.sample.length ? [x] : [])

		// 2. for each applicable sound, find if we are playing any of those sounds already for this entity
		applicableSounds.forEach(
			({ sample=['test'], repeatRate=1, repeat=false, volume=1 }) => {

				const existingI = sample.findIndex( k => k in playing )
				const existing = existingI > -1 && sample[existingI]

				if( existing ) {
					const sound = playing[existing]
					const duration = sound.duration
					const elapsed = sound.currentTime

					// cleanup expired sounds
					if( elapsed >= duration ){
						sound.pause()
						delete playing[existing]
					}
					if( repeat ) {
						const rate = elapsed / duration

						if ( rate >= repeatRate ) {
							const next = sample[(existingI+1) % sample.length]
							const snd = new Audio()
							snd.src = sounds()[next].snd.src
							playing[next] = snd
							snd.volume = volume
							snd.play()
						}
					}
				} else if (!existing) {
					const key = sample[0]
					const snd = new Audio()
					snd.src = sounds()[key].snd.src
					snd.volume = volume
					playing[key] = snd
					snd.play()
				}
			}
		)

		// 3. If we aren't, start playing the first sample
		// 4. If we are, figure out if we should start playing the next sample, if so, do so, and store it in state.playing
		const removed =
			R.difference(Object.keys(rendering), applicableRenderKeys)

		R.uniqBy( x => x, applicableRenderKeys)
		.forEach( key => {
			const time = rendering[key] || now

			const dt = now - time
			const rate = 100 // 100ms per frame (for now)
			const frames = indexedFrames[key]
			const i = Math.ceil((dt / rate)) % frames.length

			// "frame": { "x": 192, "y": 64, "w": 32, "h": 32 },
			const source = frames[i].frame
			context.drawImage( sheet(), source.x, source.y, source.w, source.h, 0, 0,  source.w, source.h)
			rendering[key] = time
		})

		removed.forEach(
			k => delete rendering[k]
		)

		// don't need to do every frame but whatever
		Object.values(playing).forEach(
			x => x.muted = state.muted()
		)

		Playing[id](playing)
		state.rendering[id]( rendering )
	}

	raf.map(
		() => {
			if( route.isGame(route()) ) {
				Object.keys(canvases()).map(renderCanvas)
			}
		}
	)
}
