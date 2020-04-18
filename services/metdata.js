import Loader from '../loader.js'
import * as R from '../web_modules/ramda.js'

export default function metadataService({ v, sheet, state, route }){
	Loader({
		xs: [
			'/assets/frames.json',
			'/assets/sheet.png',
			'/snd/sounds.json'
		]
		, v
	})
	.then(
		([ frames, sheetFile, sounds ]) => {
			sheet( sheetFile )

			state.frames(
				frames.frames.map(
					({ filename, ...rest }) => ({ ...rest, ...JSON.parse(filename)})
				)
			)

			const f =
				R.pipe(
					R.groupBy( x => `${x.title}${x.tag}${x.layer}` )
				)

			state.framesIndexed( f( state.frames() ) )

			state.soundJSON(sounds)

			route( route.Click() )
		}
	)
}
