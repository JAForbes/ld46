export default function relativeGestureService({ stream, screenDimensions, gesture }){

	const relativeGesture = stream.of()
	const halfDimensions = screenDimensions.actual.map(
		({ width, height }) => ({ width: width / 2, height: height / 2 })
	)

	gesture.map( x =>
		(screenDimensions.actual().orientation == 'landscape' || true)
		? {
			type: x.type
			, x: x.center.x - halfDimensions().width
			, y: x.center.y - halfDimensions().height
			, scale: x.scale

		}
		: {
			type: x.type
			,x: x.center.y - halfDimensions().height
			,y: x.center.x - halfDimensions().width
			, scale: x.scale
		}
	)
	.map(
		({ type, x, y, scale }) => ({
			type, x, y, scale, theta:
				(Math.atan2(y,x) + Math.PI / 2)
		})
	)
	.map( relativeGesture )

	return relativeGesture
}