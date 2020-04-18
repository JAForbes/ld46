import Loader from '../loader.js'

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
			state.soundJSON(sounds)
			route( route.Click() )
		}
	)
}
